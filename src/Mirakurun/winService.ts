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
import * as yaml from "js-yaml";

/**
 * Windows サービス登録 (bin/install-win-service.js) が使う純粋関数。
 *
 * Windows サービスは既定で LocalSystem・セッション 0 で動くため、ログオン中の
 * ユーザーの PATH や環境を参照できない。BonDriver や録画コマンドをユーザー環境に
 * 置いている構成では動かないため、既定ではログオン中のユーザーとしてサービスを
 * 登録し、チューナーコマンドのディレクトリを PATH へ補う。
 */

/**
 * サービスの表示名。node-windows はこれを正規化した文字列 (英数字のみ・小文字) を
 * サービス名として使う。
 */
export const SERVICE_DISPLAY_NAME = "Mirakurun";

export interface ServiceAccount {
    domain: string;
    account: string;
}

export interface ServiceEnvironmentEntry {
    name: string;
    value: string;
}

export interface ServiceEnvironmentInput {
    machinePath: string;
    /** node やチューナーコマンドなど PATH へ足したいディレクトリ */
    extraDirectories: string[];
    /** 登録するサービス名 (再起動 API がサービスを起こし直すために使う) */
    serviceName: string;
    /** サービスから参照させたいユーザー環境変数 */
    userProfile?: string;
    localAppData?: string;
}

/**
 * 表示名から node-windows が作るサービス名 (= svc.id) を求める。
 */
export function toServiceId(displayName: string): string {
    return displayName.replace(/[^\w]/gi, "").toLowerCase();
}

/**
 * サービスの実行アカウント指定を domain / account へ分解する。
 * `DOMAIN\user` / `.\user` / `user` の 3 形式を受け付け、ドメイン名の無い指定は
 * ローカルコンピュータ名を使う。
 */
export function parseServiceAccount(input: string, computerName: string): ServiceAccount | null {
    const trimmed = (input || "").trim();
    if (trimmed === "") {
        return null;
    }

    const separator = trimmed.lastIndexOf("\\");
    if (separator === -1) {
        return { domain: computerName, account: trimmed };
    }

    const domain = trimmed.slice(0, separator);
    const account = trimmed.slice(separator + 1);
    if (account === "") {
        return null;
    }

    return {
        domain: domain === "" || domain === "." ? computerName : domain,
        account: account
    };
}

/**
 * 既定の実行アカウント (サービスを登録しようとしているユーザー) を求める。
 * `DOMAIN\user` 形式。求められない場合は空文字列。
 */
export function defaultServiceAccountName(env: NodeJS.ProcessEnv): string {
    const account = env.USERNAME || "";
    if (account === "") {
        return "";
    }

    const domain = env.USERDOMAIN || env.COMPUTERNAME || "";

    return domain === "" ? account : `${domain}\\${account}`;
}

/**
 * コマンド行の先頭にある実行ファイルのパスを取り出す。
 * `"C:/Program Files/foo.exe" --arg` のように引用符で囲まれている場合も扱う。
 */
export function extractExecutablePath(command: string): string | null {
    const trimmed = (command || "").trim();
    if (trimmed === "") {
        return null;
    }

    if (trimmed[0] === "\"" || trimmed[0] === "'") {
        const quote = trimmed[0];
        const end = trimmed.indexOf(quote, 1);

        return end === -1 ? null : trimmed.slice(1, end);
    }

    const end = trimmed.search(/\s/);

    return end === -1 ? trimmed : trimmed.slice(0, end);
}

/**
 * tuners.yml の command / decoder からチューナーコマンドのディレクトリを集める。
 * PATH 上のコマンド名だけを書いている場合 (`recpt1` 等) は対象外。
 */
export function collectTunerDirectories(tunersYaml: string): string[] {
    let tuners: any;
    try {
        tuners = yaml.load(tunersYaml);
    } catch (e) {
        return [];
    }
    if (Array.isArray(tuners) === false) {
        return [];
    }

    const result: string[] = [];
    for (const tuner of tuners) {
        if (tuner === null || typeof tuner !== "object") {
            continue;
        }

        for (const key of ["command", "decoder"]) {
            const value = tuner[key];
            if (typeof value !== "string") {
                continue;
            }

            const executable = extractExecutablePath(value);
            if (executable === null || /[\\/]/.test(executable) === false) {
                continue;
            }

            const directory = executable.replace(/[\\/][^\\/]*$/, "");
            if (directory !== "" && result.includes(directory) === false) {
                result.push(directory);
            }
        }
    }

    return result;
}

/**
 * サービスへ渡す PATH を組み立てる。
 * マシン全体の PATH を土台に、ユーザースコープにしか無いことが多いディレクトリを後ろへ追加する。
 */
export function buildServicePath(machinePath: string, extraDirectories: string[]): string {
    const entries: string[] = [];

    for (const entry of (machinePath || "").split(";")) {
        const normalized = entry.trim().replace(/[\\/]+$/, "");
        if (normalized !== "" && entries.includes(normalized) === false) {
            entries.push(normalized);
        }
    }
    for (const directory of extraDirectories) {
        const normalized = (directory || "").trim().replace(/[\\/]+$/, "");
        if (normalized !== "" && entries.includes(normalized) === false) {
            entries.push(normalized);
        }
    }

    return entries.join(";");
}

/**
 * サービスへ渡す環境変数を組み立てる。
 * USERPROFILE / LOCALAPPDATA は設定ファイルの位置解決に使うため引き継ぐ。
 */
export function buildServiceEnvironment(input: ServiceEnvironmentInput): ServiceEnvironmentEntry[] {
    const entries: ServiceEnvironmentEntry[] = [
        { name: "Path", value: buildServicePath(input.machinePath, input.extraDirectories) }
    ];

    if (typeof input.userProfile === "string" && input.userProfile !== "") {
        entries.push({ name: "USERPROFILE", value: input.userProfile });
    }
    if (typeof input.localAppData === "string" && input.localAppData !== "") {
        entries.push({ name: "LOCALAPPDATA", value: input.localAppData });
    }
    // 再起動 API (PUT /api/restart) がサービスを起こし直すために使う
    entries.push({ name: "MIRAKURUN_WIN_SERVICE_NAME", value: input.serviceName });
    // 既存のサービス定義から引き継いでいる目印 (Windows サービスとして動いていることを示す)
    entries.push({ name: "USING_WINSER", value: "1" });

    return entries;
}

/**
 * Windows サービスとして登録されている名前を返す。
 * `sc start` へ渡すため、シェルに影響しない書式だけを受け付ける。
 */
export function getWindowsServiceName(env: NodeJS.ProcessEnv): string {
    const value = env.MIRAKURUN_WIN_SERVICE_NAME;

    return typeof value === "string" && /^[A-Za-z0-9._-]{1,64}$/.test(value)
        ? value
        : toServiceId(SERVICE_DISPLAY_NAME);
}
