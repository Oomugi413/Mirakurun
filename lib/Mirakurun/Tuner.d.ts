/// <reference types="node" />
import { Writable } from "stream";
import * as common from "./common";
import * as db from "./db";
import TunerDevice from "./TunerDevice";
import ChannelItem from "./ChannelItem";
import ServiceItem from "./ServiceItem";
import TSFilter from "./TSFilter";
export default class Tuner {
    private _devices;
    constructor();
    get devices(): TunerDevice[];
    get(index: number): TunerDevice;
    typeExists(type: common.ChannelType): boolean;
    initChannelStream(channel: ChannelItem, userReq: common.UserRequest, output: Writable): Promise<TSFilter>;
    initServiceStream(service: ServiceItem, userReq: common.UserRequest, output: Writable): Promise<TSFilter>;
    initProgramStream(program: db.Program, userReq: common.UserRequest, output: Writable): Promise<TSFilter>;
    getEPG(channel: ChannelItem, time?: number): Promise<void>;
    getServices(channel: ChannelItem): Promise<db.Service[]>;
    private _load;
    private _initTS;
    private _getDevicesByType;
}
