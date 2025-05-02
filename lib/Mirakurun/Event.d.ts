import EventEmitter = require("eventemitter3");
export interface EventMessage<T = any> {
    readonly resource: EventResource;
    readonly type: EventType;
    readonly data: T;
    readonly time: number;
}
export type EventResource = "program" | "service" | "tuner";
export type EventType = "create" | "update" | "remove";
export default class Event extends EventEmitter {
    static get log(): EventMessage[];
    static onEvent(listener: (message: EventMessage) => void): void;
    static onceEvent(listener: (message: EventMessage) => void): void;
    static removeListener(listener: (...args: any[]) => void): void;
    static emit(resource: EventResource, type: EventType, data: any): boolean;
    private _log;
    constructor();
    get log(): EventMessage[];
}
