import * as config from "./config";
import Event from "./Event";
import Tuner from "./Tuner";
import Channel from "./Channel";
import Service from "./Service";
import Program from "./Program";
import Server from "./Server";
interface Shared {
    readonly config: {
        server?: config.Server;
        channels?: config.Channel[];
        tuners?: config.Tuner[];
    };
    readonly configIntegrity: {
        channels: string;
    };
    event?: Event;
    tuner?: Tuner;
    channel?: Channel;
    service?: Service;
    program?: Program;
    server?: Server;
}
declare const _: Shared;
export default _;
