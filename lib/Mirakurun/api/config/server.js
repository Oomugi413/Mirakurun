"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = exports.get = void 0;
const config = require("../../config");
const get = (req, res) => {
    res.status(200);
    res.json(config.loadServer());
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["config"],
    operationId: "getServerConfig",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/ConfigServer"
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
const put = (req, res) => {
    const server = req.body;
    config.saveServer(server);
    res.status(200);
    res.json(server);
};
exports.put = put;
exports.put.apiDoc = {
    tags: ["config"],
    operationId: "updateServerConfig",
    parameters: [
        {
            in: "body",
            name: "body",
            schema: {
                $ref: "#/definitions/ConfigServer"
            }
        }
    ],
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/ConfigServer"
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
//# sourceMappingURL=server.js.map