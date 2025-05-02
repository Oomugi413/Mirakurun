"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.del = exports.get = exports.parameters = void 0;
const api = require("../../../api");
const _1 = require("../../../_");
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
    if (tuner === null || Number.isInteger(tuner.pid) === false) {
        api.responseError(res, 404);
        return;
    }
    api.responseJSON(res, { pid: tuner.pid });
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["tuners"],
    summary: "Get Tuner Process Info",
    operationId: "getTunerProcess",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/TunerProcess"
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
const del = (req, res) => {
    const tuner = _1.default.tuner.get(req.params.index);
    if (tuner === null || Number.isInteger(tuner.pid) === false) {
        api.responseError(res, 404);
        return;
    }
    tuner.kill()
        .then(() => api.responseJSON(res, { pid: null }))
        .catch((error) => api.responseError(res, 500, error.message));
};
exports.del = del;
exports.del.apiDoc = {
    tags: ["tuners"],
    summary: "Kill Tuner Process",
    operationId: "killTunerProcess",
    responses: {
        200: {
            description: "OK",
            schema: {
                type: "object",
                properties: {
                    pid: {
                        type: "null"
                    }
                }
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
//# sourceMappingURL=process.js.map