"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProgramItemId = void 0;
const sift_1 = require("sift");
const common = require("./common");
const log = require("./log");
const db = require("./db");
const _1 = require("./_");
const Event_1 = require("./Event");
const queue_1 = require("./queue");
function getProgramItemId(networkId, serviceId, eventId) {
    return parseInt(`${networkId}${serviceId.toString(10).padStart(5, "0")}${eventId.toString(10).padStart(5, "0")}`, 10);
}
exports.getProgramItemId = getProgramItemId;
class Program {
    constructor() {
        this._itemMap = new Map();
        this._emitRunning = false;
        this._emitPrograms = new Map();
        this._programGCInterval = _1.default.config.server.programGCInterval || 1000 * 60 * 60;
        this._load();
        setTimeout(this._gc.bind(this), this._programGCInterval);
    }
    get itemMap() {
        return this._itemMap;
    }
    add(item, firstAdd = false) {
        if (this.exists(item.id)) {
            return;
        }
        if (firstAdd === false) {
            this._findAndRemoveConflicts(item);
        }
        this._itemMap.set(item.id, item);
        if (firstAdd === false) {
            this._emitPrograms.set(item, "create");
        }
        this.save();
    }
    get(id) {
        return this._itemMap.get(id) || null;
    }
    set(id, props) {
        const item = this.get(id);
        if (item && common.updateObject(item, props) === true) {
            if (props.startAt || props.duration) {
                this._findAndRemoveConflicts(item);
            }
            this._emitPrograms.set(item, "update");
            this.save();
        }
    }
    remove(id) {
        if (this._itemMap.delete(id)) {
            this.save();
        }
    }
    exists(id) {
        return this._itemMap.has(id);
    }
    findByQuery(query) {
        return Array.from(this._itemMap.values()).filter((0, sift_1.default)(query));
    }
    findByNetworkId(networkId) {
        const items = [];
        for (const item of this._itemMap.values()) {
            if (item.networkId === networkId) {
                items.push(item);
            }
        }
        return items;
    }
    findByNetworkIdAndTime(networkId, time) {
        const items = [];
        for (const item of this._itemMap.values()) {
            if (item.networkId === networkId && item.startAt <= time && item.startAt + item.duration > time) {
                items.push(item);
            }
        }
        return items;
    }
    findByNetworkIdAndReplace(networkId, programs) {
        let count = 0;
        for (const item of [...this._itemMap.values()].reverse()) {
            if (item.networkId === networkId) {
                this.remove(item.id);
                --count;
            }
        }
        for (const program of programs) {
            this.add(program, true);
            ++count;
        }
        log.debug("programs replaced (networkId=%d, count=%d)", networkId, count);
        this.save();
    }
    save() {
        clearTimeout(this._emitTimerId);
        this._emitTimerId = setTimeout(() => this._emit(), 1000);
        clearTimeout(this._saveTimerId);
        this._saveTimerId = setTimeout(() => this._save(), 1000 * 10);
    }
    _load() {
        log.debug("loading programs...");
        const now = Date.now();
        let dropped = false;
        db.loadPrograms(_1.default.configIntegrity.channels).forEach(item => {
            if (item.networkId === undefined) {
                dropped = true;
                return;
            }
            if (now > (item.startAt + item.duration)) {
                dropped = true;
                return;
            }
            this.add(item, true);
        });
        if (dropped) {
            this.save();
        }
    }
    _findAndRemoveConflicts(added) {
        const addedEndAt = added.startAt + added.duration;
        for (const item of this._itemMap.values()) {
            if (item.networkId === added.networkId &&
                item.serviceId === added.serviceId &&
                item.id !== added.id) {
                const itemEndAt = item.startAt + item.duration;
                if (((added.startAt <= item.startAt && item.startAt < addedEndAt) ||
                    (item.startAt <= added.startAt && added.startAt < itemEndAt)) &&
                    (!item._pf || added._pf)) {
                    this.remove(item.id);
                    Event_1.default.emit("program", "remove", { id: item.id });
                    log.debug("ProgramItem#%d (networkId=%d, serviceId=%d, eventId=%d) has removed by overlapped ProgramItem#%d (eventId=%d)", item.id, item.networkId, item.serviceId, item.eventId, added.id, added.eventId);
                }
            }
        }
    }
    async _emit() {
        if (this._emitRunning) {
            return;
        }
        this._emitRunning = true;
        for (const [item, eventType] of this._emitPrograms) {
            this._emitPrograms.delete(item);
            Event_1.default.emit("program", eventType, item);
            await common.sleep(10);
        }
        this._emitRunning = false;
        if (this._emitPrograms.size > 0) {
            this._emit();
        }
    }
    _save() {
        log.debug("saving programs...");
        db.savePrograms(Array.from(this._itemMap.values()), _1.default.configIntegrity.channels);
    }
    _gc() {
        log.debug("Program GC has queued");
        queue_1.default.add(async () => {
            const shortExp = Date.now() - 1000 * 60 * 60 * 3;
            const longExp = Date.now() - 1000 * 60 * 60 * 24;
            const maximum = Date.now() + 1000 * 60 * 60 * 24 * 9;
            let count = 0;
            for (const item of this._itemMap.values()) {
                if ((item.duration === 1 ? longExp : shortExp) > (item.startAt + item.duration) ||
                    maximum < item.startAt) {
                    ++count;
                    this.remove(item.id);
                }
            }
            setTimeout(this._gc.bind(this), this._programGCInterval);
            log.info("Program GC has finished and removed %d programs", count);
        });
    }
}
exports.default = Program;
//# sourceMappingURL=Program.js.map