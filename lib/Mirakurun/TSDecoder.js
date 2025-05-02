"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stream = require("stream");
const child_process = require("child_process");
const log = require("./log");
const status_1 = require("./status");
let idCounter = 0;
class TSDecoder extends stream.Writable {
    constructor(opts) {
        super();
        this._isNew = false;
        this._closed = false;
        this._deadCount = 0;
        this._id = idCounter++;
        this._command = opts.command;
        this._output = opts.output;
        this._output.once("finish", this._close.bind(this));
        this._output.once("close", this._close.bind(this));
        Object.defineProperty(this, "writableLength", {
            get() {
                return opts.output.writableLength;
            }
        });
        Object.defineProperty(this, "writableHighWaterMark", {
            get() {
                return opts.output.writableHighWaterMark;
            }
        });
        this.once("close", this._close.bind(this));
        log.info("TSDecoder#%d has created (command=%s)", this._id, this._command);
        ++status_1.default.streamCount.decoder;
        this._spawn();
    }
    _write(chunk, encoding, callback) {
        if (!this._writable) {
            callback();
            return;
        }
        if (this._isNew === true && this._process) {
            this._isNew = false;
            this._timeout = setTimeout(() => {
                log.warn("TSDecoder#%d process will force killed because no respond...", this._id);
                this._dead();
            }, 1500);
        }
        this._writable.write(chunk);
        callback();
    }
    _final() {
        this._close();
    }
    _spawn() {
        if (this._closed === true || this._process) {
            return;
        }
        if (this._deadCount > 0) {
            ++status_1.default.errorCount.decoderRespawn;
            log.warn("TSDecoder#%d respawning because dead (count=%d)", this._id, this._deadCount);
        }
        const proc = this._process = child_process.spawn(this._command);
        proc.once("close", (code, signal) => {
            log.info("TSDecoder#%d process has closed with exit code=%d by signal `%s` (pid=%d)", this._id, code, signal, proc.pid);
            this._dead();
        });
        proc.stderr.pipe(process.stderr);
        proc.stdout.once("data", () => clearTimeout(this._timeout));
        proc.stdout.on("data", chunk => this._output.write(chunk));
        this._readable = proc.stdout;
        this._writable = proc.stdin;
        this._isNew = true;
        log.info("TSDecoder#%d process has spawned by command `%s` (pid=%d)", this._id, this._command, proc.pid);
    }
    _dead() {
        if (this._closed === true) {
            return;
        }
        log.error("TSDecoder#%d unexpected dead", this._id);
        ++this._deadCount;
        this._kill();
        if (this._deadCount > 3) {
            this._fallback();
            return;
        }
        setTimeout(() => this._spawn(), 1500);
    }
    _fallback() {
        const passThrough = new stream.PassThrough({ allowHalfOpen: false });
        passThrough.on("data", chunk => this._output.write(chunk));
        this._readable = passThrough;
        this._writable = passThrough;
        log.warn("TSDecoder#%d has been fallback into pass-through stream", this._id);
    }
    _kill() {
        if (this._process) {
            this._process.kill("SIGKILL");
            delete this._process;
        }
        if (this._readable) {
            this._readable.destroy();
            delete this._readable;
        }
        if (this._writable) {
            this._writable.destroy();
            delete this._writable;
        }
    }
    _close() {
        if (this._closed === true) {
            return;
        }
        this._closed = true;
        this._kill();
        if (this._output.writableEnded === false) {
            this._output.end();
        }
        this._output.removeAllListeners();
        delete this._output;
        --status_1.default.streamCount.decoder;
        log.info("TSDecoder#%d has closed (command=%s)", this._id, this._command);
        this.emit("close");
        this.emit("end");
    }
}
exports.default = TSDecoder;
//# sourceMappingURL=TSDecoder.js.map