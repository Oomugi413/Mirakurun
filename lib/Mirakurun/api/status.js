"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getStatus = exports.get = void 0;
const status_1 = require("../status");
const _1 = require("../_");
const pkg = require("../../../package.json");
const get = (req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200);
    res.end(JSON.stringify(getStatus(), null, 2));
};
exports.get = get;
exports.get.apiDoc = {
    tags: ["status"],
    summary: "Get Status",
    operationId: "getStatus",
    responses: {
        200: {
            description: "OK",
            schema: {
                $ref: "#/definitions/Status"
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
function getStatus() {
    const ret = {
        time: Date.now(),
        version: pkg.version,
        process: {
            arch: process.arch,
            platform: process.platform,
            versions: process.versions,
            env: {
                PATH: process.env.PATH,
                DOCKER: process.env.DOCKER,
                DOCKER_NETWORK: process.env.DOCKER_NETWORK,
                pm_uptime: process.env.pm_uptime,
                USING_WINSER: process.env.USING_WINSER,
                NODE_ENV: process.env.NODE_ENV,
                SERVER_CONFIG_PATH: process.env.SERVER_CONFIG_PATH,
                TUNERS_CONFIG_PATH: process.env.TUNERS_CONFIG_PATH,
                CHANNELS_CONFIG_PATH: process.env.CHANNELS_CONFIG_PATH,
                SERVICES_DB_PATH: process.env.SERVICES_DB_PATH,
                PROGRAMS_DB_PATH: process.env.PROGRAMS_DB_PATH,
                LOGO_DATA_DIR_PATH: process.env.LOGO_DATA_DIR_PATH
            },
            pid: process.pid,
            memoryUsage: process.memoryUsage()
        },
        epg: {
            gatheringNetworks: [],
            storedEvents: _1.default.program.itemMap.size
        },
        rpcCount: status_1.default.rpcCount,
        streamCount: {
            tunerDevice: _1.default.tuner.devices.filter(td => td.isUsing === true).length,
            tsFilter: status_1.default.streamCount.tsFilter,
            decoder: status_1.default.streamCount.decoder
        },
        errorCount: status_1.default.errorCount,
        timerAccuracy: {
            last: status_1.default.timerAccuracy.last / 1000,
            m1: {
                avg: (status_1.default.timerAccuracy.m1.reduce((a, b) => a + b) / status_1.default.timerAccuracy.m1.length) / 1000,
                min: Math.min.apply(null, status_1.default.timerAccuracy.m1) / 1000,
                max: Math.max.apply(null, status_1.default.timerAccuracy.m1) / 1000
            },
            m5: {
                avg: (status_1.default.timerAccuracy.m5.reduce((a, b) => a + b) / status_1.default.timerAccuracy.m5.length) / 1000,
                min: Math.min.apply(null, status_1.default.timerAccuracy.m5) / 1000,
                max: Math.max.apply(null, status_1.default.timerAccuracy.m5) / 1000
            },
            m15: {
                avg: (status_1.default.timerAccuracy.m15.reduce((a, b) => a + b) / status_1.default.timerAccuracy.m15.length) / 1000,
                min: Math.min.apply(null, status_1.default.timerAccuracy.m15) / 1000,
                max: Math.max.apply(null, status_1.default.timerAccuracy.m15) / 1000
            }
        }
    };
    for (const nid in status_1.default.epg) {
        if (status_1.default.epg[nid] === true) {
            ret.epg.gatheringNetworks.push(parseInt(nid, 10));
        }
    }
    return ret;
}
exports.getStatus = getStatus;
//# sourceMappingURL=status.js.map