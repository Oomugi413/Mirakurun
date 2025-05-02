"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const http = require("http");
const express = require("express");
const cors = require("cors");
const openapi = require("express-openapi");
const morgan = require("morgan");
const yaml = require("js-yaml");
const common_1 = require("./common");
const log = require("./log");
const system = require("./system");
const regexp_1 = require("./regexp");
const _1 = require("./_");
const rpc_1 = require("./rpc");
const pkg = require("../../package.json");
class Server {
    constructor() {
        this._isRunning = false;
        this._servers = new Set();
        this._rpcs = new Set();
    }
    async init() {
        if (this._isRunning === true) {
            throw new Error("Server is running");
        }
        this._isRunning = true;
        const serverConfig = _1.default.config.server;
        let addresses = [];
        if (serverConfig.path) {
            addresses.push(serverConfig.path);
        }
        if (serverConfig.port) {
            while (true) {
                try {
                    if (system.getIPv4AddressesForListen().length > 0) {
                        break;
                    }
                }
                catch (e) {
                    console.error(e);
                }
                log.warn("Server hasn't detected IPv4 addresses...");
                await (0, common_1.sleep)(5000);
            }
            addresses = [
                ...addresses,
                ...system.getIPv4AddressesForListen(),
                "127.0.0.1"
            ];
            if (serverConfig.disableIPv6 !== true) {
                addresses = [
                    ...addresses,
                    ...system.getIPv6AddressesForListen(),
                    "::1"
                ];
            }
        }
        const app = express();
        app.disable("x-powered-by");
        app.disable("etag");
        if (!serverConfig.allowListenAllInterface) {
            const corsOptions = {
                origin: (origin, callback) => {
                    if (!origin) {
                        return callback(null, true);
                    }
                    if (system.isPermittedHost(origin, serverConfig.hostname)) {
                        return callback(null, true);
                    }
                    return callback(new Error("Not allowed by CORS"));
                }
            };
            app.use(cors(corsOptions));
        }
        app.use(morgan(":remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms :user-agent", {
            stream: log.event
        }));
        app.use(express.urlencoded({ extended: false }));
        app.use(express.json());
        app.use((req, res, next) => {
            if (!serverConfig.allowListenAllInterface) {
                if (req.ip && system.isPermittedIPAddress(req.ip) === false) {
                    req.socket.end();
                    return;
                }
                if (req.get("Origin") !== undefined) {
                    if (!system.isPermittedHost(req.get("Origin"), serverConfig.hostname)) {
                        res.status(403).end();
                        return;
                    }
                }
                if (req.get("Referer") !== undefined) {
                    if (!system.isPermittedHost(req.get("Referer"), serverConfig.hostname)) {
                        res.status(403).end();
                        return;
                    }
                }
            }
            res.setHeader("Server", "Mirakurun/" + pkg.version);
            next();
        });
        if (!serverConfig.disableWebUI) {
            app.use(express.static("lib/ui", {
                setHeaders: (res, path) => {
                    if (express.static.mime.lookup(path) === "image/svg+xml") {
                        res.setHeader("Cache-Control", "public, max-age=86400");
                    }
                }
            }));
            app.use("/swagger-ui", express.static("node_modules/swagger-ui-dist"));
            app.use("/api/debug", express.static("lib/ui/swagger-ui.html"));
        }
        const api = yaml.load(fs.readFileSync("api.yml", "utf8"));
        api.info.version = pkg.version;
        openapi.initialize({
            app: app,
            apiDoc: api,
            docsPath: "/docs",
            paths: "./lib/Mirakurun/api"
        });
        app.use((err, req, res, next) => {
            if (err.message === "Not allowed by CORS") {
                res.status(403).end();
                return;
            }
            log.error(JSON.stringify(err, null, "  "));
            console.error(err.stack);
            if (res.headersSent === false) {
                res.writeHead(err.status || 500, {
                    "Content-Type": "application/json"
                });
            }
            res.end(JSON.stringify({
                code: res.statusCode,
                reason: err.message || res.statusMessage,
                errors: err.errors
            }));
            next();
        });
        if (!serverConfig.allowListenAllInterface) {
            addresses.forEach(address => {
                const server = http.createServer(app);
                server.timeout = 1000 * 15;
                if (regexp_1.default.unixDomainSocket.test(address) === true || regexp_1.default.windowsNamedPipe.test(address) === true) {
                    if (process.platform !== "win32" && fs.existsSync(address) === true) {
                        fs.unlinkSync(address);
                    }
                    server.listen(address, () => {
                        log.info("listening on http+unix://%s", address.replace(/\//g, "%2F"));
                    });
                    if (process.platform !== "win32") {
                        fs.chmodSync(address, "777");
                    }
                }
                else {
                    const [addr, iface] = address.split("%");
                    server.listen(serverConfig.port, addr, () => {
                        if (address.includes(":") === true) {
                            log.info("listening on http://[%s]:%d (%s)", addr, serverConfig.port, iface);
                        }
                        else {
                            log.info("listening on http://%s:%d", address, serverConfig.port);
                        }
                    });
                }
                this._servers.add(server);
                this._rpcs.add((0, rpc_1.createRPCServer)(server));
            });
        }
        else {
            for (const addr of ["0.0.0.0", "::"]) {
                const server = http.createServer(app);
                server.timeout = 1000 * 15;
                server.listen(serverConfig.port, addr);
                this._servers.add(server);
                this._rpcs.add((0, rpc_1.createRPCServer)(server));
            }
        }
        (0, rpc_1.initRPCNotifier)(this._rpcs);
        log.info("RPC interface is enabled");
    }
}
exports.default = Server;
//# sourceMappingURL=Server.js.map