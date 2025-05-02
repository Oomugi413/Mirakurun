"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const api = require("../../api");
const _1 = require("../../_");
const get = (req, res) => {
    const apiRoot = `${req.protocol}://${req.headers.host}/api`;
    const services = [..._1.default.service.items];
    services.sort((a, b) => a.getOrder() - b.getOrder());
    const channels = [];
    const countMap = new Map();
    for (const service of services) {
        if (service.type !== 1 && service.type !== 173) {
            continue;
        }
        const mainNum = service.remoteControlKeyId || service.serviceId;
        if (countMap.has(mainNum)) {
            countMap.set(mainNum, countMap.get(mainNum) + 1);
        }
        else {
            countMap.set(mainNum, 1);
        }
        const subNum = countMap.get(mainNum);
        channels.push({
            GuideNumber: `${mainNum}.${subNum}`,
            GuideName: service.name,
            HD: 1,
            URL: `${apiRoot}/services/${service.id}/stream`
        });
    }
    api.responseJSON(res, channels);
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["iptv"],
    summary: "IPTV - Media Server Support",
    responses: {
        200: {
            description: "OK"
        },
        default: {
            description: "Unexpected Error",
            schema: {
                $ref: "#/definitions/Error"
            }
        }
    }
};
//# sourceMappingURL=lineup.json.js.map