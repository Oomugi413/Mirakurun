"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = void 0;
const child_process_1 = require("child_process");
const api = require("../api");
const put = (req, res) => {
    if (process.env.pm_uptime) {
        const cmd = (0, child_process_1.spawn)("pm2", ["restart", "mirakurun-server"], {
            detached: true,
            stdio: "ignore"
        });
        cmd.unref();
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.status(202);
        res.end(JSON.stringify({ _cmd_pid: cmd.pid }));
    }
    else if (process.env.USING_WINSER) {
        const cmd = (0, child_process_1.spawn)("cmd", ["/c", "net stop mirakurun & timeout 2 & sc start mirakurun"], {
            detached: true,
            stdio: "ignore"
        });
        cmd.unref();
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.status(202);
        res.end(JSON.stringify({ _cmd_pid: cmd.pid }));
    }
    else if (process.env.DOCKER === "YES") {
        res.status(202);
        res.end(JSON.stringify({ _exit: 0 }));
        setTimeout(() => process.kill(parseInt(process.env.INIT_PID, 10), 1), 0);
    }
    else {
        api.responseError(res, 500);
    }
};
exports.put = put;
exports.put.apiDoc = {
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
//# sourceMappingURL=restart.js.map