const { EventEmitter } = require("events");
const { PassThrough } = require("stream");
const { describe, it } = require("node:test");
const assert = require("assert");
const childProcess = require("child_process");

const _ = require("../lib/Mirakurun/_").default;
const Event = require("../lib/Mirakurun/Event").default;
const originalSetTimeout = global.setTimeout;
global.setTimeout = (callback, delay, ...args) => {
    const timer = originalSetTimeout(callback, delay, ...args);
    if (delay >= 9000) {
        timer.unref();
    }
    return timer;
};
const TunerDevice = require("../lib/Mirakurun/TunerDevice").default;
global.setTimeout = originalSetTimeout;

class ChildProcessMock extends EventEmitter {
    constructor(pid) {
        super();
        this.pid = pid;
        this.stdin = new PassThrough();
        this.stdout = new PassThrough();
        this.stderr = new PassThrough();
        this.killSignals = [];
    }

    kill(signal) {
        this.killSignals.push(signal);
        setImmediate(() => {
            this.emit("exit", 0, signal);
            this.emit("close", 0, signal);
        });
        return true;
    }
}

describe("[tuner-device.spec] TunerDevice mmtsDecoder cleanup", () => {
    it("does not access a cleared mmtsDecoder process from exit handlers", async (t) => {
        const processes = [];
        t.mock.method(childProcess, "spawn", () => {
            const process = new ChildProcessMock(1000 + processes.length);
            processes.push(process);
            return process;
        });

        _.event = new Event();

        const device = new TunerDevice(0, {
            name: "BS4K tuner",
            types: ["BS4K"],
            command: "tuner-command",
            mmtsDecoder: "mmts-decoder"
        });

        device._spawn({
            name: "BS4K",
            type: "BS4K",
            channel: "1"
        });

        assert.strictEqual(processes.length, 2);
        await device._kill(true);
        assert.strictEqual(device._mmtsDecoderProcess, null);
        assert.deepStrictEqual(processes[0].killSignals, ["SIGTERM"]);
        assert.deepStrictEqual(processes[1].killSignals, ["SIGTERM"]);
    });

    it("terminates mmtsDecoder and releases the device when tuner exits first", async (t) => {
        const processes = [];
        t.mock.method(childProcess, "spawn", () => {
            const process = new ChildProcessMock(2000 + processes.length);
            processes.push(process);
            return process;
        });

        _.event = new Event();

        const device = new TunerDevice(1, {
            name: "BS4K tuner",
            types: ["BS4K"],
            command: "tuner-command",
            mmtsDecoder: "mmts-decoder"
        });

        device._spawn({
            name: "BS4K",
            type: "BS4K",
            channel: "1"
        });

        const released = new Promise(resolve => device.once("release", resolve));
        processes[0].emit("exit", 1, null);
        processes[0].emit("close", 1, null);
        await released;

        assert.strictEqual(device._mmtsDecoderProcess, null);
        assert.deepStrictEqual(processes[1].killSignals, ["SIGTERM"]);
    });

    it("keeps the decoder disabled when a remote Mirakurun already decodes", () => {
        _.event = new Event();

        const device = new TunerDevice(2, {
            name: "Remote tuner",
            types: ["BS"],
            command: "unused",
            decoder: "local-decoder",
            remoteMirakurunHost: "remote.example",
            remoteMirakurunDecoder: true
        });

        assert.strictEqual(device.decoder, null);
    });
});
