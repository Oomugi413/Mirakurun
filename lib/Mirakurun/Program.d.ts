import * as db from "./db";
export declare function getProgramItemId(networkId: number, serviceId: number, eventId: number): number;
export default class Program {
    private _itemMap;
    private _saveTimerId;
    private _emitTimerId;
    private _emitRunning;
    private _emitPrograms;
    private _programGCInterval;
    constructor();
    get itemMap(): Map<number, db.Program>;
    add(item: db.Program, firstAdd?: boolean): void;
    get(id: number): db.Program | null;
    set(id: number, props: Partial<db.Program>): void;
    remove(id: number): void;
    exists(id: number): boolean;
    findByQuery(query: object): db.Program[];
    findByNetworkId(networkId: number): db.Program[];
    findByNetworkIdAndTime(networkId: number, time: number): db.Program[];
    findByNetworkIdAndReplace(networkId: number, programs: db.Program[]): void;
    save(): void;
    private _load;
    private _findAndRemoveConflicts;
    private _emit;
    private _save;
    private _gc;
}
