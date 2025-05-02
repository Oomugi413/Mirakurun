"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const api = require("../../api");
const _1 = require("../../_");
exports.parameters = [
    {
        in: "path",
        name: "id",
        type: "integer",
        minimum: 10000000000,
        maximum: 655356553565535,
        required: true
    }
];
const get = (req, res) => {
    const program = _1.default.program.get(req.params.id);
    if (program === null) {
        api.responseError(res, 404);
        return;
    }
    res.json(program);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["programs"],
    operationId: "getProgram",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/Program"
            }
        },
        404: {
            description: "Not Found",
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
//# sourceMappingURL=%7Bid%7D.js.map