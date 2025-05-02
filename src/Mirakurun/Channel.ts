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
import * as common from "./common";
import * as log from "./log";
import _ from "./_";
import status from "./status";
import queue from "./queue";
import ChannelItem from "./ChannelItem";

export default class Channel {

    private _items: ChannelItem[] = [];
    private _epgGatheringInterval: number = _.config.server.epgGatheringInterval || 1000 * 60 * 30; // 30 mins
    private _epgGatheringIntervalGR: number = _.config.server.epgGatheringIntervalGR || this._epgGatheringInterval;
    private _epgGatheringIntervalBS: number = _.config.server.epgGatheringIntervalBS || this._epgGatheringInterval;
    private _epgGatheringIntervalCS: number = _.config.server.epgGatheringIntervalCS || this._epgGatheringInterval;
    private _epgGatheringIntervalSKY: number = _.config.server.epgGatheringIntervalSKY || this._epgGatheringInterval;
    private _epgGatheringIntervalNW: number = _.config.server.epgGatheringIntervalNW || this._epgGatheringInterval;

    constructor() {

        this._load();

        if (_.config.server.disableEITParsing !== true) {
            setTimeout(this._epgGatherer.bind(this), 1000 * 60);
        }
    }

    get items(): ChannelItem[] {
        return this._items;
    }

    add(item: ChannelItem): void {

        if (this.get(item.type, item.channel) === null) {
            this._items.push(item);
        }
    }

    get(type: common.ChannelType, channel: string): ChannelItem {

        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].channel === channel && this._items[i].type === type) {
                return this._items[i];
            }
        }

        return null;
    }

    findByType(type: common.ChannelType): ChannelItem[] {

        const items = [];

        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].type === type) {
                items.push(this._items[i]);
            }
        }

        return items;
    }

    private _load(): void {

        log.debug("loading channels...");

        const channels = _.config.channels;

        channels.forEach((channel, i) => {

            if (typeof channel.name !== "string") {
                log.error("invalid type of property `name` in channel#%d configuration", i);
                return;
            }

            // if (channel.type !== "GR" && channel.type !== "BS" && channel.type !== "CS" && channel.type !== "SKY" && channel.type !== "NW1" && channel.type !== "NW2" && channel.type !== "NW3" && channel.type !== "NW4" && channel.type !== "NW5" && channel.type !== "NW6") {
            //     log.error("invalid type of property `type` in channel#%d (%s) configuration", i, channel.name);
            //     return;
            // }

            if (typeof channel.channel !== "string") {
                log.error("invalid type of property `channel` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.satelite && !channel.satellite) {
                log.warn("renaming deprecated property name `satelite` to `satellite` in channel#%d (%s) configuration", i, channel.name);
                (<any> channel).satellite = channel.satelite;
            }

            if (channel.satellite && typeof channel.satellite !== "string") {
                log.error("invalid type of property `satellite` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.space && typeof channel.space !== "number") {
                log.error("invalid type of property `space` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.freq !== undefined && typeof channel.freq !== "number") {
                log.error("invalid type of property `freq` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.polarity && channel.polarity !== "H" && channel.polarity !== "V") {
                log.error("invalid type of property `polarity` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.serviceId && typeof channel.serviceId !== "number") {
                log.error("invalid type of property `serviceId` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.tsmfRelTs && typeof channel.tsmfRelTs !== "number") {
                log.error("invalid type of property `tsmfRelTs` in channel#%d (%s) configuration", i, channel.name);
                return;
            }

            if (channel.isDisabled === true) {
                return;
            }

            if (_.tuner.typeExists(channel.type) === false) {
                return;
            }

            const pre = this.get(channel.type, channel.channel);
            if (pre) {
                if (channel.serviceId) {
                    pre.addService(channel.serviceId);
                }
            } else {
                const arr = ["BS", "CS", "SKY"];
                if (arr.includes(channel.type)) {
                    (<any> channel).name = `${channel.type}:${channel.channel}`;
                }
                this.add(new ChannelItem(channel));
            }
        });
    }

    private _epgGatherer(): void {
        const nw_type_list = ["NW1", "NW2", "NW3", "NW4", "NW5", "NW6", "NW7", "NW8", "NW9", "NW10",
            "NW11", "NW12", "NW13", "NW14", "NW15", "NW16", "NW17", "NW18", "NW19", "NW20",
            "NW21", "NW22", "NW23", "NW24", "NW25", "NW26", "NW27", "NW28", "NW29", "NW30",
            "NW31", "NW32", "NW33", "NW34", "NW35", "NW36", "NW37", "NW38", "NW39", "NW40"];

        queue.add(async () => {

            const networkIds = [...new Set(_.service.items.map(item => item.networkId))];

            networkIds.forEach(networkId => {

                const services = _.service.findByNetworkId(networkId);

                if (services.length === 0) {
                    return;
                }
                const service = services[0];

                queue.add(async () => {

                    for (const ch of service.channel) {
                        if (service.epgReady === true) {
                            const now = Date.now();
                            // EPG取得間隔優先順位 GR > BS > CS > SKY > NW > 全体設定
                            if (ch.type === "GR" && now - service.epgUpdatedAt < this._epgGatheringIntervalGR) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalGR`", networkId);
                                return;
                            }
                            if (ch.type === "BS" && now - service.epgUpdatedAt < this._epgGatheringIntervalBS) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalBS`", networkId);
                                return;
                            }
                            if (ch.type === "CS" && now - service.epgUpdatedAt < this._epgGatheringIntervalCS) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalCS`", networkId);
                                return;
                            }
                            if (ch.type === "SKY" && now - service.epgUpdatedAt < this._epgGatheringIntervalSKY) {
                                log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalSKY`", networkId);
                                return;
                            }
                            if (nw_type_list.indexOf(ch.type) !== -1) {
                                if (now - service.epgUpdatedAt < this._epgGatheringIntervalNW) {
                                    log.info("Network#%d EPG gathering has skipped by `epgGatheringIntervalNW`", networkId);
                                    return;
                                }
                            }
                            if (now - service.epgUpdatedAt > 1000 * 60 * 60 * 6) { // 6 hours
                                log.info("Network#%d EPG gathering is resuming forcibly because reached maximum pause time", networkId);
                                service.epgReady = false;
                            } else {
                                const currentPrograms = _.program.findByNetworkIdAndTime(networkId, now)
                                    .filter(program => !!program.name && program.name !== "放送休止");
                                if (currentPrograms.length === 0) {
                                    const networkPrograms = _.program.findByNetworkId(networkId);
                                    if (networkPrograms.length > 0) {
                                        log.info("Network#%d EPG gathering has skipped because broadcast is off", networkId);
                                        return;
                                    }
                                    service.epgReady = false;
                                }
                            }
                        }

                        if (status.epg[networkId] === true) {
                            log.info("Network#%d EPG gathering is already in progress on another stream", networkId);
                            return;
                        }

                        log.info("Network#%d EPG gathering has started", networkId);

                        try {
                            await _.tuner.getEPG(ch);
                            log.info("Network#%d EPG gathering has finished", networkId);
                        } catch (e) {
                            log.warn("Network#%d EPG gathering has failed [%s]", networkId, e);
                        }
                    }
                });

                log.debug("Network#%d EPG gathering has queued", networkId);
            });

            queue.add(async () => {
                setTimeout(this._epgGatherer.bind(this), this._epgGatheringInterval);
            });
        });
    }
}
