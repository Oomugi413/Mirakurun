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
 * Mirakurun を Windows サービスとして登録する。
 *
 *   npm run install-win-service
 *   node bin/install-win-service.js --user=".\mirakurun"
 *   node bin/install-win-service.js --system
 *
 * オプション:
 *   --user=<アカウント>      サービスの実行アカウント (既定はログオン中のユーザー)
 *   --password=<パスワード>  省略時は対話で入力を求める (入力は伏せ字になる)
 *   --system                 LocalSystem として動かす (パスワードを持たないアカウント向け)
 *   --name=<表示名>          サービスの表示名 (既定は Mirakurun)。1 台で複数の
 *                            Mirakurun を動かす場合に使う。uninstall / status でも
 *                            同じ --name を渡すこと
 *
 * node-windows はグローバルインストールしたものを使う。
 *   > npm install -g node-windows
 *   > npm link node-windows
 *
 * 既定でログオン中のユーザーとして登録するのは、LocalSystem だとユーザー環境に置いた
 * BonDriver・録画コマンド・設定へ手が届かないため。
 */

// serviceName は --name で変わるため、モジュールオブジェクト経由で参照する
const winService = require("./win-service");
const { createService, isAdministrator, parseArgs, queryService, resolveLogOnAccount } = winService;

async function main() {
    if (process.platform !== "win32") {
        throw new Error("このスクリプトは Windows でのみ使用できます。");
    }
    if (isAdministrator() === false) {
        throw new Error("管理者権限で実行してください (コマンドプロンプトを「管理者として実行」)。");
    }

    const { options } = parseArgs(process.argv.slice(2));
    // --name は全スクリプト共通 (別名で登録できるようにする)
    winService.applyServiceName(options);

    if (queryService() !== null) {
        throw new Error(
            `サービス ${winService.serviceName} は既に登録されています。` +
            "先に \"npm run uninstall-win-service\" を実行してください。"
        );
    }

    const logOnAccount = await resolveLogOnAccount(options);
    const svc = createService(logOnAccount);

    svc.on("install", () => {
        console.log(
            logOnAccount === null
                ? `サービスをインストールしました: ${winService.serviceName} (LocalSystem)`
                : `サービスをインストールしました: ${winService.serviceName} (${logOnAccount.domain}\\${logOnAccount.account})`
        );
        if (logOnAccount !== null) {
            console.log("録画データ・ログの出力先に、このアカウントの書き込み権限があることを確認してください。");
        }
        console.log("起動します...");
        svc.start();
    });

    svc.on("alreadyinstalled", () => {
        console.log("サービスは既にインストールされています。");
    });

    svc.on("invalidinstallation", () => {
        console.error("無効なインストールです。");
    });

    svc.on("error", err => {
        console.error("サービスのインストール中にエラーが発生しました:", err);
    });

    svc.install();
}

main().catch(err => {
    console.error(err.message);
    process.exitCode = 1;
});
