"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const EventEmitter = require("eventemitter3");
const rfdc = require("rfdc");
const clone = rfdc();
const _1 = require("./_");
class Event extends EventEmitter {
    static get log() {
        return _1.default.event.log;
    }
    static onEvent(listener) {
        _1.default.event.on("event", listener);
    }
    static onceEvent(listener) {
        _1.default.event.once("event", listener);
    }
    static removeListener(listener) {
        _1.default.event.removeListener("event", listener);
    }
    static emit(resource, type, data) {
        const message = {
            resource: resource,
            type: type,
            data: clone(data),
            time: Date.now()
        };
        return _1.default.event.emit("event", message);
    }
    constructor() {
        super();
        this._log = [];
        this.on("event", message => {
            this._log.push(message);
            if (this._log.length > 100) {
                this._log.shift();
            }
        });
    }
    get log() {
        return this._log;
    }
}
exports.default = Event;
//# sourceMappingURL=Event.js.map