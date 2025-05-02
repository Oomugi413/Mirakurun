"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.savePrograms = exports.loadPrograms = exports.saveServices = exports.loadServices = exports.ProgramAudioSamplingRate = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
const fs = require("fs");
const log = require("./log");
var ProgramAudioSamplingRate;
(function (ProgramAudioSamplingRate) {
    ProgramAudioSamplingRate[ProgramAudioSamplingRate["16kHz"] = 16000] = "16kHz";
    ProgramAudioSamplingRate[ProgramAudioSamplingRate["22.05kHz"] = 22050] = "22.05kHz";
    ProgramAudioSamplingRate[ProgramAudioSamplingRate["24kHz"] = 24000] = "24kHz";
    ProgramAudioSamplingRate[ProgramAudioSamplingRate["32kHz"] = 32000] = "32kHz";
    ProgramAudioSamplingRate[ProgramAudioSamplingRate["44.1kHz"] = 44100] = "44.1kHz";
    ProgramAudioSamplingRate[ProgramAudioSamplingRate["48kHz"] = 48000] = "48kHz";
})(ProgramAudioSamplingRate = exports.ProgramAudioSamplingRate || (exports.ProgramAudioSamplingRate = {}));
function loadServices(integrity) {
    return load(process.env.SERVICES_DB_PATH, integrity);
}
exports.loadServices = loadServices;
async function saveServices(data, integrity) {
    return save(process.env.SERVICES_DB_PATH, data, integrity);
}
exports.saveServices = saveServices;
function loadPrograms(integrity) {
    return load(process.env.PROGRAMS_DB_PATH, integrity);
}
exports.loadPrograms = loadPrograms;
async function savePrograms(data, integrity) {
    return save(process.env.PROGRAMS_DB_PATH, data, integrity);
}
exports.savePrograms = savePrograms;
function load(path, integrity) {
    log.info("load db `%s` w/ integrity (%s)", path, integrity);
    if (fs.existsSync(path) === true) {
        const json = fs.readFileSync(path, "utf8");
        try {
            const array = JSON.parse(json);
            if (array.length > 0 && array[0].__integrity__) {
                if (integrity === array[0].__integrity__) {
                    return array.slice(1);
                }
                else {
                    log.warn("db `%s` integrity check has failed", path);
                    return [];
                }
            }
            return array;
        }
        catch (e) {
            log.error("db `%s` is broken (%s: %s)", path, e.name, e.message);
            return [];
        }
    }
    else {
        log.info("db `%s` is not exists", path);
        return [];
    }
}
async function save(path, data, integrity, retrying = false) {
    log.info("save db `%s` w/ integirty (%s)", path, integrity);
    data.unshift({ __integrity__: integrity });
    try {
        await fs_1.promises.writeFile(path, JSON.stringify(data));
    }
    catch (e) {
        if (retrying === false) {
            const dirPath = (0, path_1.dirname)(path);
            if (fs.existsSync(dirPath) === false) {
                try {
                    fs.mkdirSync(dirPath, { recursive: true });
                }
                catch (e) {
                    throw e;
                }
            }
            return save(path, data, integrity, true);
        }
        throw e;
    }
}
//# sourceMappingURL=db.js.map