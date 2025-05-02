"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const latest_version_1 = require("latest-version");
const api = require("../api");
const pkg = require("../../../package.json");
const get = async (req, res) => {
    const version = {
        current: pkg.version,
        latest: await (0, latest_version_1.default)("mirakurun")
    };
    api.responseJSON(res, version);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["version"],
    operationId: "checkVersion",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/Version"
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
//# sourceMappingURL=version.js.map