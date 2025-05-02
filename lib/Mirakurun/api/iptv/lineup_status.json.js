"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.get = void 0;
const api = require("../../api");
const get = (req, res) => {
    api.responseJSON(res, {
        ScanInProgress: 0,
        ScanPossible: 0,
        Source: "Antenna",
        SourceList: ["Antenna"]
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
//# sourceMappingURL=lineup_status.json.js.map