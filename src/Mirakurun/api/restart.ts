/*
   Copyright 2017 kanreisa

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
import { Operation } from "express-openapi";
import { spawn } from "child_process";
import * as api from "../api";
import { getWindowsServiceName } from "../winService";

/** 停止処理が終わるのを待ってから sc start を投げるまでの秒数 (ping の回数) */
const SERVICE_START_WAIT_SEC = 8;
/** レスポンスを返しきってから終了するまでの待ち時間 */
const EXIT_DELAY_MS = 1000;

export const put: Operation = (req, res) => {
    if (process.env.pm_uptime) {
        const cmd = spawn("pm2", ["restart", "mirakurun-server"], {
            detached: true,
            stdio: "ignore"
        });
        cmd.unref();

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.status(202);
        res.end(JSON.stringify({ _cmd_pid: cmd.pid }));
    } else if (process.env.USING_WINSER) {
        // node-windows の wrapper は子プロセスが終了すると自動で起動し直すため、
        // 自分で終了するだけで新しいプロセスへ入れ替わる。
        // 従来は `net stop` でサービスごと止めていたが、その子プロセスとして起動した
        // cmd.exe も一緒に終了させられるうえ、`sc start mirakurun.exe` はサービス名が
        // 誤っていた (正しくは `mirakurun`) ため、停止したまま起き上がらなかった。
        //
        // sc.exe から直接登録された環境など wrapper が居ない場合に備えて、
        // プロセスツリーから切り離した cmd.exe に遅延させた `sc start` も投げておく
        // (既に起動していればエラー 1056 になるだけで害はない)。
        // サービス環境では `timeout` コマンドが使えないため ping で待ち合わせる。
        const serviceName = getWindowsServiceName(process.env);
        const cmd = spawn("cmd", ["/c", `ping -n ${SERVICE_START_WAIT_SEC} 127.0.0.1 > nul & sc start "${serviceName}"`], {
            detached: true,
            stdio: "ignore",
            windowsHide: true
        });
        cmd.unref();

        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.status(202);
        res.end(JSON.stringify({ _cmd_pid: cmd.pid }));

        setTimeout(() => process.exit(0), EXIT_DELAY_MS).unref();
    } else if (process.env.DOCKER === "YES") {
        res.status(202);
        res.end(JSON.stringify({ _exit: 0 }));
        setTimeout(() => process.kill(parseInt(process.env.INIT_PID, 10), 1), 0);
    } else {
        api.responseError(res, 500);
    }
};

put.apiDoc = {
    tags: ["misc"],
    summary: "Restart Mirakurun",
    operationId: "restart",
    produces: [
        "application/json"
    ],
    responses: {
        202: {
            description: "Accepted"
        },
        default: {
            description: "Unexpected Error",
            schema: {
                $ref: "#/definitions/Error"
            }
        }
    }
};
