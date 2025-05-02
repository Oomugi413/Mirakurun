"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const api = require("../api");
const _1 = require("../_");
const get = (req, res) => {
    api.responseJSON(res, _1.default.tuner.devices);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["tuners"],
    operationId: "getTuners",
    responses: {
        200: {
            description: "OK",
            schema: {
                type: "array",
                items: {
                    $ref: "#/definitions/TunerDevice"
                }
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