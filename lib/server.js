"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
Buffer.poolSize = 0;
require("dotenv").config();
const path = require("path");
const child_process_1 = require("child_process");
const crypto_1 = require("crypto");
if (process.platform === "linux") {
    if (process.getuid() === 0) {
        try {
            (0, child_process_1.execSync)(`renice -n -10 -p ${process.pid}`);
            (0, child_process_1.execSync)(`ionice -c 1 -n 7 -p ${process.pid}`);
        }
        catch (e) {
            console.warn("error on modify nice: " + e.message);
        }
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
function setEnv(name, value) {
    process.env[name] = process.env[name] || value;
}
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
const _1 = __importDefault(require("./Mirakurun/_"));
const status_1 = __importDefault(require("./Mirakurun/status"));
const Event_1 = __importDefault(require("./Mirakurun/Event"));
const Job_1 = __importDefault(require("./Mirakurun/Job"));
const Tuner_1 = __importDefault(require("./Mirakurun/Tuner"));
const Channel_1 = __importDefault(require("./Mirakurun/Channel"));
const Service_1 = __importDefault(require("./Mirakurun/Service"));
const Program_1 = __importDefault(require("./Mirakurun/Program"));
const Server_1 = __importDefault(require("./Mirakurun/Server"));
const config = __importStar(require("./Mirakurun/config"));
const log = __importStar(require("./Mirakurun/log"));
(async function top() {
    _1.default.config.server = await config.loadServer();
    _1.default.config.channels = await config.loadChannels();
    _1.default.configIntegrity.channels = (0, crypto_1.createHash)("sha256").update(JSON.stringify(_1.default.config.channels)).digest("base64");
    _1.default.config.tuners = await config.loadTuners();
    if (typeof _1.default.config.server.logLevel === "number") {
        log.logLevel = _1.default.config.server.logLevel;
    }
    if (typeof _1.default.config.server.maxLogHistory === "number") {
        log.maxLogHistory = _1.default.config.server.maxLogHistory;
    }
    _1.default.event = new Event_1.default();
    _1.default.job = new Job_1.default();
    _1.default.tuner = new Tuner_1.default();
    _1.default.channel = new Channel_1.default();
    _1.default.service = new Service_1.default();
    _1.default.program = new Program_1.default();
    _1.default.server = new Server_1.default();
    await _1.default.service.load();
    await _1.default.program.load();
    if (process.env.SETUP === "true") {
        log.info("setup is done.");
        process.exit(0);
    }
    _1.default.server.init();
})();
//# sourceMappingURL=server.js.map