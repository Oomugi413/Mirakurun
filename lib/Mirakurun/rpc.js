"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initRPCNotifier = exports.createRPCServer = void 0;
const server_1 = require("jsonrpc2-ws/lib/server");
const log = require("./log");
const _1 = require("./_");
const status_1 = require("./status");
const Event_1 = require("./Event");
const log_1 = require("./log");
const system_1 = require("./system");
const status_2 = require("./api/status");
const common_1 = require("./common");
function createRPCServer(server) {
    const rpc = new server_1.default({
        pingInterval: 1000 * 30,
        wss: {
            path: "/rpc",
            perMessageDeflate: false,
            clientTracking: false,
            noServer: true
        }
    });
    server.on("upgrade", serverOnUpgrade.bind(rpc.wss));
    rpc.on("connection", rpcConnection);
    rpc.methods.set("join", onJoin);
    rpc.methods.set("leave", onLeave);
    rpc.methods.set("getStatus", status_2.getStatus);
    rpc.methods.set("getTuners", getTuners);
    return rpc;
}
exports.createRPCServer = createRPCServer;
const _notifierListeners = new Map();
function initRPCNotifier(rpcs) {
    const eventsNMDict = {
        program: new NotifyManager("events:program", "events", rpcs),
        service: new NotifyManager("events:service", "events", rpcs),
        tuner: new NotifyManager("events:tuner", "events", rpcs)
    };
    function onEventListener(event) {
        eventsNMDict[event.resource].notify(event);
    }
    const logsNM = new NotifyManager("logs", "logs", rpcs);
    function onLogDataListener(log) {
        logsNM.notify(log);
    }
    Event_1.default.onEvent(onEventListener);
    log_1.event.on("data", onLogDataListener);
    _notifierListeners.set(rpcs, [
        onEventListener,
        onLogDataListener
    ]);
}
exports.initRPCNotifier = initRPCNotifier;
class NotifyManager {
    constructor(_room, _method, _rpcs) {
        this._room = _room;
        this._method = _method;
        this._rpcs = _rpcs;
        this._items = new Set();
        this._active = false;
    }
    async notify(item) {
        this._items.add(item);
        if (this._active) {
            return;
        }
        this._active = true;
        await (0, common_1.sleep)(100);
        if (status_1.default.rpcCount > 0) {
            const params = {
                array: [...this._items.values()]
            };
            for (const rpc of this._rpcs) {
                if (rpc.sockets.size > 0) {
                    rpc.notifyTo(this._room, this._method, params);
                }
            }
        }
        this._items.clear();
        this._active = false;
    }
}
function serverOnUpgrade(req, socket, head) {
    if (!_1.default.config.server.allowListenAllInterface) {
        if (req.socket.remoteAddress && !(0, system_1.isPermittedIPAddress)(req.socket.remoteAddress)) {
            socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
            socket.destroy();
            return;
        }
        if (req.headers.origin !== undefined) {
            if (!(0, system_1.isPermittedHost)(req.headers.origin, _1.default.config.server.hostname)) {
                socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
                socket.destroy();
                return;
            }
        }
    }
    this.handleUpgrade(req, socket, head, ws => this.emit("connection", ws, req));
}
function rpcConnection(socket, req) {
    ++status_1.default.rpcCount;
    const ip = req.socket.remoteAddress || "unix";
    const ua = "" + req.headers["user-agent"];
    socket.data.set("ip", ip);
    socket.data.set("ua", ua);
    socket.ws.on("error", wsError);
    socket.on("close", socketClose);
    log.info(`${ip} - RPC #${socket.id} connected - - ${ua}`);
}
function wsError(err) {
    log.error(JSON.stringify(err, null, "  "));
    console.error(err.stack);
}
function socketClose() {
    --status_1.default.rpcCount;
    log.info(`${this.data.get("ip")} - RPC #${this.id} closed - ${this.data.get("ua")}`);
}
function onJoin(socket, params) {
    for (const room of params.rooms) {
        socket.joinTo(room);
    }
}
function onLeave(socket, params) {
    for (const room of params.rooms) {
        socket.leaveFrom(room);
    }
}
function getTuners() {
    return _1.default.tuner.devices;
}
//# sourceMappingURL=rpc.js.map