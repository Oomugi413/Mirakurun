"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const api = require("../../../api");
const _1 = require("../../../_");
const common_1 = require("../../../common");
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
    }
];
const get = (req, res) => {
    const channel = _1.default.channel.get(req.params.type, req.params.channel);
    if (channel === null) {
        api.responseError(res, 404);
        return;
    }
    const body = channel.toJSON();
    body.services = channel.getServices().map(service => ({
        id: service.id,
        serviceId: service.serviceId,
        networkId: service.networkId,
        name: service.name
    }));
    res.json(body);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["channels"],
    operationId: "getChannel",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/Channel"
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
//# sourceMappingURL=%7Bchannel%7D.js.map