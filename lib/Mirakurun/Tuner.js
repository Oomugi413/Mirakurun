"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const common = require("./common");
const log = require("./log");
const _1 = require("./_");
const TunerDevice_1 = require("./TunerDevice");
const TSFilter_1 = require("./TSFilter");
const TSDecoder_1 = require("./TSDecoder");
class Tuner {
    constructor() {
        this._devices = [];
        this._load();
    }
    get devices() {
        return this._devices;
    }
    get(index) {
        const l = this._devices.length;
        for (let i = 0; i < l; i++) {
            if (this._devices[i].index === index) {
                return this._devices[i];
            }
        }
        return null;
    }
    typeExists(type) {
        const l = this._devices.length;
        for (let i = 0; i < l; i++) {
            if (this._devices[i].config.types.includes(type) === true) {
                return true;
            }
        }
        return false;
    }
    initChannelStream(channel, userReq, output) {
        let networkId;
        const services = channel.getServices();
        if (services.length !== 0) {
            networkId = services[0].networkId;
        }
        return this._initTS({
            ...userReq,
            streamSetting: {
                channel: [channel],
                networkId,
                parseEIT: true
            }
        }, output);
    }
    initServiceStream(service, userReq, output) {
        return this._initTS({
            ...userReq,
            streamSetting: {
                channel: service.channel,
                serviceId: service.serviceId,
                networkId: service.networkId,
                parseEIT: true
            }
        }, output);
    }
    initProgramStream(program, userReq, output) {
        return this._initTS({
            ...userReq,
            streamSetting: {
                channel: _1.default.service.get(program.networkId, program.serviceId).channel,
                serviceId: program.serviceId,
                eventId: program.eventId,
                networkId: program.networkId,
                parseEIT: true
            }
        }, output);
    }
    async getEPG(channel, time) {
        let timeout;
        if (!time) {
            time = _1.default.config.server.epgRetrievalTime || 1000 * 60 * 10;
        }
        let networkId;
        const services = channel.getServices();
        if (services.length === 0) {
            throw new Error("no available services in channel");
        }
        networkId = services[0].networkId;
        const tsFilter = await this._initTS({
            id: "Mirakurun:getEPG()",
            priority: -1,
            disableDecoder: true,
            streamSetting: {
                channel: [channel],
                networkId,
                parseEIT: true
            }
        });
        if (tsFilter === null) {
            return;
        }
        return new Promise((resolve) => {
            const fin = () => {
                clearTimeout(timeout);
                tsFilter.close();
            };
            timeout = setTimeout(fin, time);
            tsFilter.once("epgReady", fin);
            tsFilter.once("close", () => {
                fin();
                resolve();
            });
        });
    }
    async getServices(channel) {
        const tsFilter = await this._initTS({
            id: "Mirakurun:getServices()",
            priority: -1,
            disableDecoder: true,
            streamSetting: {
                channel: [channel],
                parseNIT: true,
                parseSDT: true
            }
        });
        return new Promise((resolve, reject) => {
            let network = {
                networkId: -1,
                areaCode: -1,
                remoteControlKeyId: -1
            };
            let services = null;
            setTimeout(() => tsFilter.close(), 20000);
            Promise.all([
                new Promise((resolve, reject) => {
                    tsFilter.once("network", _network => {
                        network = _network;
                        resolve();
                    });
                }),
                new Promise((resolve, reject) => {
                    tsFilter.once("services", _services => {
                        services = _services;
                        resolve();
                    });
                })
            ]).then(() => tsFilter.close());
            tsFilter.once("close", () => {
                tsFilter.removeAllListeners("network");
                tsFilter.removeAllListeners("services");
                if (network.networkId === -1) {
                    reject(new Error("stream has closed before get network"));
                }
                else if (services === null) {
                    reject(new Error("stream has closed before get services"));
                }
                else {
                    if (network.remoteControlKeyId !== -1) {
                        services.forEach(service => {
                            service.remoteControlKeyId = network.remoteControlKeyId;
                        });
                    }
                    resolve(services);
                }
            });
        });
    }
    _load() {
        log.debug("loading tuners...");
        const tuners = _1.default.config.tuners;
        tuners.forEach((tuner, i) => {
            if (!tuner.name || !tuner.types || (!tuner.remoteMirakurunHost && !tuner.command)) {
                log.error("missing required property in tuner#%s configuration", i);
                return;
            }
            if (typeof tuner.name !== "string") {
                log.error("invalid type of property `name` in tuner#%s configuration", i);
                return;
            }
            if (Array.isArray(tuner.types) === false) {
                console.log(tuner);
                log.error("invalid type of property `types` in tuner#%s configuration", i);
                return;
            }
            if (!tuner.remoteMirakurunHost && typeof tuner.command !== "string") {
                log.error("invalid type of property `command` in tuner#%s configuration", i);
                return;
            }
            if (tuner.dvbDevicePath && typeof tuner.dvbDevicePath !== "string") {
                log.error("invalid type of property `dvbDevicePath` in tuner#%s configuration", i);
                return;
            }
            if (tuner.remoteMirakurunHost && typeof tuner.remoteMirakurunHost !== "string") {
                log.error("invalid type of property `remoteMirakurunHost` in tuner#%s configuration", i);
                return;
            }
            if (tuner.remoteMirakurunPort && Number.isInteger(tuner.remoteMirakurunPort) === false) {
                log.error("invalid type of property `remoteMirakurunPort` in tuner#%s configuration", i);
                return;
            }
            if (tuner.remoteMirakurunDecoder !== undefined && typeof tuner.remoteMirakurunDecoder !== "boolean") {
                log.error("invalid type of property `remoteMirakurunDecoder` in tuner#%s configuration", i);
                return;
            }
            if (tuner.isDisabled) {
                return;
            }
            this._devices.push(new TunerDevice_1.default(i, tuner));
        });
        log.info("%s of %s tuners loaded", this._devices.length, tuners.length);
        return this;
    }
    _initTS(user, dest) {
        return new Promise((resolve, reject) => {
            const setting = user.streamSetting;
            if (_1.default.config.server.disableEITParsing === true) {
                setting.parseEIT = false;
            }
            const devices = [];
            const channels = [];
            for (const ch of setting.channel) {
                const device = this._getDevicesByType(ch.type);
                for (let index = 0; index < device.length; index++) {
                    devices.push(device[index]);
                    channels.push(ch);
                }
            }
            const length = devices.length;
            let tryCount = 25;
            const waitTunerMs = 1000;
            let isSuccessStream = true;
            function find() {
                let device = null;
                let channel = null;
                for (let i = 0; i < length; i++) {
                    if (devices[i].isAvailable === true && devices[i].channel === channels[i]) {
                        device = devices[i];
                        channel = channels[i];
                        break;
                    }
                }
                if (device === null && !dest) {
                    const remoteDevice = devices.find(device => device.isRemote);
                    if (remoteDevice) {
                        if (setting.networkId !== undefined && setting.parseEIT === true) {
                            remoteDevice.getRemotePrograms({ networkId: setting.networkId })
                                .then(async (programs) => {
                                await common.sleep(1000);
                                _1.default.program.findByNetworkIdAndReplace(setting.networkId, programs);
                                for (const service of _1.default.service.findByNetworkId(setting.networkId)) {
                                    service.epgReady = true;
                                }
                                await common.sleep(1000);
                            })
                                .then(() => resolve(null))
                                .catch(err => {
                                reject(err);
                            });
                            return;
                        }
                    }
                }
                if (device === null) {
                    for (let i = 0; i < length; i++) {
                        if (devices[i].isFree === true) {
                            device = devices[i];
                            channel = channels[i];
                            break;
                        }
                    }
                }
                if (device === null) {
                    for (let i = 0; i < length; i++) {
                        if (devices[i].isAvailable === true && devices[i].users.length === 0) {
                            device = devices[i];
                            channel = channels[i];
                            break;
                        }
                    }
                }
                if (device === null) {
                    const tmp = [];
                    devices.sort((t1, t2) => {
                        tmp.push(t1.getPriority() - t2.getPriority());
                        return t1.getPriority() - t2.getPriority();
                    });
                    channels.sort(() => tmp.shift());
                    for (let i = 0; i < length; i++) {
                        if (devices[i].isUsing === true && devices[i].getPriority() < user.priority) {
                            device = devices[i];
                            channel = channels[i];
                            break;
                        }
                    }
                }
                if (device === null) {
                    --tryCount;
                    if (tryCount > 0) {
                        setTimeout(find, waitTunerMs);
                    }
                    else {
                        reject(new Error("no available tuners"));
                    }
                }
                else {
                    log.debug("checking tuner type:%s channel: %s", channel.type, channel.channel);
                    let output;
                    output = user.disableDecoder === true || device.decoder === null ? dest : new TSDecoder_1.default({
                        output: dest,
                        command: device.decoder
                    });
                    const tsFilter = new TSFilter_1.default({
                        output,
                        networkId: setting.networkId,
                        serviceId: setting.serviceId,
                        eventId: setting.eventId,
                        parseNIT: setting.parseNIT,
                        parseSDT: setting.parseSDT,
                        parseEIT: setting.parseEIT,
                        tsmfRelTs: channel.tsmfRelTs
                    });
                    Object.defineProperty(user, "streamInfo", {
                        get: () => tsFilter.streamInfo
                    });
                    device.startStream(user, tsFilter, channel)
                        .then(() => {
                        resolve(tsFilter);
                    })
                        .catch((err) => {
                        tsFilter.end();
                        reject(err);
                        isSuccessStream = false;
                    });
                }
            }
            find();
        });
    }
    _getDevicesByType(type) {
        const devices = [];
        const l = this._devices.length;
        for (let i = 0; i < l; i++) {
            if (this._devices[i].config.types.includes(type) === true) {
                devices.push(this._devices[i]);
            }
        }
        return devices;
    }
}
exports.default = Tuner;
//# sourceMappingURL=Tuner.js.map