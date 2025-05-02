/// <reference types="node" />
import * as stream from "stream";
import * as common from "./common";
import * as config from "./config";
import ServiceItem from "./ServiceItem";
import TSFilter from "./TSFilter";
export default class ChannelItem {
    private _name;
    private _type;
    private _channel;
    private _satellite;
    private _space;
    private _freq;
    private _polarity;
    private _tsmfRelTs;
    constructor(config: config.Channel);
    get name(): string;
    get type(): common.ChannelType;
    get channel(): string;
    get satellite(): string;
    get space(): number;
    get freq(): number;
    get polarity(): "H" | "V";
    get tsmfRelTs(): number;
    toJSON(): config.Channel;
    addService(serviceId: number): void;
    getServices(): ServiceItem[];
    getStream(user: common.User, output: stream.Writable): Promise<TSFilter>;
    serviceScan(add: boolean): void;
}
