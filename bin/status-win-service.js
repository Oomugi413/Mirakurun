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
 * Windows サービスの登録状況と、サービスから見える実行環境を表示する。
 * 管理者権限は不要。
 *
 *   npm run status-win-service
 *   node bin/status-win-service.js --name="Mirakurun Sub"
 */

const path = require("path");
// serviceName は --name で変わるため、モジュールオブジェクト経由で参照する
const winService = require("./win-service");
const { createEnvironment, findCommandDirectory, parseArgs, queryService, root } = winService;

if (process.platform !== "win32") {
    console.error("このスクリプトは Windows でのみ使用できます。");
    process.exit(1);
}

const { options } = parseArgs(process.argv.slice(2));
winService.applyServiceName(options);

const existing = queryService();

console.log(`Mirakurun のディレクトリ: ${root}`);
console.log(`表示名: ${winService.displayName}`);
console.log(`サービス名: ${winService.serviceName}`);

if (existing === null) {
    console.log("登録状況: 未登録");
} else {
    console.log("登録状況: 登録済み");
    // 実行アカウントは sc.exe qc の SERVICE_START_NAME に出る
    const startName = existing.split(/\r?\n/).find(line => line.includes("SERVICE_START_NAME"));
    if (typeof startName === "string") {
        console.log(`実行アカウント: ${startName.split(":").slice(1).join(":").trim()}`);
    }
}

const nodeDirectory = findCommandDirectory("node");
console.log(`node: ${nodeDirectory === null ? "見つかりません" : path.join(nodeDirectory, "node")}`);

for (const entry of createEnvironment()) {
    console.log(`${entry.name}=${entry.value}`);
}
