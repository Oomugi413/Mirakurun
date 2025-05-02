import { Operation } from "express-openapi";
import * as common from "../../../common";
import * as config from "../../../config";
import * as db from "../../../db";
declare enum ScanMode {
    Channel = "Channel",
    Service = "Service"
}
interface ChannelScanOption {
    type: string;
    startCh?: number;
    endCh?: number;
    startSubCh?: number;
    endSubCh?: number;
    useSubCh?: boolean;
    scanMode?: ScanMode;
    setDisabledOnAdd?: boolean;
    refresh?: boolean;
}
interface ScanConfig {
    readonly channels: string[];
    readonly scanMode: ScanMode;
    readonly setDisabledOnAdd: boolean;
}
export declare function generateScanConfig(option: ChannelScanOption): ScanConfig;
export declare function generateChannelItemForService(type: common.ChannelType, channel: string, service: db.Service, setDisabledOnAdd: boolean): config.Channel;
export declare function generateChannelItemForChannel(type: common.ChannelType, channel: string, services: db.Service[], setDisabledOnAdd: boolean): config.Channel;
export declare function generateChannelItems(scanMode: ScanMode, type: common.ChannelType, channel: string, services: db.Service[], setDisabledOnAdd: boolean): config.Channel[];
export declare const put: Operation;
export {};
