"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require("./_");
const queue_1 = require("./queue");
const log = require("./log");
const ServiceItem_1 = require("./ServiceItem");
class ChannelItem {
    constructor(config) {
        this._name = config.name;
        this._type = config.type;
        this._channel = config.channel;
        this._satellite = config.satellite;
        this._space = config.space;
        this._freq = config.freq;
        this._polarity = config.polarity;
        this._tsmfRelTs = config.tsmfRelTs;
        if (config.serviceId) {
            this.addService(config.serviceId);
        }
        setTimeout(() => {
            if (!config.serviceId && this.getServices().length === 0) {
                this.serviceScan(true);
            }
            else {
                setTimeout(() => this.serviceScan(false), 180000);
            }
        }, 3000);
    }
    get name() {
        return this._name;
    }
    get type() {
        return this._type;
    }
    get channel() {
        return this._channel;
    }
    get satellite() {
        return this._satellite;
    }
    get space() {
        return this._space;
    }
    get freq() {
        return this._freq;
    }
    get polarity() {
        return this._polarity;
    }
    get tsmfRelTs() {
        return this._tsmfRelTs;
    }
    toJSON() {
        return {
            type: this._type,
            channel: this._channel,
            name: this._name,
            satellite: this._satellite,
            space: this._space,
            freq: this._freq,
            polarity: this._polarity,
            tsmfRelTs: this._tsmfRelTs
        };
    }
    addService(serviceId) {
        if (!_1.default.service) {
            process.nextTick(() => this.addService(serviceId));
            return;
        }
        if (_1.default.service.findByChannel(this).some(service => service.serviceId === serviceId) === true) {
            return;
        }
        log.debug("ChannelItem#'%s' serviceId=%d check has queued", this._name, serviceId);
        queue_1.default.add(async () => {
            log.info("ChannelItem#'%s' serviceId=%d check has started", this._name, serviceId);
            let services;
            try {
                services = await _1.default.tuner.getServices(this);
            }
            catch (e) {
                log.warn("ChannelItem#'%s' serviceId=%d check has failed [%s]", this._name, serviceId, e);
                setTimeout(() => this.addService(serviceId), 180000);
                return;
            }
            const service = services.find(service => service.serviceId === serviceId);
            if (!service) {
                log.warn("ChannelItem#'%s' serviceId=%d check has failed [no service]", this._name, serviceId);
                setTimeout(() => this.addService(serviceId), 3600000);
                return;
            }
            log.debug("ChannelItem#'%s' serviceId=%d: %s", this._name, serviceId, JSON.stringify(service, null, "  "));
            _1.default.service.add(new ServiceItem_1.default([this], service.networkId, service.serviceId, service.name, service.type, service.logoId));
        });
    }
    getServices() {
        return _1.default.service.findByChannel(this);
    }
    getStream(user, output) {
        return _1.default.tuner.initChannelStream(this, user, output);
    }
    serviceScan(add) {
        log.debug("ChannelItem#'%s' service scan has queued", this._name);
        queue_1.default.add(async () => {
            log.info("ChannelItem#'%s' service scan has started", this._name);
            let services;
            try {
                services = await _1.default.tuner.getServices(this);
            }
            catch (e) {
                log.warn("ChannelItem#'%s' service scan has failed [%s]", this._name, e);
                setTimeout(() => this.serviceScan(add), add ? 180000 : 3600000);
                return;
            }
            log.debug("ChannelItem#'%s' services: %s", this._name, JSON.stringify(services, null, "  "));
            services.forEach(service => {
                const item = _1.default.service.get(service.networkId, service.serviceId);
                if (item !== null) {
                    item.name = service.name;
                    item.type = service.type;
                    if (service.logoId > -1) {
                        item.logoId = service.logoId;
                    }
                    item.remoteControlKeyId = service.remoteControlKeyId;
                    for (let index = 0; index < item.channel.length; index++) {
                        if (this._type === item.channel[index].type &&
                            this._channel === item.channel[index].channel) {
                            return;
                        }
                    }
                    item.channel.push(this);
                }
                else if (add === true) {
                    _1.default.service.add(new ServiceItem_1.default([this], service.networkId, service.serviceId, service.name, service.type, service.logoId, service.remoteControlKeyId));
                }
            });
            log.info("ChannelItem#'%s' service scan has finished", this._name);
        });
    }
}
exports.default = ChannelItem;
//# sourceMappingURL=ChannelItem.js.map