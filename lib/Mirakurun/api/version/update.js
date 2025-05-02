"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = void 0;
const path_1 = require("path");
const child_process_1 = require("child_process");
const os_1 = require("os");
const tail_1 = require("tail");
const latest_version_1 = require("latest-version");
const api = require("../../api");
const current = require("../../../../package.json").version;
const put = async (req, res) => {
    if (!req.query.force && !process.env.pm_uptime && !process.env.USING_WINSER) {
        api.responseError(res, 500);
        return;
    }
    const latest = await (0, latest_version_1.default)("mirakurun");
    if (!req.query.force && current === latest) {
        api.responseError(res, 409, "Update Nothing");
        return;
    }
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(202);
    res.write("Updating...\n");
    const path = (0, path_1.join)((0, os_1.tmpdir)(), "Mirakurun_Updating.log");
    res.write("> node lib/updater\n\n");
    const env = JSON.parse(JSON.stringify(process.env));
    env.UPDATER_LOG_PATH = path;
    const npm = (0, child_process_1.spawn)("node", ["lib/updater"], {
        detached: true,
        stdio: "ignore",
        env
    });
    npm.unref();
    const tail = new tail_1.Tail(path);
    tail.on("line", data => res.write(data + "\n"));
    req.once("close", () => {
        tail.removeAllListeners("line");
        tail.unwatch();
    });
};
exports.put = put;
exports.put.apiDoc = {
    tags: ["version"],
    operationId: "updateVersion",
    produces: [
        "text/plain",
        "application/json"
    ],
    parameters: [
        {
            in: "query",
            name: "force",
            type: "boolean",
            required: false
        }
    ],
    responses: {
        202: {
            description: "Accepted"
        },
        409: {
            description: "Update Nothing",
            schema: {
                $ref: "#/definitions/Error"
            }
        },
        default: {
            description: "Unexpected Error",
            schema: {
                $ref: "#/definitions/Error"
            }
        }
    }
};
//# sourceMappingURL=update.js.map