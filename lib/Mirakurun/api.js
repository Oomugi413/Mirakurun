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
exports.responseError = responseError;
exports.responseStreamErrorHandler = responseStreamErrorHandler;
exports.responseJSON = responseJSON;
const util_1 = require("util");
const yieldableJSON = __importStar(require("yieldable-json"));
const stringifyAsync = (0, util_1.promisify)(yieldableJSON.stringifyAsync);
function responseError(res, code, reason) {
    if (reason) {
        res.writeHead(code, reason, {
            "Content-Type": "application/json"
        });
    }
    else {
        res.writeHead(code, {
            "Content-Type": "application/json"
        });
    }
    const error = {
        code: code,
        reason: reason || null,
        errors: []
    };
    res.end(JSON.stringify(error));
    return res;
}
function responseStreamErrorHandler(res, err) {
    if (err.message === "no available tuners") {
        return responseError(res, 503, "Tuner Resource Unavailable");
    }
    return responseError(res, 500, err.message);
}
async function responseJSON(res, body) {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200);
    res.end(await stringifyAsync(body));
    return res;
}
//# sourceMappingURL=api.js.map