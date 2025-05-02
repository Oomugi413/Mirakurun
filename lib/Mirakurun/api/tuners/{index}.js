"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const api = require("../../api");
const _1 = require("../../_");
exports.parameters = [
    {
        in: "path",
        name: "index",
        type: "integer",
        minimum: 0,
        required: true
    }
];
const get = (req, res) => {
    const tuner = _1.default.tuner.get(req.params.index);
    if (tuner === null) {
        api.responseError(res, 404);
        return;
    }
    api.responseJSON(res, tuner);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["tuners"],
    operationId: "getTuner",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/TunerDevice"
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
//# sourceMappingURL=%7Bindex%7D.js.map