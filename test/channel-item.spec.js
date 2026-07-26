const { describe, it } = require("node:test");
const assert = require("assert");

const ChannelItem = require("../lib/Mirakurun/ChannelItem").default;

describe("[channel-item.spec] ChannelItem dynamic allowedTuners", () => {
    it("uses remote tuner capabilities when no manual restriction exists", () => {
        const channel = new ChannelItem({
            name: "Test",
            type: "GR-ALT",
            channel: "27"
        });

        channel.setRemoteAllowedTuners(["J-GR-1", "J-GR-2"]);

        assert.deepStrictEqual(channel.allowedTuners, ["J-GR-1", "J-GR-2"]);
    });

    it("intersects remote tuner capabilities with the manual restriction", () => {
        const channel = new ChannelItem({
            name: "Test",
            type: "GR-ALT",
            channel: "27",
            allowedTuners: ["J-GR-1", "AME-GR-1"]
        });

        channel.setRemoteAllowedTuners(["J-GR-1", "J-GR-2"]);

        assert.deepStrictEqual(channel.allowedTuners, ["J-GR-1"]);
    });

    it("keeps an empty dynamic list as no available tuner", () => {
        const channel = new ChannelItem({
            name: "Test",
            type: "GR-ALT",
            channel: "27"
        });

        channel.setRemoteAllowedTuners([]);

        assert.deepStrictEqual(channel.allowedTuners, []);
    });

    it("restores the manual restriction when dynamic capabilities are cleared", () => {
        const channel = new ChannelItem({
            name: "Test",
            type: "GR-ALT",
            channel: "27",
            allowedTuners: ["AME-GR-1"]
        });

        channel.setRemoteAllowedTuners(["J-GR-1"]);
        channel.setRemoteAllowedTuners(undefined);

        assert.deepStrictEqual(channel.allowedTuners, ["AME-GR-1"]);
    });
});
