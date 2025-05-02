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
import { join, dirname } from "path";
import { promises as fsPromises } from "fs";
import * as fs from "fs";
import * as log from "./log";
import * as db from "./db";
import _ from "./_";
import Event from "./Event";
import ChannelItem from "./ChannelItem";
import ServiceItem from "./ServiceItem";

const { LOGO_DATA_DIR_PATH } = process.env;

/**
 * Service
 * * TVサービス処理についてのクラス
 */
export default class Service {
    // * ロゴデータのパスを取得
    static getLogoDataPath(networkId: number, serviceId: number, logoId: number) {

        // BS/CS/CATVはロゴIDを使わずにサービスIDで対応する CATVのネットワークIDの範囲が不明なため60000以上で対応
        if (networkId === 4 || networkId === 6 || networkId === 7 || networkId > 60000) {
            return join(LOGO_DATA_DIR_PATH, `${networkId}_${serviceId}.png`);
        }

        if (typeof logoId !== "number" || logoId < 0) {
            throw new Error("Invalid `logoId`");
        }

        // 地上波はロゴIDで保存する
        return join(LOGO_DATA_DIR_PATH, `${networkId}_${logoId}.png`);
    }

    static async getLogoDataMTime(networkId: number, serviceId: number, logoId: number): Promise<number> {

        if (typeof logoId !== "number" || logoId < -1) {
            return 0;
        }

        try {
            return (await fsPromises.stat(Service.getLogoDataPath(networkId, serviceId, logoId))).mtimeMs;
        } catch (e) {
            return 0;
        }
    }

    static async isLogoDataExists(networkId: number, serviceId: number, logoId: number): Promise<boolean> {

        if (typeof logoId !== "number" || logoId < -1) {
            return false;
        }

        try {
            return (await fsPromises.stat(Service.getLogoDataPath(networkId, serviceId, logoId))).isFile();
        } catch (e) {
            return false;
        }
    }

    static async loadLogoData(networkId: number, serviceId: number, logoId: number): Promise<Buffer> {

        if (typeof logoId !== "number" || logoId < -1) {
            return null;
        }

        try {
            return await fsPromises.readFile(Service.getLogoDataPath(networkId, serviceId, logoId));
        } catch (e) {
            return null;
        }
    }

    /**
     * * 放送波からロゴデータを保存する
     * @param networkId ネットワークID(NID)
     * @param serviceId サービスID(SID)
     * @param logoId ロゴID
     * @param data バイナリロゴデータ
     * @param retrying リトライするかどうか
     * @returns
     */
    static async saveLogoData(networkId: number, serviceId: number, logoId: number, data: Uint8Array, retrying = false): Promise<void> {

        log.info("Service.saveLogoData(): saving... (networkId=%d serviceId=%d logoId=%d)", networkId, serviceId, logoId);

        const path = Service.getLogoDataPath(networkId, serviceId, logoId);

        try {
            await fsPromises.writeFile(path, data, { encoding: "binary" });
        } catch (e) {
            if (retrying === false) {
                // mkdir if not exists
                const dirPath = dirname(path);
                if (fs.existsSync(dirPath) === false) {
                    log.warn("Service.saveLogoData(): making directory `%s`... (networkId=%d serviceId=%d logoId=%d)", dirPath, networkId, serviceId, logoId);
                    try {
                        fs.mkdirSync(dirPath, { recursive: true });
                    } catch (e) {
                        throw e;
                    }
                }
                // retry
                log.warn("Service.saveLogoData(): retrying... (networkId=%d serviceId=%d logoId=%d)", networkId, serviceId, logoId);
                return this.saveLogoData(networkId, serviceId, logoId, data, true);
            }
            throw e;
        }

        log.info("Service.saveLogoData(): saved. (networkId=%d serviceId=%d logoId=%d)", networkId, serviceId, logoId);
    }

    private _items: ServiceItem[] = [];
    private _saveTimerId: NodeJS.Timer;

    constructor() {
        this._load();
    }

    get items(): ServiceItem[] {
        return this._items;
    }

    add(item: ServiceItem): void {

        if (this.get(item.id) !== null) {
            return;
        }

        this._items.push(item);

        Event.emit("service", "create", item.export());

        this.save();
    }

    get(id: number): ServiceItem;
    get(networkId: number, serviceId: number): ServiceItem;
    get(id: number, serviceId?: number) {

        if (serviceId === undefined) {
            const l = this._items.length;
            for (let i = 0; i < l; i++) {
                if (this._items[i].id === id) {
                    return this._items[i];
                }
            }
        } else {
            const l = this._items.length;
            for (let i = 0; i < l; i++) {
                if (this._items[i].networkId === id && this._items[i].serviceId === serviceId) {
                    return this._items[i];
                }
            }
        }

        return null;
    }

    exists(id: number): boolean;
    exists(networkId: number, serviceId: number): boolean;
    exists(id: number, serviceId?: number) {
        return this.get(id, serviceId) !== null;
    }

    findByChannel(channel: ChannelItem): ServiceItem[] {

        const items = [];

        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            for (const channels of this._items[i].channel) {
                if (channels === channel) {
                    items.push(this._items[i]);
                }
            }
        }

        return items;
    }

    findByNetworkId(networkId: number): ServiceItem[] {

        const items = [];

        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].networkId === networkId) {
                items.push(this._items[i]);
            }
        }

        return items;
    }

    findByNetworkIdWithLogoId(networkId: number, logoId: number): ServiceItem[] {

        const items = [];

        const l = this._items.length;
        for (let i = 0; i < l; i++) {
            if (this._items[i].networkId === networkId && this._items[i].logoId === logoId) {
                items.push(this._items[i]);
            }
        }

        return items;
    }

    save(): void {
        clearTimeout(this._saveTimerId);
        this._saveTimerId = setTimeout(() => this._save(), 1000 * 3);
    }

    private _load(): void {

        log.debug("loading services...");

        let updated = false;

        const services = db.loadServices(_.configIntegrity.channels);
        for (const service of services) {
            const typelist = service.channel.map(ch => ch.type);
            const channellist = service.channel.map(ch => ch.channel);
            const channelItems: ChannelItem[] = [];

            for (let i = 0; i < typelist.length; i++) {
                channelItems.push(_.channel.get(typelist[i], channellist[i]));
            }

            if (channelItems.length <= 0) {
                updated = true;
                return;
            }

            if (service.networkId === undefined || service.serviceId === undefined) {
                updated = true;
                return;
            }

            // migrate logo data
            if (service.logoData) {
                const logoDataPath = Service.getLogoDataPath(service.networkId, service.serviceId, service.logoId);
                log.warn("migrating deprecated property `logoData` to file `%s` in service#%d (%s) db", logoDataPath, service.id, service.name);
                Service.saveLogoData(service.networkId, service.serviceId, service.logoId, Buffer.from(service.logoData, "base64"));

                // delete duplicates
                services.filter(s => s.networkId === service.networkId && s.serviceId === service.serviceId && s.logoId === service.logoId).forEach(s => {
                    delete s.logoData;
                });
                updated = true;
            }

            this.add(
                new ServiceItem(
                    channelItems,
                    service.networkId,
                    service.serviceId,
                    service.name,
                    service.type,
                    service.logoId,
                    service.remoteControlKeyId,
                    service.epgReady,
                    service.epgUpdatedAt
                )
            );
        }

        if (updated) {
            this.save();
        }
    }

    private _save(): void {

        log.debug("saving services...");

        db.saveServices(
            this._items.map(service => service.export()),
            _.configIntegrity.channels
        );
    }
}
