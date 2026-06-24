"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = exports.parameters = void 0;
const _1 = __importDefault(require("../../../_"));
const Service_1 = __importDefault(require("../../../Service"));
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
    const service = _1.default.service.get(req.params.id);
    if (service === null || service === undefined) {
        res.writeHead(404, "Not Found");
        res.end();
        return;
    }
    if (typeof service.logoId !== "number" || service.logoId < -1) {
        res.writeHead(503, "Logo Data Unavailable");
        res.end();
        return;
    }
    const logoData = await Service_1.default.loadLogoData(service.networkId, service.serviceId, service.logoId);
    if (logoData) {
        res.setHeader("Content-Type", "image/png");
        res.setHeader("Cache-Control", "public, max-age=86400");
        res.status(200);
        res.end(logoData);
    }
    else {
        res.writeHead(503, "Logo Data Unavailable");
        res.end();
    }
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["services"],
    operationId: "getLogoImage",
    produces: ["image/png"],
    responses: {
        200: {
            description: "OK"
        },
        404: {
            description: "Not Found"
        },
        503: {
            description: "Logo Data Unavailable"
        },
        default: {
            description: "Unexpected Error"
        }
    }
};
//# sourceMappingURL=logo.js.map