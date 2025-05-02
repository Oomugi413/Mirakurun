"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTimeFromBCD24 = exports.getTimeFromMJD = exports.sleep = exports.updateObject = exports.ChannelTypes = void 0;
var ChannelTypes;
(function (ChannelTypes) {
    ChannelTypes["GR"] = "GR";
    ChannelTypes["BS"] = "BS";
    ChannelTypes["CS"] = "CS";
    ChannelTypes["SKY"] = "SKY";
    ChannelTypes["NW1"] = "NW1";
    ChannelTypes["NW2"] = "NW2";
    ChannelTypes["NW3"] = "NW3";
    ChannelTypes["NW4"] = "NW4";
    ChannelTypes["NW5"] = "NW5";
    ChannelTypes["NW6"] = "NW6";
    ChannelTypes["NW7"] = "NW7";
    ChannelTypes["NW8"] = "NW8";
    ChannelTypes["NW9"] = "NW9";
    ChannelTypes["NW10"] = "NW10";
    ChannelTypes["NW11"] = "NW11";
    ChannelTypes["NW12"] = "NW12";
    ChannelTypes["NW13"] = "NW13";
    ChannelTypes["NW14"] = "NW14";
    ChannelTypes["NW15"] = "NW15";
    ChannelTypes["NW16"] = "NW16";
    ChannelTypes["NW17"] = "NW17";
    ChannelTypes["NW18"] = "NW18";
    ChannelTypes["NW19"] = "NW19";
    ChannelTypes["NW20"] = "NW20";
    ChannelTypes["NW21"] = "NW21";
    ChannelTypes["NW22"] = "NW22";
    ChannelTypes["NW23"] = "NW23";
    ChannelTypes["NW24"] = "NW24";
    ChannelTypes["NW25"] = "NW25";
    ChannelTypes["NW26"] = "NW26";
    ChannelTypes["NW27"] = "NW27";
    ChannelTypes["NW28"] = "NW28";
    ChannelTypes["NW29"] = "NW29";
    ChannelTypes["NW30"] = "NW30";
    ChannelTypes["NW31"] = "NW31";
    ChannelTypes["NW32"] = "NW32";
    ChannelTypes["NW33"] = "NW33";
    ChannelTypes["NW34"] = "NW34";
    ChannelTypes["NW35"] = "NW35";
    ChannelTypes["NW36"] = "NW36";
    ChannelTypes["NW37"] = "NW37";
    ChannelTypes["NW38"] = "NW38";
    ChannelTypes["NW39"] = "NW39";
    ChannelTypes["NW40"] = "NW40";
})(ChannelTypes = exports.ChannelTypes || (exports.ChannelTypes = {}));
function updateObject(target, input) {
    let updated = false;
    for (const k in input) {
        if (Array.isArray(target[k]) && Array.isArray(input[k])) {
            updated = updateArray(target[k], input[k]) || updated;
            continue;
        }
        else if (target[k] === null && input[k] === null) {
            continue;
        }
        else if (typeof target[k] === "object" && typeof input[k] === "object") {
            updated = updateObject(target[k], input[k]) || updated;
            continue;
        }
        else if (target[k] === input[k]) {
            continue;
        }
        target[k] = input[k];
        updated = true;
    }
    return updated;
}
exports.updateObject = updateObject;
function updateArray(target, input) {
    const length = target.length;
    if (length !== input.length) {
        target.splice(0, length, ...input);
        return true;
    }
    let updated = false;
    for (let i = 0; i < length; i++) {
        if (Array.isArray(target[i]) && Array.isArray(input[i])) {
            updated = updateArray(target[i], input[i]) || updated;
            continue;
        }
        else if (target[i] === null && input[i] === null) {
            continue;
        }
        else if (typeof target[i] === "object" && typeof input[i] === "object") {
            updated = updateObject(target[i], input[i]) || updated;
            continue;
        }
        else if (target[i] === input[i]) {
            continue;
        }
        target[i] = input[i];
        updated = true;
    }
    return updated;
}
function sleep(ms) {
    return new Promise(resolve => {
        setTimeout(resolve, ms);
    });
}
exports.sleep = sleep;
function getTimeFromMJD(buffer) {
    const mjd = (buffer[0] << 8) | buffer[1];
    const h = (buffer[2] >> 4) * 10 + (buffer[2] & 0x0F);
    const i = (buffer[3] >> 4) * 10 + (buffer[3] & 0x0F);
    const s = (buffer[4] >> 4) * 10 + (buffer[4] & 0x0F);
    return ((mjd - 40587) * 86400 + ((h - 9) * 60 * 60) + (i * 60) + s) * 1000;
}
exports.getTimeFromMJD = getTimeFromMJD;
function getTimeFromBCD24(buffer) {
    let time = ((buffer[0] >> 4) * 10 + (buffer[0] & 0x0F)) * 3600;
    time += ((buffer[1] >> 4) * 10 + (buffer[1] & 0x0F)) * 60;
    time += (buffer[2] >> 4) * 10 + (buffer[2] & 0x0F);
    return time * 1000;
}
exports.getTimeFromBCD24 = getTimeFromBCD24;
//# sourceMappingURL=common.js.map