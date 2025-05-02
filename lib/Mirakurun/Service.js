"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const fs_1 = require("fs");
const fs = require("fs");
const log = require("./log");
const db = require("./db");
const _1 = require("./_");
const Event_1 = require("./Event");
const ServiceItem_1 = require("./ServiceItem");
const { LOGO_DATA_DIR_PATH } = process.env;
class Service {
    static getLogoDataPath(networkId, serviceId, logoId) {
        if (networkId === 4 || networkId === 6 || networkId === 7 || networkId > 60000) {
            return (0, path_1.join)(LOGO_DATA_DIR_PATH, `${networkId}_${serviceId}.png`);
        }
        if (typeof logoId !== "number" || logoId < 0) {
            throw new Error("Invalid `logoId`");
        }
        return (0, path_1.join)(LOGO_DATA_DIR_PATH, `${networkId}_${logoId}.png`);
    }
    static async getLogoDataMTime(networkId, serviceId, logoId) {
        if (typeof logoId !== "number" || logoId < -1) {
            return 0;
        }
        try {
            return (await fs_1.promises.stat(Service.getLogoDataPath(networkId, serviceId, logoId))).mtimeMs;
        }
        catch (e) {
            return 0;
        }
    }
    static async isLogoDataExists(networkId, serviceId, logoId) {
        if (typeof logoId !== "number" || logoId < -1) {
            return false;
        }
        try {
            return (await fs_1.promises.stat(Service.getLogoDataPath(networkId, serviceId, logoId))).isFile();
        }
        catch (e) {
            return false;
        }
    }
    static async loadLogoData(networkId, serviceId, logoId) {
        if (typeof logoId !== "number" || logoId < -1) {
            return null;
        }
        try {
            return await fs_1.promises.readFile(Service.getLogoDataPath(networkId, serviceId, logoId));
        }
        catch (e) {
            return null;
        }
    }
    static async saveLogoData(networkId, serviceId, logoId, data, retrying = false) {
        log.info("Service.saveLogoData(): saving... (networkId=%d serviceId=%d logoId=%d)", networkId, serviceId, logoId);
        const path = Service.getLogoDataPath(networkId, serviceId, logoId);
        try {
            await fs_1.promises.writeFile(path, data, { encoding: "binary" });
        }
        catch (e) {
            if (retrying === false) {
                const dirPath = (0, path_1.dirname)(path);
                if (fs.existsSync(dirPath) === false) {
                    log.warn("Service.saveLogoData(): making directory `%s`... (networkId=%d serviceId=%d logoId=%d)", dirPath, networkId, serviceId, logoId);
                    try {
                        fs.mkdirSync(dirPath, { recursive: true });
                    }
                    catch (e) {
                        throw e;
                    }
                }
                log.warn("Service.saveLogoData(): retrying... (networkId=%d serviceId=%d logoId=%d)", networkId, serviceId, logoId);
                return this.saveLogoData(networkId, serviceId, logoId, data, true);
            }
            throw e;
        }
        log.info("Service.saveLogoData(): saved. (networkId=%d serviceId=%d logoId=%d)", networkId, serviceId, logoId);
    }
    constructor() {
        this._items = [];
        this._load();
    }
    get items() {
        return this._items;
    }
    add(item) {
        if (this.get(item.id) !== null) {
            return;
        }
        this._items.push(item);
        Event_1.default.emit("service", "create", item.export());
        this.save();
    }
    get(id, serviceId) {
        if (serviceId === undefined) {
            const l = this._items.length;
            for (let i = 0; i < l; i++) {
                if (this._items[i].id === id) {
                    return this._items[i];
                }
            }
        }
        else {
            const l = this._items.length;
            for (let i = 0; i < l; i++) {
                if (this._items[i].networkId === id && this._items[i].serviceId === serviceId) {
                    return this._items[i];
                }
            }
        }
        return null;
    }
    exists(id, serviceId) {
        return this.get(id, serviceId) !== null;
    }
    findByChannel(channel) {
        const items = [];
        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            for (const channels of this._items[i].channel) {
                if (channels === channel) {
                    items.push(this._items[i]);
                }
            }
        }
        return items;
    }
    findByNetworkId(networkId) {
        const items = [];
        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].networkId === networkId) {
                items.push(this._items[i]);
            }
        }
        return items;
    }
    findByNetworkIdWithLogoId(networkId, logoId) {
        const items = [];
        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].networkId === networkId && this._items[i].logoId === logoId) {
                items.push(this._items[i]);
            }
        }
        return items;
    }
    save() {
        clearTimeout(this._saveTimerId);
        this._saveTimerId = setTimeout(() => this._save(), 1000 * 3);
    }
    _load() {
        log.debug("loading services...");
        let updated = false;
        const services = db.loadServices(_1.default.configIntegrity.channels);
        for (const service of services) {
            const typelist = service.channel.map(ch => ch.type);
            const channellist = service.channel.map(ch => ch.channel);
            const channelItems = [];
            for (let i = 0; i < typelist.length; i++) {
                channelItems.push(_1.default.channel.get(typelist[i], channellist[i]));
            }
            if (channelItems.length <= 0) {
                updated = true;
                return;
            }
            if (service.networkId === undefined || service.serviceId === undefined) {
                updated = true;
                return;
            }
            if (service.logoData) {
                const logoDataPath = Service.getLogoDataPath(service.networkId, service.serviceId, service.logoId);
                log.warn("migrating deprecated property `logoData` to file `%s` in service#%d (%s) db", logoDataPath, service.id, service.name);
                Service.saveLogoData(service.networkId, service.serviceId, service.logoId, Buffer.from(service.logoData, "base64"));
                services.filter(s => s.networkId === service.networkId && s.serviceId === service.serviceId && s.logoId === service.logoId).forEach(s => {
                    delete s.logoData;
                });
                updated = true;
            }
            this.add(new ServiceItem_1.default(channelItems, service.networkId, service.serviceId, service.name, service.type, service.logoId, service.remoteControlKeyId, service.epgReady, service.epgUpdatedAt));
        }
        if (updated) {
            this.save();
        }
    }
    _save() {
        log.debug("saving services...");
        db.saveServices(this._items.map(service => service.export()), _1.default.configIntegrity.channels);
    }
}
exports.default = Service;
//# sourceMappingURL=Service.js.map