"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isPermittedHost = exports.isPermittedIPAddress = exports.getIPv6AddressesForListen = exports.getIPv4AddressesForListen = void 0;
const os = require("os");
const Validator_1 = require("ip-num/Validator");
const IPNumber_1 = require("ip-num/IPNumber");
const Prefix_1 = require("ip-num/Prefix");
const IPRange_1 = require("ip-num/IPRange");
const _1 = require("./_");
function getIPv4AddressesForListen() {
    const addresses = [];
    const interfaces = os.networkInterfaces();
    if (!_1.default.config.server.allowListenAllInterface) {
        Object.keys(interfaces).forEach(k => {
            interfaces[k]
                .filter(a => {
                return (a.family === "IPv4" &&
                    a.internal === false &&
                    isPermittedIPAddress(a.address) === true);
            })
                .forEach(a => addresses.push(a.address));
        });
    }
    else {
        Object.keys(interfaces).forEach(k => {
            interfaces[k]
                .filter(a => {
                return (a.family === "IPv4");
            })
                .forEach(a => addresses.push(a.address));
        });
    }
    return addresses;
}
exports.getIPv4AddressesForListen = getIPv4AddressesForListen;
function getIPv6AddressesForListen() {
    const addresses = [];
    const interfaces = os.networkInterfaces();
    if (!_1.default.config.server.allowListenAllInterface) {
        Object.keys(interfaces).forEach(k => {
            interfaces[k]
                .filter(a => {
                return (a.family === "IPv6" &&
                    a.internal === false &&
                    isPermittedIPAddress(a.address) === true);
            })
                .forEach(a => addresses.push(a.address + "%" + k));
        });
    }
    else {
        Object.keys(interfaces).forEach(k => {
            interfaces[k]
                .filter(a => {
                return (a.family === "IPv6");
            })
                .forEach(a => addresses.push(a.address + "%" + k));
        });
    }
    return addresses;
}
exports.getIPv6AddressesForListen = getIPv6AddressesForListen;
function isPermittedIPAddress(addr) {
    addr = addr.replace("[", "").replace("]", "");
    addr = addr.split("%")[0];
    const [isIPv4] = Validator_1.Validator.isValidIPv4String(addr);
    if (isIPv4) {
        const ipv4 = new IPRange_1.IPv4CidrRange(new IPNumber_1.IPv4(addr), new Prefix_1.IPv4Prefix(32));
        for (const rangeString of _1.default.config.server.allowIPv4CidrRanges) {
            if (ipv4.inside(IPRange_1.IPv4CidrRange.fromCidr(rangeString))) {
                return true;
            }
        }
    }
    const [isIPv6] = Validator_1.Validator.isValidIPv6String(addr);
    if (isIPv6) {
        const ipv6 = new IPRange_1.IPv6CidrRange(new IPNumber_1.IPv6(addr), new Prefix_1.IPv6Prefix(128));
        for (const rangeString of _1.default.config.server.allowIPv6CidrRanges) {
            if (ipv6.inside(IPRange_1.IPv6CidrRange.fromCidr(rangeString))) {
                return true;
            }
        }
    }
    return false;
}
exports.isPermittedIPAddress = isPermittedIPAddress;
function isPermittedHost(url, allowedHostname) {
    const u = new URL(url);
    if (u.hostname === "localhost" || u.hostname === allowedHostname || isPermittedIPAddress(u.hostname) === true) {
        return true;
    }
    return false;
}
exports.isPermittedHost = isPermittedHost;
//# sourceMappingURL=system.js.map