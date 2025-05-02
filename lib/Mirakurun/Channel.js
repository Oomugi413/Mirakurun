"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const log = require("./log");
const _1 = require("./_");
const status_1 = require("./status");
const queue_1 = require("./queue");
const ChannelItem_1 = require("./ChannelItem");
class Channel {
    constructor() {
        this._items = [];
        this._epgGatheringInterval = _1.default.config.server.epgGatheringInterval || 1000 * 60 * 30;
        this._epgGatheringIntervalGR = _1.default.config.server.epgGatheringIntervalGR || this._epgGatheringInterval;
        this._epgGatheringIntervalBS = _1.default.config.server.epgGatheringIntervalBS || this._epgGatheringInterval;
        this._epgGatheringIntervalCS = _1.default.config.server.epgGatheringIntervalCS || this._epgGatheringInterval;
        this._epgGatheringIntervalSKY = _1.default.config.server.epgGatheringIntervalSKY || this._epgGatheringInterval;
        this._epgGatheringIntervalNW = _1.default.config.server.epgGatheringIntervalNW || this._epgGatheringInterval;
        this._load();
        if (_1.default.config.server.disableEITParsing !== true) {
            setTimeout(this._epgGatherer.bind(this), 1000 * 60);
        }
    }
    get items() {
        return this._items;
    }
    add(item) {
        if (this.get(item.type, item.channel) === null) {
            this._items.push(item);
        }
    }
    get(type, channel) {
        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].channel === channel && this._items[i].type === type) {
                return this._items[i];
            }
        }
        return null;
    }
    findByType(type) {
        const items = [];
        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].type === type) {
                items.push(this._items[i]);
            }
        }
        return items;
    }
    _load() {
        log.debug("loading channels...");
        const channels = _1.default.config.channels;
        channels.forEach((channel, i) => {
            if (typeof channel.name !== "string") {
                log.error("invalid type of property `name` in channel#%d configuration", i);
                return;
            }
            if (typeof channel.channel !== "string") {
                log.error("invalid type of property `channel` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.satelite && !channel.satellite) {
                log.warn("renaming deprecated property name `satelite` to `satellite` in channel#%d (%s) configuration", i, channel.name);
                channel.satellite = channel.satelite;
            }
            if (channel.satellite && typeof channel.satellite !== "string") {
                log.error("invalid type of property `satellite` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.space && typeof channel.space !== "number") {
                log.error("invalid type of property `space` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.freq !== undefined && typeof channel.freq !== "number") {
                log.error("invalid type of property `freq` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.polarity && channel.polarity !== "H" && channel.polarity !== "V") {
                log.error("invalid type of property `polarity` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.serviceId && typeof channel.serviceId !== "number") {
                log.error("invalid type of property `serviceId` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.tsmfRelTs && typeof channel.tsmfRelTs !== "number") {
                log.error("invalid type of property `tsmfRelTs` in channel#%d (%s) configuration", i, channel.name);
                return;
            }
            if (channel.isDisabled === true) {
                return;
            }
            if (_1.default.tuner.typeExists(channel.type) === false) {
                return;
            }
            const pre = this.get(channel.type, channel.channel);
            if (pre) {
                if (channel.serviceId) {
                    pre.addService(channel.serviceId);
                }
            }
            else {
                const arr = ["BS", "CS", "SKY"];
                if (arr.includes(channel.type)) {
                    channel.name = `${channel.type}:${channel.channel}`;
                }
                this.add(new ChannelItem_1.default(channel));
            }
        });
    }
    _epgGatherer() {
        const nw_type_list = ["NW1", "NW2", "NW3", "NW4", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10",
            "NW11", "NW12", "NW13", "NW14", "NW15", "NW16", "NW17", "NW18", "NW19", "NW20",
            "NW21", "NW22", "NW23", "NW24", "NW25", "NW26", "NW27", "NW28", "NW29", "NW30",
            "NW31", "NW32", "NW33", "NW34", "NW35", "NW36", "NW37", "NW38", "NW39", "NW40"];
        queue_1.default.add(async () => {
            const networkIds = [...new Set(_1.default.service.items.map(item => item.networkId))];
            networkIds.forEach(networkId => {
                const services = _1.default.service.findByNetworkId(networkId);
                if (services.length === 0) {
                    return;
                }
                const service = services[0];
                queue_1.default.add(async () => {
                    for (const ch of service.channel) {
                        if (service.epgReady === true) {
                            const now = Date.now();
                            if (ch.type === "GR" && now - service.epgUpdatedAt < this._epgGatheringIntervalGR) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalGR`", networkId);
                                return;
                            }
                            if (ch.type === "BS" && now - service.epgUpdatedAt < this._epgGatheringIntervalBS) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalBS`", networkId);
                                return;
                            }
                            if (ch.type === "CS" && now - service.epgUpdatedAt < this._epgGatheringIntervalCS) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalCS`", networkId);
                                return;
                            }
                            if (ch.type === "SKY" && now - service.epgUpdatedAt < this._epgGatheringIntervalSKY) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalSKY`", networkId);
                                return;
                            }
                            if (nw_type_list.indexOf(ch.type) !== -1) {
                                if (now - service.epgUpdatedAt < this._epgGatheringIntervalNW) {
                                    log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalNW`", networkId);
                                    return;
                                }
                            }
                            if (now - service.epgUpdatedAt > 1000 * 60 * 60 * 6) {
                                log.info("Network#%d EPG gathering is resuming forcibly because reached maximum pause time", networkId);
                                service.epgReady = false;
                            }
                            else {
                                const currentPrograms = _1.default.program.findByNetworkIdAndTime(networkId, now)
                                    .filter(program => !!program.name && program.name !== "放送休止");
                                if (currentPrograms.length === 0) {
                                    const networkPrograms = _1.default.program.findByNetworkId(networkId);
                                    if (networkPrograms.length > 0) {
                                        log.info("Network#%d EPG gathering has skipped because broadcast is off", networkId);
                                        return;
                                    }
                                    service.epgReady = false;
                                }
                            }
                        }
                        if (status_1.default.epg[networkId] === true) {
                            log.info("Network#%d EPG gathering is already in progress on another stream", networkId);
                            return;
                        }
                        log.info("Network#%d EPG gathering has started", networkId);
                        try {
                            await _1.default.tuner.getEPG(ch);
                            log.info("Network#%d EPG gathering has finished", networkId);
                        }
                        catch (e) {
                            log.warn("Network#%d EPG gathering has failed [%s]", networkId, e);
                        }
                    }
                });
                log.debug("Network#%d EPG gathering has queued", networkId);
            });
            queue_1.default.add(async () => {
                setTimeout(this._epgGatherer.bind(this), this._epgGatheringInterval);
            });
        });
    }
}
exports.default = Channel;
//# sourceMappingURL=Channel.js.map