"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = exports.get = void 0;
const config = require("../../config");
const get = (req, res) => {
    res.status(200);
    res.json(config.loadChannels());
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["config"],
    operationId: "getChannelsConfig",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/ConfigChannels"
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
    const channels = req.body;
    config.saveChannels(channels);
    res.status(200);
    res.json(channels);
};
exports.put = put;
exports.put.apiDoc = {
    tags: ["config"],
    operationId: "updateChannelsConfig",
    parameters: [
        {
            in: "body",
            name: "body",
            schema: {
                $ref: "#/definitions/ConfigChannels"
            }
        }
    ],
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/ConfigChannels"
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
//# sourceMappingURL=channels.js.map