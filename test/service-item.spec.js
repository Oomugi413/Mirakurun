const { describe, it, beforeEach } = require("node:test");
const assert = require("assert");

const shared = require("../lib/Mirakurun/_").default;
const MirakurunEvent = require("../lib/Mirakurun/Event").default;
const ChannelItem = require("../lib/Mirakurun/ChannelItem").default;
const ServiceItem = require("../lib/Mirakurun/ServiceItem").default;

describe("[service-item.spec] service channel reassignment", () => {
    let saveCount;

    beforeEach(() => {
        saveCount = 0;
        shared.event = new MirakurunEvent();
        shared.service = {
            save: () => {
                saveCount++;
            }
        };
    });

    it("moves a remotely discovered service to the directly scanned local channel", () => {
        const remoteChannel = new ChannelItem({
            name: "ABC remote",
            type: "GR-ALT",
            channel: "15"
        });
        const localChannel = new ChannelItem({
            name: "ABC local",
            type: "GR",
            channel: "15"
        });
        const service = new ServiceItem(remoteChannel, 32723, 2072, "ＡＢＣテレビ１", 1);

        service.channel = localChannel;

        assert.strictEqual(service.channel, localChannel);
        assert.deepStrictEqual(service.export().channel, {
            type: "GR",
            channel: "15"
        });
        assert.strictEqual(saveCount, 1);
    });

    it("does not emit an update when the channel is unchanged", () => {
        const channel = new ChannelItem({
            name: "ABC local",
            type: "GR",
            channel: "15"
        });
        const service = new ServiceItem(channel, 32723, 2072, "ＡＢＣテレビ１", 1);

        service.channel = channel;

        assert.strictEqual(saveCount, 0);
    });
});
