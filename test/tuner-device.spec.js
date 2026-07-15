const { describe, it, beforeEach } = require("node:test");
const assert = require("assert");
const EventEmitter = require("events");

const shared = require("../lib/Mirakurun/_").default;
const MirakurunEvent = require("../lib/Mirakurun/Event").default;
const ChannelItem = require("../lib/Mirakurun/ChannelItem").default;
const TunerDeviceModule = require("../lib/Mirakurun/TunerDevice");
const TunerDevice = TunerDeviceModule.default;
const TunerStartupError = TunerDeviceModule.TunerStartupError;

function createChannel() {
    return new ChannelItem({
        name: "Test",
        type: "GR-ALT",
        channel: "27"
    });
}

function createDevice() {
    return new TunerDevice(0, {
        name: "J-GR-1",
        types: ["GR-ALT"],
        remoteMirakurunHost: "127.0.0.1"
    });
}

function createStream() {
    const stream = new EventEmitter();
    stream.closed = false;
    stream.end = () => {
        if (stream.closed === false) {
            stream.closed = true;
            stream.emit("close");
        }
    };
    return stream;
}

function installFakeSpawn(device) {
    device._spawn = function (channel) {
        const tunerProcess = new EventEmitter();
        tunerProcess.pid = 123;
        tunerProcess.stderr = new EventEmitter();
        tunerProcess.kill = () => undefined;

        this._process = tunerProcess;
        this._stream = new EventEmitter();
        this._channel = channel;
        this._command = "fake remote";
    };
}

describe("[tuner-device.spec] remote stream startup", () => {
    beforeEach(() => {
        shared.event = new MirakurunEvent();
    });

    it("waits for the first remote stream data", async () => {
        const device = createDevice();
        const channel = createChannel();
        const output = createStream();
        installFakeSpawn(device);

        const starting = device.startStream({
            id: "test",
            priority: 0,
            streamSetting: { channel }
        }, output, channel);

        setImmediate(() => device._stream.emit("data", Buffer.from([0x47])));

        await starting;
        assert.strictEqual(device.users.length, 1);
    });

    it("rejects when the remote process closes before producing data", async () => {
        const device = createDevice();
        const channel = createChannel();
        const output = createStream();
        installFakeSpawn(device);

        const starting = device.startStream({
            id: "test",
            priority: 0,
            streamSetting: { channel }
        }, output, channel);

        setImmediate(() => {
            device._exited = true;
            device._process.emit("close", 1, null);
        });

        await assert.rejects(starting, TunerStartupError);
        assert.strictEqual(device.users.length, 0);
    });

    it("ends remote users instead of respawning the same failed tuner", () => {
        const device = createDevice();
        const channel = createChannel();
        const output = createStream();
        const tunerProcess = new EventEmitter();
        tunerProcess.stderr = new EventEmitter();

        device._process = tunerProcess;
        device._stream = new EventEmitter();
        device._channel = channel;
        device._users.add({
            id: "test",
            priority: 0,
            streamSetting: { channel },
            _stream: output
        });

        let failedChannel = null;
        device.once("streamFailure", value => failedChannel = value);
        device._release();

        assert.strictEqual(failedChannel, channel);
        assert.strictEqual(output.closed, true);
        assert.strictEqual(device.users.length, 0);
        assert.strictEqual(device.pid, null);
    });
});
