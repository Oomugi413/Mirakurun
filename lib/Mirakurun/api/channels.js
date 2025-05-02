"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const sift_1 = require("sift");
const api = require("../api");
const _1 = require("../_");
const common_1 = require("../common");
const get = (req, res) => {
    const channels = _1.default.channel.items.map(channel => {
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
    operationId: "getChannels",
    parameters: [
        {
            in: "query",
            name: "type",
            type: "string",
            enum: Object.keys(common_1.ChannelTypes),
            required: false
        },
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
//# sourceMappingURL=channels.js.map