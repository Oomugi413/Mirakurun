"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const api = require("../../api");
const _1 = require("../../_");
const Service_1 = require("../../Service");
exports.parameters = [
    {
        in: "path",
        name: "id",
        type: "integer",
        maximum: 6553565535,
        required: true
    }
];
const get = async (req, res) => {
    const serviceItem = _1.default.service.get(req.params.id);
    if (serviceItem === null || serviceItem === undefined) {
        api.responseError(res, 404);
        return;
    }
    const service = {
        ...serviceItem.export(),
        hasLogoData: await Service_1.default.isLogoDataExists(serviceItem.networkId, serviceItem.serviceId, serviceItem.logoId)
    };
    res.json(service);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["services"],
    operationId: "getService",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/Service"
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