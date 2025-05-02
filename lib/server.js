"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
Buffer.poolSize = 0;
require("dotenv").config();
const path = require("path");
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
if (process.platform === "linux") {
    if (process.getuid() === 0) {
        (0, child_process_1.execSync)(`renice -n -10 -p ${process.pid}`);
        (0, child_process_1.execSync)(`ionice -c 1 -n 7 -p ${process.pid}`);
    }
    else {
        console.warn("running in not root!");
    }
}
process.title = "Mirakurun: Server";
process.on("uncaughtException", err => {
    ++status_1.default.errorCount.uncaughtException;
    console.error(err.stack);
});
process.on("unhandledRejection", err => {
    ++status_1.default.errorCount.unhandledRejection;
    console.error(err);
});
const configDir = path.join(process.cwd(), "local_config");
const dataDir = path.join(process.cwd(), "local_data");
console.log("configDir:", configDir);
console.log("dataDir:", dataDir);
setEnv("SERVER_CONFIG_PATH", path.join(configDir, "server.yml"));
setEnv("TUNERS_CONFIG_PATH", path.join(configDir, "tuners.yml"));
setEnv("CHANNELS_CONFIG_PATH", path.join(configDir, "channels.yml"));
setEnv("SERVICES_DB_PATH", path.join(dataDir, "services.json"));
setEnv("PROGRAMS_DB_PATH", path.join(dataDir, "programs.json"));
setEnv("LOGO_DATA_DIR_PATH", path.join(dataDir, "logo-data"));
const _1 = require("./Mirakurun/_");
const status_1 = require("./Mirakurun/status");
const Event_1 = require("./Mirakurun/Event");
const Tuner_1 = require("./Mirakurun/Tuner");
const Channel_1 = require("./Mirakurun/Channel");
const Service_1 = require("./Mirakurun/Service");
const Program_1 = require("./Mirakurun/Program");
const Server_1 = require("./Mirakurun/Server");
const config = require("./Mirakurun/config");
const log = require("./Mirakurun/log");
_1.default.config.server = config.loadServer();
_1.default.config.channels = config.loadChannels();
_1.default.configIntegrity.channels = (0, crypto_1.createHash)("sha256")
    .update(JSON.stringify(_1.default.config.channels))
    .digest("base64");
_1.default.config.tuners = config.loadTuners();
if (typeof _1.default.config.server.logLevel === "number") {
    log.logLevel = _1.default.config.server.logLevel;
}
if (typeof _1.default.config.server.maxLogHistory === "number") {
    log.maxLogHistory = _1.default.config.server.maxLogHistory;
}
_1.default.event = new Event_1.default();
_1.default.tuner = new Tuner_1.default();
_1.default.channel = new Channel_1.default();
_1.default.service = new Service_1.default();
_1.default.program = new Program_1.default();
_1.default.server = new Server_1.default();
if (process.env.SETUP === "true") {
    log.info("setup is done.");
    process.exit(0);
}
_1.default.server.init();
function setEnv(name, value) {
    process.env[name] = process.env[name] || value;
}
//# sourceMappingURL=server.js.map