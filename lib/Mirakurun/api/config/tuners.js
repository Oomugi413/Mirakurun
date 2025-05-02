"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.put = exports.get = void 0;
const config = require("../../config");
const get = (req, res) => {
    res.status(200);
    res.json(config.loadTuners());
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["config"],
    operationId: "getTunersConfig",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/ConfigTuners"
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
    const tuners = req.body;
    config.saveTuners(tuners);
    res.status(200);
    res.json(tuners);
};
exports.put = put;
exports.put.apiDoc = {
    tags: ["config"],
    operationId: "updateTunersConfig",
    parameters: [
        {
            in: "body",
            name: "body",
            schema: {
                $ref: "#/definitions/ConfigTuners"
            }
        }
    ],
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/ConfigTuners"
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
//# sourceMappingURL=tuners.js.map