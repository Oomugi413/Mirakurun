import * as common from "./common";
import * as log from "./log";
export interface Server {
    readonly path?: string;
    readonly port?: number;
    readonly hostname?: string;
    readonly disableIPv6?: boolean;
    readonly logLevel?: log.LogLevel;
    readonly maxLogHistory?: number;
    readonly maxBufferBytesBeforeReady?: number;
    readonly eventEndTimeout?: number;
    readonly programGCInterval?: number;
    readonly epgGatheringInterval?: number;
    readonly epgGatheringIntervalGR?: number;
    readonly epgGatheringIntervalBS?: number;
    readonly epgGatheringIntervalCS?: number;
    readonly epgGatheringIntervalSKY?: number;
    readonly epgGatheringIntervalNW?: number;
    readonly epgRetrievalTime?: number;
    readonly logoDataInterval?: number;
    readonly disableEITParsing?: true;
    readonly disableWebUI?: true;
    readonly allowIPv4CidrRanges?: string[];
    readonly allowIPv6CidrRanges?: string[];
    readonly allowListenAllInterface?: boolean;
}
export interface Tuner {
    readonly name: string;
    readonly types: common.ChannelType[];
    readonly command?: string;
    readonly dvbDevicePath?: string;
    readonly remoteMirakurunHost?: string;
    readonly remoteMirakurunPort?: number;
    readonly remoteMirakurunDecoder?: boolean;
    readonly decoder?: string;
    readonly isDisabled?: boolean;
}
export interface Channel {
    readonly name: string;
    readonly type: common.ChannelType;
    readonly channel: string;
    readonly satellite?: string;
    readonly space?: number;
    readonly freq?: number;
    readonly polarity?: "H" | "V";
    readonly tsmfRelTs?: number;
    readonly serviceId?: number;
    readonly isDisabled?: boolean;
    readonly satelite?: string;
}
export declare function loadServer(): Server;
export declare function saveServer(data: Server): Promise<void>;
export declare function loadTuners(): Tuner[];
export declare function saveTuners(data: Tuner[]): Promise<void>;
export declare function loadChannels(): Channel[];
export declare function saveChannels(data: Channel[]): Promise<void>;
