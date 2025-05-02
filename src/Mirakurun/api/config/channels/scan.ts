/*
   Copyright 2017 kanreisa

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
import { Operation } from "express-openapi";
import * as api from "../../../api";
import * as common from "../../../common";
import * as config from "../../../config";
import * as db from "../../../db";
import _ from "../../../_";

let isScanning = false;

const compareOptions = {
    sensitivity: "base",
    numeric: true
};

const channelOrder = {
    GR: 1,
    BS: 2,
    CS: 3,
    SKY: 4,
    NW1: 5,
    NW2: 6,
    NW3: 7,
    NW4: 8,
    NW5: 9,
    NW6: 10,
    NW7: 11,
    NW8: 12,
    NW9: 13,
    NW10: 14,
    NW11: 15,
    NW12: 16,
    NW13: 17,
    NW14: 18,
    NW15: 19,
    NW16: 20,
    NW17: 21,
    NW18: 22,
    NW19: 23,
    NW20: 24,
    NW21: 25,
    NW22: 26,
    NW23: 27,
    NW24: 28,
    NW25: 29,
    NW26: 30,
    NW27: 31,
    NW28: 32,
    NW29: 33,
    NW30: 34,
    NW31: 35,
    NW32: 36,
    NW33: 37,
    NW34: 38,
    NW35: 39,
    NW36: 40,
    NW37: 41,
    NW38: 42,
    NW39: 43,
    NW40: 44
};

enum ScanMode {
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

function range(start: number, end: number): string[] {
    return Array.from({length: (end - start + 1)}, (v, index) => (index + start).toString(10));
}

export function generateScanConfig(option: ChannelScanOption): ScanConfig {

    // delete undefined from option
    Object.keys(option).forEach(key => option[key] === undefined && delete option[key]);

    if (option.type !== common.ChannelTypes.BS && option.type !== common.ChannelTypes.CS && option.type !== common.ChannelTypes.SKY) {
        option = {
            startCh: 13,
            endCh: 62,
            scanMode: ScanMode.Channel,
            setDisabledOnAdd: false,
            ...option
        };

        return {
            channels: range(option.startCh, option.endCh).map((ch) => ch),
            scanMode: option.scanMode,
            setDisabledOnAdd: option.setDisabledOnAdd
        };
    }

    option = {
        scanMode: ScanMode.Service,
        setDisabledOnAdd: true,
        ...option
    };

    if (option.type === common.ChannelTypes.BS) {
        if (option.useSubCh) {
            option = {
                startCh: 1,
                endCh: 23,
                startSubCh: 0,
                endSubCh: 3,
                ...option
            };

            const channels: string[] = [];
            for (const ch of range(option.startCh, option.endCh)) {
                for (const subCh of range(option.startSubCh, option.endSubCh)) {
                    channels.push(`BS${ch.toString().padStart(2, "0")}_${subCh}`);
                }
            }

            return {
                channels: channels,
                scanMode: option.scanMode,
                setDisabledOnAdd: option.setDisabledOnAdd
            };
        }

        option = {
            startCh: 101,
            endCh: 256,
            ...option
        };

        return {
            channels: range(option.startCh, option.endCh).map((ch) => ch),
            scanMode: option.scanMode,
            setDisabledOnAdd: option.setDisabledOnAdd
        };
    }

    if (option.type === common.ChannelTypes.CS) {
        option = {
            startCh: 2,
            endCh: 24,
            ...option
        };

        return {
            channels: range(option.startCh, option.endCh).map((ch) => `CS${ch}`),
            scanMode: option.scanMode,
            setDisabledOnAdd: option.setDisabledOnAdd
        };
    }
}

export function generateChannelItemForService(type: common.ChannelType, channel: string, service: db.Service, setDisabledOnAdd: boolean): config.Channel {

    let name = service.name;
    name = name.trim();
    if (name.length === 0) {
        name = `${type}${channel}:${service.serviceId}`;
    }

    return {
        name: name,
        type: type,
        channel: channel,
        serviceId: service.serviceId,
        isDisabled: setDisabledOnAdd
    };
}

export function generateChannelItemForChannel(type: common.ChannelType, channel: string, services: db.Service[], setDisabledOnAdd: boolean): config.Channel {

    const baseName = services[0].name;
    let matchIndex = baseName.length;

    for (let servicesIndex = 1; servicesIndex < services.length; servicesIndex++) {
        const service = services[servicesIndex];
        for (let nameIndex = 0; nameIndex < baseName.length && nameIndex < service.name.length; nameIndex++) {
            if (baseName[nameIndex] !== service.name[nameIndex]) {
                if (nameIndex === 0) {
                    break;
                }
                if (nameIndex < matchIndex) {
                    matchIndex = nameIndex;
                }
                break;
            }
            if (nameIndex + 1 >= service.name.length && service.name.length < matchIndex) {
                matchIndex = service.name.length;
                break;
            }
        }
    }

    let name = baseName.slice(0, matchIndex);
    name = name.trim();
    if (name.length === 0) {
        name = `${type}${channel}`;
    }

    return {
        name: name,
        type: type,
        channel: channel,
        isDisabled: setDisabledOnAdd
    };
}

export function generateChannelItems(scanMode: ScanMode, type: common.ChannelType, channel: string, services: db.Service[], setDisabledOnAdd: boolean): config.Channel[] {

    if (scanMode === ScanMode.Service) {
        const channelItems: config.Channel[] = [];
        for (const service of services) {
            channelItems.push(generateChannelItemForService(type, channel, service, setDisabledOnAdd));
        }
        return channelItems;
    }

    return [generateChannelItemForChannel(type, channel, services, setDisabledOnAdd)];
}

export const put: Operation = async (req, res) => {

    if (isScanning === true) {
        api.responseError(res, 409, "Already Scanning");
        return;
    }
    isScanning = true;

    req.setTimeout(1000 * 60 * 10); // 10 minites

    const dryRun = req.query.dryRun as any as boolean;
    const type = req.query.type as common.ChannelType;
    const refresh = req.query.refresh as any as boolean;
    const oldChannelItems = config.loadChannels();
    const result: config.Channel[] = oldChannelItems.filter(channel => channel.type !== type);
    let newCount = 0;
    let takeoverCount = 0;

    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.status(200);
    if (dryRun) {
        res.write("-- dry run --\n\n");
    }
    res.write(`channel scanning... (type: "${type}")\n\n`);

    const scanConfig = generateScanConfig({
        type: type,
        startCh: req.query.minCh as any as number,
        endCh: req.query.maxCh as any as number,
        startSubCh: req.query.minSubCh as any as number,
        endSubCh: req.query.maxSubCh as any as number,
        useSubCh: req.query.useSubCh as any as boolean,
        scanMode: req.query.scanMode as any as ScanMode,
        setDisabledOnAdd: req.query.setDisabledOnAdd as any as boolean
    });

    const chLength = scanConfig.channels.length;
    for (let i = 0; i < chLength; i++) {
        const channel = scanConfig.channels[i];

        res.write(`channel: "${channel}" (${i + 1}/${chLength}) [${Math.round((i + 1) / chLength * 100)}%] ...\n`);

        if (!refresh) {
            const takeoverChannelItems = oldChannelItems.filter(chItem => chItem.type === type && chItem.channel === channel && !chItem.isDisabled);
            if (takeoverChannelItems.length > 0) {
                res.write(`-> ${takeoverChannelItems.length} existing config found.\n`);
                for (const channelItem of takeoverChannelItems) {
                    result.push(channelItem);
                    ++takeoverCount;
                    res.write(`-> ${JSON.stringify(channelItem)}\n`);
                }
                res.write("# scan has skipped due to the \"refresh = false\" option because an existing config was found.\n\n");
                continue;
            }
        }

        let services: db.Service[];
        try {
            services = await _.tuner.getServices(<any> {
                type: type,
                channel: channel
            });
        } catch (e) {
            res.write("-> no signal.");
            if (/stream has closed before get network/.test(e) === false) {
                res.write(` [${e}]`);
            }
            res.write("\n\n");
            continue;
        }

        services = services.filter(service => service.type === 1 || service.type === 173);
        res.write(`-> ${services.length} services found.\n`);

        if (services.length === 0) {
            res.write("\n");
            continue;
        }

        const scannedChannelItems = generateChannelItems(scanConfig.scanMode, type, channel, services, scanConfig.setDisabledOnAdd);
        for (const scannedChannelItem of scannedChannelItems) {
            result.push(scannedChannelItem);
            ++newCount;
            res.write(`-> ${JSON.stringify(scannedChannelItem)}\n`);
        }
        res.write("\n");
    }

    result.sort((a, b) => a.type === b.type ? a.channel.localeCompare(b.channel, undefined, compareOptions) : channelOrder[a.type] - channelOrder[b.type]);

    res.write(`-> new ${newCount} channels found.\n`);
    res.write(`-> existing ${takeoverCount} channels merged.\n`);
    res.write(`-> total ${newCount + takeoverCount}/${result.length} (${type}/Any) channels configured.\n\n`);

    if (!dryRun) {
        config.saveChannels(result);
    }

    isScanning = false;

    if (dryRun) {
        res.write("channel scan has been completed.\n\n");
        res.write("-- dry run --\n");
    } else {
        res.write("channel scan has been completed and saved successfully.\n");
        res.write("**RESTART REQUIRED** to apply changes.\n");
    }

    res.end();
};

put.apiDoc = {
    tags: ["config"],
    summary: "Channel Scan",
    description: `Entry rewriting specifications:
- The scan is performed on a range of channels of the specified type and the entries for those channels, if any, are saved in the configuration file.
- If the channel to be scanned is described in the configuration file and is enabled, the scan will not be performed for that channel and the entries described will remain intact. If you do not want to keep the entries, use the \`refresh\` option.
- All entries outside the channel range of the specified type will be deleted.
- All entries of a type other than the specified type will remain.

About BS Subchannel Style:
- Only when scanning BS, you can specify the channel number in the subchannel style (e.g. BS01_0). To specify the channel number, use minSubCh and maxSubCh in addition to minCh and maxCh.
- The subchannel number parameters (minSubCh, maxSubCh) are used only if the type is BS and are ignored otherwise.
- Subchannel style scans scan in the following range:
    From \`BS\${minCh}_\${minSubCh}\` to \`BS\${maxCh}_\${maxSubCh}\`
- In the subchannel style, minCh and maxCh are zero padded to two digits. minSubCh and maxSubCh are not padded.
- BS "non" subchannel style scans and GR scans are basically the same. Note that if you scan the wrong channel range, the GR channel will be registered as BS and the BS channel will be registered as GR. This problem does not occur because CS scan uses a character string with \`CS\` added as a channel number prefix.`,
    operationId: "channelScan",
    produces: [
        "text/plain",
        "application/json"
    ],
    parameters: [
        {
            in: "query",
            name: "dryRun",
            type: "boolean",
            allowEmptyValue: true,
            default: false,
            description: "dry run. If `true`, the scanned result will not be saved."
        },
        {
            in: "query",
            name: "type",
            type: "string",
            enum: [common.ChannelTypes.GR, common.ChannelTypes.BS, common.ChannelTypes.CS,
                common.ChannelTypes.NW1, common.ChannelTypes.NW2, common.ChannelTypes.NW3, common.ChannelTypes.NW4, common.ChannelTypes.NW5, common.ChannelTypes.NW6, common.ChannelTypes.NW7, common.ChannelTypes.NW8, common.ChannelTypes.NW9, common.ChannelTypes.NW10,
                common.ChannelTypes.NW11, common.ChannelTypes.NW12, common.ChannelTypes.NW13, common.ChannelTypes.NW14, common.ChannelTypes.NW15, common.ChannelTypes.NW16, common.ChannelTypes.NW17, common.ChannelTypes.NW18, common.ChannelTypes.NW19, common.ChannelTypes.NW20,
                common.ChannelTypes.NW21, common.ChannelTypes.NW22, common.ChannelTypes.NW23, common.ChannelTypes.NW24, common.ChannelTypes.NW25, common.ChannelTypes.NW26, common.ChannelTypes.NW27, common.ChannelTypes.NW28, common.ChannelTypes.NW29, common.ChannelTypes.NW30,
                common.ChannelTypes.NW31, common.ChannelTypes.NW32, common.ChannelTypes.NW33, common.ChannelTypes.NW34, common.ChannelTypes.NW35, common.ChannelTypes.NW36, common.ChannelTypes.NW37, common.ChannelTypes.NW38, common.ChannelTypes.NW39, common.ChannelTypes.NW40],
            default: common.ChannelTypes.GR,
            description: "Specifies the channel type to scan."
        },
        {
            in: "query",
            name: "minCh",
            type: "integer",
            description: "Specifies the minimum number of channel numbers to scan."
        },
        {
            in: "query",
            name: "maxCh",
            type: "integer",
            description: "Specifies the maximum number of channel numbers to scan."
        },
        {
            in: "query",
            name: "minSubCh",
            type: "integer",
            description: "Specifies the minimum number of subchannel numbers to scan. This parameter is only used if the type is `BS` and the bs_subch_style is `true`."
        },
        {
            in: "query",
            name: "maxSubCh",
            type: "integer",
            description: "Specifies the maximum number of subchannel numbers to scan. This parameter is only used if the type is `BS` and the bs_subch_style is `true`."
        },
        {
            in: "query",
            name: "useSubCh",
            type: "boolean",
            allowEmptyValue: true,
            default: true,
            description: "Specify true to specify the channel in the subchannel style. Only used for BS scans. (e.g. BS01_0)"
        },
        {
            in: "query",
            name: "scanMode",
            type: "string",
            enum: [ScanMode.Channel, ScanMode.Service],
            description: "To specify the service explictly, use the `Service` mode.\n\n" +
                "_Default value (GR)_: Channel\n" +
                "_Default value (BS/CS)_: Service"
        },
        {
            in: "query",
            name: "setDisabledOnAdd",
            type: "boolean",
            allowEmptyValue: true,
            description: "If `true`, set disable on add channel.\n\n" +
                "_Default value (GR)_: false\n" +
                "_Default value (BS/CS)_: true"
        },
        {
            in: "query",
            name: "refresh",
            type: "boolean",
            allowEmptyValue: true,
            default: false,
            description: "If `true`, update the existing settings without inheriting them.\n" +
                "However, non-scanned types of channels will always be inherited."
        }
    ],
    responses: {
        200: {
            description: "OK"
        },
        409: {
            description: "Already Scanning",
            schema: {
                $ref: "#/definitions/Error"
            }
        },
        default: {
            description: "Unexpected Error",
            schema: {
                $ref: "#/definitions/Error"
            }
        }
    }
};
