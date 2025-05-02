"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const api = require("../api");
const _1 = require("../_");
const get = (req, res) => {
    let programs;
    programs = Object.keys(req.query).length !== 0 ? _1.default.program.findByQuery(req.query) : Array.from(_1.default.program.itemMap.values());
    api.responseJSON(res, programs);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["programs"],
    operationId: "getPrograms",
    parameters: [
        {
            in: "query",
            name: "networkId",
            type: "integer",
            required: false
        },
        {
            in: "query",
            name: "serviceId",
            type: "integer",
            required: false
        },
        {
            in: "query",
            name: "eventId",
            type: "integer",
            required: false
        }
    ],
    responses: {
        200: {
            description: "OK",
            schema: {
                type: "array",
                items: {
                    $ref: "#/definitions/Program"
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
//# sourceMappingURL=programs.js.map