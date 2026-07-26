const { describe, it } = require("node:test");
const assert = require("assert");

const Client = require("../lib/client").default;

describe("[client.spec] local-only remote requests", () => {
    it("adds the local-only header to channel stream requests", async () => {
        const client = new Client();
        let callArgs = null;
        client.call = async (...args) => {
            callArgs = args;
            return {};
        };

        await client.getChannelStream({
            type: "GR",
            channel: "20",
            localTunerOnly: true
        });

        assert.deepStrictEqual(callArgs[2].headers, {
            "X-Mirakurun-Local-Tuner-Only": "1"
        });
    });

    it("adds the local-only header to service discovery requests", async () => {
        const client = new Client();
        let callArgs = null;
        client.call = async (...args) => {
            callArgs = args;
            return { body: [] };
        };

        await client.getServices({ "channel.type": "GR" }, { localTunerOnly: true });

        assert.deepStrictEqual(callArgs[2].headers, {
            "X-Mirakurun-Local-Tuner-Only": "1"
        });
    });
});
