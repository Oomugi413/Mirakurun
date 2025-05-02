import * as common from "./common";
import ChannelItem from "./ChannelItem";
export default class Channel {
    private _items;
    private _epgGatheringInterval;
    private _epgGatheringIntervalGR;
    private _epgGatheringIntervalBS;
    private _epgGatheringIntervalCS;
    private _epgGatheringIntervalSKY;
    private _epgGatheringIntervalNW;
    constructor();
    get items(): ChannelItem[];
    add(item: ChannelItem): void;
    get(type: common.ChannelType, channel: string): ChannelItem;
    findByType(type: common.ChannelType): ChannelItem[];
    private _load;
    private _epgGatherer;
}
