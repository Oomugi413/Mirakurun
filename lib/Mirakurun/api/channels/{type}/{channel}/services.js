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
    }
];
const get = (req, res) => {
    const channel = _1.default.channel.get(req.params.type, req.params.channel);
    if (channel === null) {
        api.responseError(res, 404);
        return;
    }
    res.redirect(307, `/api/services?channel.type=${channel.type}&channel.channel=${channel.channel}`);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["channels", "services"],
    operationId: "getServicesByChannel",
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