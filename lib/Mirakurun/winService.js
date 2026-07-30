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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SERVICE_DISPLAY_NAME = void 0;
exports.toServiceId = toServiceId;
exports.parseServiceAccount = parseServiceAccount;
exports.defaultServiceAccountName = defaultServiceAccountName;
exports.extractExecutablePath = extractExecutablePath;
exports.collectTunerDirectories = collectTunerDirectories;
exports.buildServicePath = buildServicePath;
exports.buildServiceEnvironment = buildServiceEnvironment;
const yaml = __importStar(require("js-yaml"));
exports.SERVICE_DISPLAY_NAME = "Mirakurun";
function toServiceId(displayName) {
    return displayName.replace(/[^\w]/gi, "").toLowerCase();
}
function parseServiceAccount(input, computerName) {
    const trimmed = (input || "").trim();
    if (trimmed === "") {
        return null;
    }
    const separator = trimmed.lastIndexOf("\\");
    if (separator === -1) {
        return { domain: computerName, account: trimmed };
    }
    const domain = trimmed.slice(0, separator);
    const account = trimmed.slice(separator + 1);
    if (account === "") {
        return null;
    }
    return {
        domain: domain === "" || domain === "." ? computerName : domain,
        account: account
    };
}
function defaultServiceAccountName(env) {
    const account = env.USERNAME || "";
    if (account === "") {
        return "";
    }
    const domain = env.USERDOMAIN || env.COMPUTERNAME || "";
    return domain === "" ? account : `${domain}\\${account}`;
}
function extractExecutablePath(command) {
    const trimmed = (command || "").trim();
    if (trimmed === "") {
        return null;
    }
    if (trimmed[0] === "\"" || trimmed[0] === "'") {
        const quote = trimmed[0];
        const end = trimmed.indexOf(quote, 1);
        return end === -1 ? null : trimmed.slice(1, end);
    }
    const end = trimmed.search(/\s/);
    return end === -1 ? trimmed : trimmed.slice(0, end);
}
function collectTunerDirectories(tunersYaml) {
    let tuners;
    try {
        tuners = yaml.load(tunersYaml);
    }
    catch (e) {
        return [];
    }
    if (Array.isArray(tuners) === false) {
        return [];
    }
    const result = [];
    for (const tuner of tuners) {
        if (tuner === null || typeof tuner !== "object") {
            continue;
        }
        for (const key of ["command", "decoder"]) {
            const value = tuner[key];
            if (typeof value !== "string") {
                continue;
            }
            const executable = extractExecutablePath(value);
            if (executable === null || /[\\/]/.test(executable) === false) {
                continue;
            }
            const directory = executable.replace(/[\\/][^\\/]*$/, "");
            if (directory !== "" && result.includes(directory) === false) {
                result.push(directory);
            }
        }
    }
    return result;
}
function buildServicePath(machinePath, extraDirectories) {
    const entries = [];
    for (const entry of (machinePath || "").split(";")) {
        const normalized = entry.trim().replace(/[\\/]+$/, "");
        if (normalized !== "" && entries.includes(normalized) === false) {
            entries.push(normalized);
        }
    }
    for (const directory of extraDirectories) {
        const normalized = (directory || "").trim().replace(/[\\/]+$/, "");
        if (normalized !== "" && entries.includes(normalized) === false) {
            entries.push(normalized);
        }
    }
    return entries.join(";");
}
function buildServiceEnvironment(input) {
    const entries = [
        { name: "Path", value: buildServicePath(input.machinePath, input.extraDirectories) }
    ];
    if (typeof input.userProfile === "string" && input.userProfile !== "") {
        entries.push({ name: "USERPROFILE", value: input.userProfile });
    }
    if (typeof input.localAppData === "string" && input.localAppData !== "") {
        entries.push({ name: "LOCALAPPDATA", value: input.localAppData });
    }
    entries.push({ name: "USING_WINSER", value: "1" });
    return entries;
}
//# sourceMappingURL=winService.js.map