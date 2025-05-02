/// <reference types="node" />
import ChannelItem from "./ChannelItem";
import ServiceItem from "./ServiceItem";
export default class Service {
    static getLogoDataPath(networkId: number, serviceId: number, logoId: number): string;
    static getLogoDataMTime(networkId: number, serviceId: number, logoId: number): Promise<number>;
    static isLogoDataExists(networkId: number, serviceId: number, logoId: number): Promise<boolean>;
    static loadLogoData(networkId: number, serviceId: number, logoId: number): Promise<Buffer>;
    static saveLogoData(networkId: number, serviceId: number, logoId: number, data: Uint8Array, retrying?: boolean): Promise<void>;
    private _items;
    private _saveTimerId;
    constructor();
    get items(): ServiceItem[];
    add(item: ServiceItem): void;
    get(id: number): ServiceItem;
    get(networkId: number, serviceId: number): ServiceItem;
    exists(id: number): boolean;
    exists(networkId: number, serviceId: number): boolean;
    findByChannel(channel: ChannelItem): ServiceItem[];
    findByNetworkId(networkId: number): ServiceItem[];
    findByNetworkIdWithLogoId(networkId: number, logoId: number): ServiceItem[];
    save(): void;
    private _load;
    private _save;
}
