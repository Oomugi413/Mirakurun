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
 * Mirakurun の Windows サービス登録を解除する。
 *
 *   npm run uninstall-win-service
 *
 * node-windows の uninstall() は内部でサービスを停止してから削除する。
 */

const { createService, isAdministrator, serviceName } = require("./win-service");

if (process.platform !== "win32") {
    console.error("このスクリプトは Windows でのみ使用できます。");
    process.exit(1);
}
if (isAdministrator() === false) {
    console.error("管理者権限で実行してください (コマンドプロンプトを「管理者として実行」)。");
    process.exit(1);
}

const svc = createService(null);

svc.on("uninstall", () => {
    console.log(`サービスをアンインストールしました: ${serviceName}`);
});

svc.on("alreadyuninstalled", () => {
    console.log(`サービス ${serviceName} は登録されていません。`);
});

svc.on("error", err => {
    console.error("サービスのアンインストール中にエラーが発生しました:", err);
});

svc.uninstall();
