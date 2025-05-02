/// <reference types="node" />
import ChannelItem from "./ChannelItem";
export interface User {
    readonly id: string;
    readonly priority: number;
    readonly agent?: string;
    readonly url?: string;
    readonly disableDecoder?: boolean;
    readonly streamSetting?: StreamSetting;
    readonly streamInfo?: StreamInfo;
}
export type UserRequest = Omit<User, "streamSetting">;
interface StreamSetting {
    channel: ChannelItem[];
    networkId?: number;
    serviceId?: number;
    eventId?: number;
    parseNIT?: boolean;
    parseSDT?: boolean;
    parseEIT?: boolean;
}
export interface StreamInfo {
    [PID: string]: {
        packet: number;
        drop: number;
    };
}
export declare enum ChannelTypes {
    "GR" = "GR",
    "BS" = "BS",
    "CS" = "CS",
    "SKY" = "SKY",
    "NW1" = "NW1",
    "NW2" = "NW2",
    "NW3" = "NW3",
    "NW4" = "NW4",
    "NW5" = "NW5",
    "NW6" = "NW6",
    "NW7" = "NW7",
    "NW8" = "NW8",
    "NW9" = "NW9",
    "NW10" = "NW10",
    "NW11" = "NW11",
    "NW12" = "NW12",
    "NW13" = "NW13",
    "NW14" = "NW14",
    "NW15" = "NW15",
    "NW16" = "NW16",
    "NW17" = "NW17",
    "NW18" = "NW18",
    "NW19" = "NW19",
    "NW20" = "NW20",
    "NW21" = "NW21",
    "NW22" = "NW22",
    "NW23" = "NW23",
    "NW24" = "NW24",
    "NW25" = "NW25",
    "NW26" = "NW26",
    "NW27" = "NW27",
    "NW28" = "NW28",
    "NW29" = "NW29",
    "NW30" = "NW30",
    "NW31" = "NW31",
    "NW32" = "NW32",
    "NW33" = "NW33",
    "NW34" = "NW34",
    "NW35" = "NW35",
    "NW36" = "NW36",
    "NW37" = "NW37",
    "NW38" = "NW38",
    "NW39" = "NW39",
    "NW40" = "NW40"
}
export type ChannelType = keyof typeof ChannelTypes;
export declare function updateObject<T, U>(target: T, input: U): boolean;
export declare function sleep(ms: number): Promise<void>;
export declare function getTimeFromMJD(buffer: Uint8Array | Buffer): number;
export declare function getTimeFromBCD24(buffer: Uint8Array | Buffer): number;
export {};
