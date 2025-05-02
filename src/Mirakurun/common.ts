/*
   Copyright 2016 kanreisa

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
import { Writable } from "stream";
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

export enum ChannelTypes {
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

export function updateObject<T, U>(target: T, input: U): boolean;
export function updateObject<T extends any[], U extends any[]>(target: T, input: U): boolean {

    let updated = false;

    for (const k in input) {
        if (Array.isArray(target[k]) && Array.isArray(input[k])) {
            updated = updateArray(target[k], input[k]) || updated;
            continue;
        } else if (target[k] === null && input[k] === null) {
            continue;
        } else if (typeof target[k] === "object" && typeof input[k] === "object") {
            updated = updateObject(target[k], input[k]) || updated;
            continue;
        } else if (target[k] === input[k]) {
            continue;
        }

        target[k] = input[k];
        updated = true;
    }

    return updated;
}

function updateArray<T extends any[], U extends any[]>(target: T, input: U): boolean {

    const length = target.length;

    if (length !== input.length) {
        target.splice(0, length, ...input);
        return true;
    }

    let updated = false;

    for (let i = 0; i < length; i++) {
        if (Array.isArray(target[i]) && Array.isArray(input[i])) {
            updated = updateArray(target[i], input[i]) || updated;
            continue;
        } else if (target[i] === null && input[i] === null) {
            continue;
        } else if (typeof target[i] === "object" && typeof input[i] === "object") {
            updated = updateObject(target[i], input[i]) || updated;
            continue;
        } else if (target[i] === input[i]) {
            continue;
        }

        target[i] = input[i];
        updated = true;
    }

    return updated;
}

export function sleep(ms: number): Promise<void> {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}

export function getTimeFromMJD(buffer: Uint8Array | Buffer): number {

    const mjd = (buffer[0] << 8) | buffer[1];
    const h = (buffer[2] >> 4) * 10 + (buffer[2] & 0x0F);
    const i = (buffer[3] >> 4) * 10 + (buffer[3] & 0x0F);
    const s = (buffer[4] >> 4) * 10 + (buffer[4] & 0x0F);

    return ((mjd - 40587) * 86400 + ((h - 9) * 60 * 60) + (i * 60) + s) * 1000;
}

export function getTimeFromBCD24(buffer: Uint8Array | Buffer): number {

    let time = ((buffer[0] >> 4) * 10 + (buffer[0] & 0x0F)) * 3600;
    time += ((buffer[1] >> 4) * 10 + (buffer[1] & 0x0F)) * 60;
    time += (buffer[2] >> 4) * 10 + (buffer[2] & 0x0F);

    return time * 1000;
}
