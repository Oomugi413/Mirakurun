"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.saveChannels = exports.loadChannels = exports.saveTuners = exports.loadTuners = exports.saveServer = exports.loadServer = void 0;
const child_process_1 = require("child_process");
const path_1 = require("path");
const os_1 = require("os");
const fs = require("fs");
const yaml = require("js-yaml");
const ipnum = require("ip-num");
const log = require("./log");
const { DOCKER, DOCKER_NETWORK, SERVER_CONFIG_PATH, TUNERS_CONFIG_PATH, CHANNELS_CONFIG_PATH, HOSTNAME, LOG_LEVEL, MAX_LOG_HISTORY, MAX_BUFFER_BYTES_BEFORE_READY, EVENT_END_TIMEOUT, PROGRAM_GC_INTERVAL, EPG_GATHERING_INTERVAL, EPG_GATHERING_INTERVALGR, EPG_GATHERING_INTERVALBS, EPG_GATHERING_INTERVALCS, EPG_GATHERING_INTERVALSKY, EPG_GATHERING_INTERVALNW, EPG_RETRIEVAL_TIME, LOGO_DATA_INTERVAL, DISABLE_EIT_PARSING, DISABLE_WEB_UI, ALLOW_IPV4_CIDR_RANGES, ALLOW_IPV6_CIDR_RANGES, ALLOW_LISTEN_ALL_INTERFACE } = process.env;
const IS_DOCKER = DOCKER === "YES";
function loadServer() {
    const path = SERVER_CONFIG_PATH;
    const dirPath = (0, path_1.dirname)(path);
    if (fs.existsSync(dirPath) === false) {
        log.info("missing directory `%s`", dirPath);
        try {
            log.info("making directory `%s`", dirPath);
            fs.mkdirSync(dirPath, { recursive: true });
        }
        catch (e) {
            log.fatal("failed to make directory `%s`", dirPath);
            console.error(e);
            process.exit(1);
        }
    }
    if (fs.existsSync(path) === false) {
        log.info("missing server config `%s`", path);
        try {
            log.info("copying default server config to `%s`", path);
            if (process.platform === "win32") {
                fs.copyFileSync("config/server.win32.yml", path);
            }
            else {
                fs.copyFileSync("config/server.yml", path);
            }
        }
        catch (e) {
            log.fatal("failed to copy server config to `%s`", path);
            console.error(e);
            process.exit(1);
        }
    }
    const config = load("server", path);
    if (!config.allowIPv4CidrRanges) {
        config.allowIPv4CidrRanges = ["10.0.0.0/8", "127.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16", "100.0.0.0/8"];
    }
    if (!config.allowIPv6CidrRanges) {
        config.allowIPv6CidrRanges = ["fc00::/7", "::1/128"];
    }
    if (config.allowListenAllInterface === undefined) {
        config.allowListenAllInterface = true;
    }
    if (IS_DOCKER) {
        config.path = "/var/run/mirakurun.sock";
        if (DOCKER_NETWORK !== "host") {
            config.port = 40772;
            config.disableIPv6 = true;
        }
        if (!config.hostname && typeof HOSTNAME !== "undefined" && HOSTNAME.trim().length > 0) {
            config.hostname = HOSTNAME.trim();
        }
        if (typeof LOG_LEVEL !== "undefined" && /^-?[0123]$/.test(LOG_LEVEL)) {
            config.logLevel = parseInt(LOG_LEVEL, 10);
        }
        if (typeof MAX_LOG_HISTORY !== "undefined" && /^[0-9]+$/.test(MAX_LOG_HISTORY)) {
            config.maxLogHistory = parseInt(MAX_LOG_HISTORY, 10);
        }
        if (typeof MAX_BUFFER_BYTES_BEFORE_READY !== "undefined" && /^[0-9]+$/.test(MAX_BUFFER_BYTES_BEFORE_READY)) {
            config.maxBufferBytesBeforeReady = parseInt(MAX_BUFFER_BYTES_BEFORE_READY, 10);
        }
        if (typeof EVENT_END_TIMEOUT !== "undefined" && /^[0-9]+$/.test(EVENT_END_TIMEOUT)) {
            config.eventEndTimeout = parseInt(EVENT_END_TIMEOUT, 10);
        }
        if (typeof PROGRAM_GC_INTERVAL !== "undefined" && /^[0-9]+$/.test(PROGRAM_GC_INTERVAL)) {
            config.programGCInterval = parseInt(PROGRAM_GC_INTERVAL, 10);
        }
        if (typeof EPG_GATHERING_INTERVAL !== "undefined" && /^[0-9]+$/.test(EPG_GATHERING_INTERVAL)) {
            config.epgGatheringInterval = parseInt(EPG_GATHERING_INTERVAL, 10);
        }
        if (typeof EPG_GATHERING_INTERVAL !== "undefined" && /^[0-9]+$/.test(EPG_GATHERING_INTERVALGR)) {
            config.epgGatheringIntervalGR = parseInt(EPG_GATHERING_INTERVALGR, 10);
        }
        if (typeof EPG_GATHERING_INTERVAL !== "undefined" && /^[0-9]+$/.test(EPG_GATHERING_INTERVALBS)) {
            config.epgGatheringIntervalBS = parseInt(EPG_GATHERING_INTERVALBS, 10);
        }
        if (typeof EPG_GATHERING_INTERVAL !== "undefined" && /^[0-9]+$/.test(EPG_GATHERING_INTERVALCS)) {
            config.epgGatheringIntervalCS = parseInt(EPG_GATHERING_INTERVALCS, 10);
        }
        if (typeof EPG_GATHERING_INTERVAL !== "undefined" && /^[0-9]+$/.test(EPG_GATHERING_INTERVALSKY)) {
            config.epgGatheringIntervalSKY = parseInt(EPG_GATHERING_INTERVALSKY, 10);
        }
        if (typeof EPG_GATHERING_INTERVAL !== "undefined" && /^[0-9]+$/.test(EPG_GATHERING_INTERVALNW)) {
            config.epgGatheringIntervalNW = parseInt(EPG_GATHERING_INTERVALNW, 10);
        }
        if (typeof EPG_RETRIEVAL_TIME !== "undefined" && /^[0-9]+$/.test(EPG_RETRIEVAL_TIME)) {
            config.epgRetrievalTime = parseInt(EPG_RETRIEVAL_TIME, 10);
        }
        if (typeof LOGO_DATA_INTERVAL !== "undefined" && /^[0-9]+$/.test(LOGO_DATA_INTERVAL)) {
            config.logoDataInterval = parseInt(LOGO_DATA_INTERVAL, 10);
        }
        if (DISABLE_EIT_PARSING === "true") {
            config.disableEITParsing = true;
        }
        if (DISABLE_WEB_UI === "true") {
            config.disableWebUI = true;
        }
        if (typeof ALLOW_IPV4_CIDR_RANGES !== "undefined" && ALLOW_IPV4_CIDR_RANGES.trim().length > 0) {
            config.allowIPv4CidrRanges = ALLOW_IPV4_CIDR_RANGES.split(",");
        }
        if (typeof ALLOW_IPV6_CIDR_RANGES !== "undefined" && ALLOW_IPV6_CIDR_RANGES.trim().length > 0) {
            config.allowIPv6CidrRanges = ALLOW_IPV6_CIDR_RANGES.split(",");
        }
        if (ALLOW_LISTEN_ALL_INTERFACE === "true") {
            config.allowListenAllInterface = true;
        }
        log.info("load server config (merged w/ env): %s", JSON.stringify(config));
    }
    if (!config.hostname) {
        config.hostname = (0, os_1.hostname)();
        log.info("detected hostname: %s", config.hostname);
    }
    {
        const validRanges = [];
        for (const range of config.allowIPv4CidrRanges) {
            const [valid, errors] = ipnum.Validator.isValidIPv4CidrRange(range);
            if (valid) {
                validRanges.push(range);
                continue;
            }
            for (const error of errors) {
                log.error("invalid server config property `allowIPv4CidrRanges`: %s - %s", range, error);
            }
        }
        config.allowIPv4CidrRanges = validRanges;
    }
    {
        const validRanges = [];
        for (const range of config.allowIPv6CidrRanges) {
            const [valid, errors] = ipnum.Validator.isValidIPv6CidrRange(range);
            if (valid) {
                validRanges.push(range);
                continue;
            }
            for (const error of errors) {
                log.error("invalid server config property `allowIPv6CidrRanges`: %s - %s", range, error);
            }
        }
        config.allowIPv6CidrRanges = validRanges;
    }
    return config;
}
exports.loadServer = loadServer;
function saveServer(data) {
    return save("server", SERVER_CONFIG_PATH, data);
}
exports.saveServer = saveServer;
function loadTuners() {
    const path = TUNERS_CONFIG_PATH;
    const dirPath = (0, path_1.dirname)(path);
    if (fs.existsSync(dirPath) === false) {
        log.info("missing directory `%s`", dirPath);
        try {
            log.info("making directory `%s`", dirPath);
            fs.mkdirSync(dirPath, { recursive: true });
        }
        catch (e) {
            log.fatal("failed to make directory `%s`", dirPath);
            console.error(e);
            process.exit(1);
        }
    }
    if (process.platform === "linux" && fs.existsSync(path) === false) {
        log.info("missing tuners config `%s`", path);
        log.info("trying to detect tuners...");
        const tuners = [];
        try {
            (0, child_process_1.execSync)("which dvb-fe-tool");
            const adapters = fs.readdirSync("/dev/dvb").filter(name => /^adapter[0-9]+$/.test(name));
            for (let i = 0; i < adapters.length; i++) {
                log.info("detected DVB device: %s", adapters[i]);
                (0, child_process_1.execSync)("sleep 1");
                const properties = (0, child_process_1.execSync)(`dvb-fe-tool -a ${i} 2>&1 || true`, { encoding: "utf8" });
                const isISDBT = properties.includes("[ISDBT]");
                const isISDBS = properties.includes("[ISDBS]");
                if (!isISDBT && !isISDBS) {
                    continue;
                }
                const tuner = {
                    name: adapters[i],
                    types: undefined,
                    dvbDevicePath: `/dev/dvb/adapter${i}/dvr0`,
                    decoder: "arib-b25-stream-test"
                };
                if (isISDBT) {
                    tuner.types = ["GR"];
                    tuner.command = `dvbv5-zap -a ${i} -c ./config/dvbconf-for-isdb/conf/dvbv5_channels_isdbt.conf -r -P <channel>`;
                }
                else if (isISDBS) {
                    tuner.types = ["BS", "CS"];
                    tuner.command = `dvbv5-zap -a ${i} -c ./config/dvbconf-for-isdb/conf/dvbv5_channels_isdbs.conf -r -P <channel>`;
                }
                tuners.push(tuner);
                log.info("added tuner config (generated): %s", JSON.stringify(tuner));
            }
        }
        catch (e) {
            if (/which dvb-fe-tool/.test(e.message)) {
                log.warn("`dvb-fe-tool` is required to detect DVB devices. (%s)", e.message);
            }
            else {
                console.error(e);
            }
        }
        log.info("detected %d tuners!", tuners.length);
        if (tuners.length > 0) {
            try {
                log.info("writing auto generated tuners config to `%s`", path);
                fs.writeFileSync(path, yaml.dump(tuners));
            }
            catch (e) {
                log.fatal("failed to write tuners config to `%s`", path);
                console.error(e);
                process.exit(1);
            }
        }
    }
    if (fs.existsSync(path) === false) {
        log.info("missing tuners config `%s`", path);
        try {
            log.info("copying default tuners config to `%s`", path);
            if (process.platform === "win32") {
                fs.copyFileSync("config/tuners.win32.yml", path);
            }
            else {
                fs.copyFileSync("config/tuners.yml", path);
            }
        }
        catch (e) {
            log.fatal("failed to copy tuners config to `%s`", path);
            console.error(e);
            process.exit(1);
        }
    }
    return load("tuners", path);
}
exports.loadTuners = loadTuners;
function saveTuners(data) {
    return save("tuners", TUNERS_CONFIG_PATH, data);
}
exports.saveTuners = saveTuners;
function loadChannels() {
    const path = CHANNELS_CONFIG_PATH;
    const dirPath = (0, path_1.dirname)(path);
    if (fs.existsSync(dirPath) === false) {
        log.info("missing directory `%s`", dirPath);
        try {
            log.info("making directory `%s`", dirPath);
            fs.mkdirSync(dirPath, { recursive: true });
        }
        catch (e) {
            log.fatal("failed to make directory `%s`", dirPath);
            console.error(e);
            process.exit(1);
        }
    }
    if (fs.existsSync(path) === false) {
        log.info("missing channels config `%s`", path);
        try {
            log.info("copying default channels config to `%s`", path);
            if (process.platform === "win32") {
                fs.copyFileSync("config/channels.win32.yml", path);
            }
            else {
                fs.copyFileSync("config/channels.yml", path);
            }
        }
        catch (e) {
            log.fatal("failed to copy channels config to `%s`", path);
            console.error(e);
            process.exit(1);
        }
    }
    return load("channels", path);
}
exports.loadChannels = loadChannels;
function saveChannels(data) {
    return save("channels", CHANNELS_CONFIG_PATH, data);
}
exports.saveChannels = saveChannels;
function load(name, path) {
    log.info("load %s config `%s`", name, path);
    return yaml.load(fs.readFileSync(path, "utf8"));
}
function save(name, path, data) {
    log.info("save %s config `%s`", name, path);
    return new Promise((resolve, reject) => {
        fs.writeFile(path, yaml.dump(data), err => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}
//# sourceMappingURL=config.js.map