"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const api = require("../../../../api");
const _1 = require("../../../../_");
const common_1 = require("../../../../common");
exports.parameters = [
    {
        in: "path",
        name: "type",
        type: "string",
        enum: Object.keys(common_1.ChannelTypes),
        required: true
    },
    {
        in: "path",
        name: "channel",
        type: "string",
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
    const channel = _1.default.channel.get(req.params.type, req.params.channel);
    if (channel === null) {
        api.responseError(res, 404);
        return;
    }
    let requestAborted = false;
    req.once("close", () => requestAborted = true);
    res.socket._writableState.highWaterMark = Math.max(res.writableHighWaterMark, 1024 * 1024 * 16);
    res.socket.setNoDelay(true);
    const userId = (req.ip || "unix") + ":" + (req.socket.remotePort || Date.now());
    channel.getStream({
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
    })
        .catch((err) => api.responseStreamErrorHandler(res, err));
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["channels", "stream"],
    operationId: "getChannelStream",
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