"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const api = require("../../../api");
const _1 = require("../../../_");
exports.parameters = [
    {
        in: "path",
        name: "id",
        type: "integer",
        minimum: 10000000000,
        maximum: 655356553565535,
        required: true
    },
    {
        in: "header",
        name: "X-Mirakurun-Priority",
        type: "integer",
        minimum: 0
    },
    {
        in: "query",
        name: "decode",
        type: "integer",
        minimum: 0,
        maximum: 1
    }
];
const get = (req, res) => {
    const program = _1.default.program.get(req.params.id);
    if (program === null) {
        api.responseError(res, 404);
        return;
    }
    let requestAborted = false;
    req.once("close", () => requestAborted = true);
    res.socket._writableState.highWaterMark = Math.max(res.writableHighWaterMark, 1024 * 1024 * 16);
    res.socket.setNoDelay(true);
    const userId = (req.ip || "unix") + ":" + (req.socket.remotePort || Date.now());
    _1.default.tuner.initProgramStream(program, {
        id: userId,
        priority: parseInt(req.get("X-Mirakurun-Priority"), 10) || 0,
        agent: req.get("User-Agent"),
        url: req.url,
        disableDecoder: (req.query.decode === 0)
    }, res)
        .then(tsFilter => {
        if (requestAborted === true || req.aborted === true) {
            return tsFilter.close();
        }
        req.once("close", () => tsFilter.close());
        res.setHeader("Content-Type", "video/MP2T");
        res.setHeader("X-Mirakurun-Tuner-User-ID", userId);
        res.status(200);
        req.setTimeout(1000 * 60 * 10);
    })
        .catch((err) => api.responseStreamErrorHandler(res, err));
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["programs", "stream"],
    operationId: "getProgramStream",
    produces: ["video/MP2T"],
    responses: {
        200: {
            description: "OK",
            headers: {
                "X-Mirakurun-Tuner-User-ID": {
                    type: "string"
                }
            }
        },
        404: {
            description: "Not Found"
        },
        503: {
            description: "Tuner Resource Unavailable"
        },
        default: {
            description: "Unexpected Error"
        }
    }
};
//# sourceMappingURL=stream.js.map