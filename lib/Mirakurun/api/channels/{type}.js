"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const sift_1 = require("sift");
const api = require("../../api");
const _1 = require("../../_");
const common_1 = require("../../common");
exports.parameters = [
    {
        in: "path",
        name: "type",
        type: "string",
        enum: Object.keys(common_1.ChannelTypes),
        required: true
    }
];
const get = (req, res) => {
    const channels = _1.default.channel.findByType(req.params.type).map(channel => {
        const ch = channel.toJSON();
        ch.services = channel.getServices().map(service => ({
            id: service.id,
            serviceId: service.serviceId,
            networkId: service.networkId,
            name: service.name
        }));
        return ch;
    }).filter((0, sift_1.default)(req.query));
    api.responseJSON(res, channels);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["channels"],
    operationId: "getChannelsByType",
    parameters: [
        {
            in: "query",
            name: "channel",
            type: "string",
            required: false
        },
        {
            in: "query",
            name: "name",
            type: "string",
            required: false
        }
    ],
    responses: {
        200: {
            description: "OK",
            schema: {
                type: "array",
                items: {
                    $ref: "#/definitions/Channel"
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
//# sourceMappingURL=%7Btype%7D.js.map