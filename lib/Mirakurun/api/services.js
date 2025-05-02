"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const sift_1 = require("sift");
const api = require("../api");
const _1 = require("../_");
const Service_1 = require("../Service");
const common_1 = require("../common");
const get = async (req, res) => {
    const serviceItems = [..._1.default.service.items];
    serviceItems.sort((a, b) => a.getOrder() - b.getOrder());
    const services = [];
    for (const serviceItem of serviceItems.filter((0, sift_1.default)(req.query))) {
        services.push({
            ...serviceItem.export(),
            hasLogoData: await Service_1.default.isLogoDataExists(serviceItem.networkId, serviceItem.serviceId, serviceItem.logoId)
        });
    }
    api.responseJSON(res, services);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["services"],
    operationId: "getServices",
    parameters: [
        {
            in: "query",
            name: "serviceId",
            type: "integer",
            required: false
        },
        {
            in: "query",
            name: "networkId",
            type: "integer",
            required: false
        },
        {
            in: "query",
            name: "name",
            type: "string",
            required: false
        },
        {
            in: "query",
            name: "type",
            type: "integer",
            required: false
        },
        {
            in: "query",
            name: "channel[0].type",
            type: "string",
            enum: Object.keys(common_1.ChannelTypes),
            required: false
        },
        {
            in: "query",
            name: "channel[0].channel",
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
                    $ref: "#/definitions/Service"
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
//# sourceMappingURL=services.js.map