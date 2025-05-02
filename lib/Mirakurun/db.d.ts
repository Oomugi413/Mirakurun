import * as common from "./common";
export interface Service {
    id: number;
    serviceId: number;
    networkId: number;
    name: string;
    type: number;
    logoId: number;
    remoteControlKeyId?: number;
    epgReady?: boolean;
    epgUpdatedAt?: number;
    channel: Channel[];
    logoData?: string;
}
export interface Channel {
    type: common.ChannelType;
    channel: string;
}
export interface Program {
    id: number;
    eventId: number;
    serviceId: number;
    networkId: number;
    startAt: number;
    duration: number;
    isFree: boolean;
    name?: string;
    description?: string;
    genres?: ProgramGenre[];
    video?: ProgramVideo;
    audios?: ProgramAudio[];
    extended?: {
        [description: string]: string;
    };
    series?: ProgramSeries;
    relatedItems?: ProgramRelatedItem[];
    _pf?: true;
}
export interface ProgramGenre {
    lv1: number;
    lv2: number;
    un1: number;
    un2: number;
}
export interface ProgramVideo {
    type: ProgramVideoType;
    resolution: string;
    streamContent: number;
    componentType: number;
}
export type ProgramVideoType = "mpeg2" | "h.264" | "h.265";
export type ProgramVideoResolution = ("240p" | "480i" | "480p" | "720p" | "1080i" | "1080p" | "2160p" | "4320p");
export interface ProgramAudio {
    componentType: number;
    componentTag: number;
    isMain: boolean;
    samplingRate: ProgramAudioSamplingRate;
    langs: ProgramAudioLanguageCode[];
}
export declare enum ProgramAudioSamplingRate {
    "16kHz" = 16000,
    "22.05kHz" = 22050,
    "24kHz" = 24000,
    "32kHz" = 32000,
    "44.1kHz" = 44100,
    "48kHz" = 48000
}
export type ProgramAudioLanguageCode = ("jpn" | "eng" | "deu" | "fra" | "ita" | "rus" | "zho" | "kor" | "spa" | "etc");
export interface ProgramSeries {
    id: number;
    repeat: number;
    pattern: number;
    expiresAt: number;
    episode: number;
    lastEpisode: number;
    name: string;
}
export type ProgramRelatedItemType = "shared" | "relay" | "movement";
export interface ProgramRelatedItem {
    type: ProgramRelatedItemType;
    networkId?: number;
    serviceId: number;
    eventId: number;
}
export declare function loadServices(integrity: string): Service[];
export declare function saveServices(data: Service[], integrity: string): Promise<void>;
export declare function loadPrograms(integrity: string): Program[];
export declare function savePrograms(data: Program[], integrity: string): Promise<void>;
