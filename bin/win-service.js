/*
   Copyright 2016 kanreisa

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
"use strict";

/**
 * Windows サービスの登録 / 解除で共通して使う処理。
 *
 * サービスは既定で LocalSystem・セッション 0 で動くため、ログオン中のユーザーの
 * PATH や環境を参照できない。BonDriver や録画コマンドをユーザー環境に置いている
 * 構成では動かないため、既定ではログオン中のユーザーとしてサービスを登録する。
 */

const fs = require("fs");
const path = require("path");
const readline = require("readline");
const { spawnSync } = require("child_process");

const {
    SERVICE_DISPLAY_NAME,
    buildServiceEnvironment,
    collectTunerDirectories,
    defaultServiceAccountName,
    parseServiceAccount,
    toServiceId
} = require("../lib/Mirakurun/winService");

const root = path.resolve(__dirname, "..");
const scriptPath = path.join(root, "bin", "init.win32.js");
const serviceName = toServiceId(SERVICE_DISPLAY_NAME);

/**
 * 引数を { command, options } に分解する。
 */
function parseArgs(argv) {
    const options = {};
    let command = null;

    for (const arg of argv) {
        const matched = arg.match(/^--([^=]+)(?:=(.*))?$/);
        if (matched === null) {
            if (command === null) {
                command = arg;
            }
            continue;
        }
        options[matched[1]] = matched[2] === undefined ? true : matched[2];
    }

    return { command: command, options: options };
}

/**
 * 管理者権限で動いているか (net session は管理者以外では失敗する)。
 */
function isAdministrator() {
    const result = spawnSync("net", ["session"], { windowsHide: true, stdio: "ignore" });

    return result.error === undefined && result.status === 0;
}

/**
 * コマンドの実体があるディレクトリ (見つからない場合は null)。
 */
function findCommandDirectory(name) {
    const result = spawnSync("where", [name], { encoding: "utf8", windowsHide: true });
    if (result.error !== undefined || result.status !== 0 || typeof result.stdout !== "string") {
        return null;
    }

    const first = result.stdout.split(/\r?\n/).find(line => line.trim() !== "");

    return typeof first === "string" ? path.dirname(first.trim()) : null;
}

/**
 * サービスへ渡す環境変数を組み立てる。
 */
function createEnvironment() {
    const extraDirectories = [];

    const nodeDirectory = findCommandDirectory("node");
    if (nodeDirectory !== null) {
        extraDirectories.push(nodeDirectory);
    }

    // tuners.yml に絶対パスで書かれた BonDriver / 録画コマンド / デコーダ
    const tunersPath = path.join(root, "local_config", "tuners.yml");
    if (fs.existsSync(tunersPath) === true) {
        for (const directory of collectTunerDirectories(fs.readFileSync(tunersPath, "utf8"))) {
            extraDirectories.push(directory);
        }
    }

    return buildServiceEnvironment({
        machinePath: process.env.Path || process.env.PATH || "",
        extraDirectories: extraDirectories,
        userProfile: process.env.USERPROFILE,
        localAppData: process.env.LOCALAPPDATA
    });
}

/**
 * sc.exe qc の出力を取る (サービスが無い場合は null)。
 */
function queryService() {
    const result = spawnSync("sc.exe", ["qc", serviceName], { encoding: "utf8", windowsHide: true });
    if (result.error !== undefined || result.status !== 0) {
        return null;
    }

    return typeof result.stdout === "string" ? result.stdout : null;
}

function readLine(query) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

    return new Promise(resolve => {
        rl.question(query, answer => {
            rl.close();
            resolve(answer);
        });
    });
}

/**
 * 文字を伏せ字にしてパスワードを読み取る。
 * 入力されたパスワードは Windows のサービス設定へ渡す以外の用途には使わない。
 */
function readPassword(account) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const query = `${account} のパスワードを入力してください: `;

    rl._writeToOutput = value => {
        if (value.includes(query) === true) {
            rl.output.write(query);
        } else if (value === "\r\n" || value === "\n") {
            rl.output.write(value);
        } else {
            rl.output.write("*");
        }
    };

    return new Promise(resolve => {
        rl.question(query, answer => {
            rl.close();
            process.stdout.write("\n");
            resolve(answer);
        });
    });
}

/**
 * サービスの実行アカウントを決める。
 * 既定はログオン中のユーザー。--system が指定された場合のみ LocalSystem にする。
 */
async function resolveLogOnAccount(options) {
    if (options.system === true) {
        return null;
    }

    const computerName = process.env.COMPUTERNAME || ".";
    const fallback = defaultServiceAccountName(process.env);

    let input = typeof options.user === "string" && options.user !== "" ? options.user : null;
    if (input === null) {
        const answer = await readLine(`サービスの実行ユーザー名 [${fallback}]: `);
        input = answer.trim() === "" ? fallback : answer;
    }

    const account = parseServiceAccount(input, computerName);
    if (account === null) {
        throw new Error("サービスの実行ユーザー名を判別できませんでした。--user で指定するか --system を使用してください。");
    }

    const password = typeof options.password === "string"
        ? options.password
        : await readPassword(`${account.domain}\\${account.account}`);
    if (password === "") {
        throw new Error(
            "パスワードが空です。Microsoft アカウントでサインインしている場合は、ローカルアカウントに切り替えて" +
            "パスワードを設定してから実行してください (LocalSystem で動かす場合は --system を付けてください)。"
        );
    }

    return { domain: account.domain, account: account.account, password: password };
}

/**
 * サービスの定義を作る。
 * @param logOnAccount 実行アカウント (null なら LocalSystem)
 */
function createService(logOnAccount) {
    const { Service } = require("node-windows");

    const svc = new Service({
        name: SERVICE_DISPLAY_NAME,
        description: "Mirakurun EPG and Stream Server",
        script: scriptPath,
        startType: "auto",
        env: createEnvironment(),
        logmode: "rotate",
        logpath: path.join(root, "local_data"),
        // 指定したアカウントに「サービスとしてログオン」権限を付与させる
        allowServiceLogon: !!logOnAccount
    });

    if (logOnAccount) {
        svc.logOnAs.domain = logOnAccount.domain;
        svc.logOnAs.account = logOnAccount.account;
        svc.logOnAs.password = logOnAccount.password;
        // 登録後に設定ファイルからパスワードを消す
        svc.logOnAs.mungeCredentialsAfterInstall = true;
    }

    return svc;
}

module.exports = {
    root: root,
    serviceName: serviceName,
    parseArgs: parseArgs,
    isAdministrator: isAdministrator,
    findCommandDirectory: findCommandDirectory,
    createEnvironment: createEnvironment,
    queryService: queryService,
    resolveLogOnAccount: resolveLogOnAccount,
    createService: createService
};
