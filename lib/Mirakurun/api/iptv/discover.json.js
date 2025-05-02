"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const api = require("../../api");
const _1 = require("../../_");
const pkg = require("../../../../package.json");
const get = (req, res) => {
    const apiRoot = `${req.protocol}://${req.headers.host}/api`;
    api.responseJSON(res, {
        FriendlyName: "Mirakurun",
        ModelNumber: "MIRAKURUN",
        FirmwareName: `mirakurun_${process.arch}_${process.platform}`,
        FirmwareVersion: pkg.version,
        Manufacturer: "Chinachu Project",
        DeviceID: req.headers.host.replace(/[\[\].:]/g, ""),
        DeviceAuth: "MIRAKURUN",
        TunerCount: _1.default.tuner.devices.length,
        BaseURL: `${apiRoot}/iptv`,
        LineupURL: `${apiRoot}/iptv/lineup.json`
    });
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
//# sourceMappingURL=discover.json.js.map