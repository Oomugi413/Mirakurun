/*
   Copyright 2016 kanreisa

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/
const PACKET_SIZE = 188;
const PCR_TICKS_PER_MS = 27000;
const MAX_PACKETS = 256 * 1024;

export interface TSHandoffOptions {
    readonly serviceId?: number;
    readonly warmupMs: number;
    readonly maxBufferMs: number;
    readonly switchMarginMs: number;
    readonly syncTimeoutMs: number;
}

interface BufferedPacket {
    readonly packet: Buffer;
    readonly pcr: number | null;
}

export class TSHandoffProbe {
    protected _packet = Buffer.allocUnsafeSlow(PACKET_SIZE);
    protected _offset = -1;
    protected _serviceId: number;
    protected _pmtPid: number = null;
    protected _pcrPid: number = null;
    protected _lastPCR: number = null;

    constructor(serviceId?: number) {
        this._serviceId = serviceId || null;
    }

    get lastPCR(): number {
        return this._lastPCR;
    }

    get isReady(): boolean {
        return this._lastPCR !== null && (this._serviceId === null || this._pcrPid !== null);
    }

    write(chunk: Buffer): void {
        this._processPackets(this._splitPackets(chunk));
    }

    protected _processPackets(packets: Buffer[]): void {
        for (const packet of packets) {
            this._observePacket(packet);
        }
    }

    protected _observePacket(packet: Buffer): number | null {
        const pid = packet.readUInt16BE(1) & 0x1FFF;

        if (pid === 0) {
            this._parsePAT(packet);
        } else if (this._pmtPid !== null && pid === this._pmtPid) {
            this._parsePMT(packet);
        }

        const pcr = readPCR(packet);
        if (pcr !== null && (this._pcrPid === null || pid === this._pcrPid)) {
            this._lastPCR = pcr;
            return pcr;
        }

        return null;
    }

    protected _splitPackets(chunk: Buffer): Buffer[] {
        let offset = 0;
        const length = chunk.length;
        const packets: Buffer[] = [];

        if (this._offset > 0) {
            if (length >= PACKET_SIZE - this._offset) {
                offset = PACKET_SIZE - this._offset;
                packets.push(Buffer.concat([
                    this._packet.slice(0, this._offset),
                    chunk.slice(0, offset)
                ]));
                this._offset = 0;
            } else {
                chunk.copy(this._packet, this._offset);
                this._offset += length;
                return packets;
            }
        }

        for (; offset < length; offset += PACKET_SIZE) {
            if (chunk[offset] !== 0x47) {
                offset -= PACKET_SIZE - 1;
                continue;
            }

            if (length - offset >= PACKET_SIZE) {
                packets.push(Buffer.from(chunk.slice(offset, offset + PACKET_SIZE)));
            } else {
                chunk.copy(this._packet, 0, offset);
                this._offset = length - offset;
            }
        }

        return packets;
    }

    private _parsePAT(packet: Buffer): void {
        const payload = getPayload(packet);
        if (!payload || payload.length < 13) {
            return;
        }

        const pointer = payload[0];
        const sectionStart = 1 + pointer;
        if (sectionStart + 12 > payload.length || payload[sectionStart] !== 0x00) {
            return;
        }

        const sectionLength = ((payload[sectionStart + 1] & 0x0F) << 8) | payload[sectionStart + 2];
        const sectionEnd = sectionStart + 3 + sectionLength - 4;
        if (sectionEnd > payload.length) {
            return;
        }

        for (let pos = sectionStart + 8; pos + 4 <= sectionEnd; pos += 4) {
            const serviceId = payload.readUInt16BE(pos);
            const pmtPid = payload.readUInt16BE(pos + 2) & 0x1FFF;
            if (serviceId === 0) {
                continue;
            }
            if (this._serviceId === null || this._serviceId === serviceId) {
                this._pmtPid = pmtPid;
                return;
            }
        }
    }

    private _parsePMT(packet: Buffer): void {
        const payload = getPayload(packet);
        if (!payload || payload.length < 17) {
            return;
        }

        const pointer = payload[0];
        const sectionStart = 1 + pointer;
        if (sectionStart + 12 > payload.length || payload[sectionStart] !== 0x02) {
            return;
        }

        this._pcrPid = payload.readUInt16BE(sectionStart + 8) & 0x1FFF;
    }
}

export class TSHandoffBuffer extends TSHandoffProbe {
    readonly closed = false;

    private _packets: BufferedPacket[] = [];
    private _firstPacketAt: number = null;

    constructor(private _options: TSHandoffOptions) {
        super(_options.serviceId);
    }

    once(event: string, listener: (...args: any[]) => void): this {
        if (event === "close") {
            return this;
        }
        return this;
    }

    end(): void {
        return;
    }

    write(chunk: Buffer): void {
        this._processPackets(this._splitPackets(chunk));
    }

    async waitForSwitchPCR(getOldPCR: () => number): Promise<number> {
        const startedAt = Date.now();
        const margin = this._options.switchMarginMs * PCR_TICKS_PER_MS;

        while (Date.now() - startedAt < this._options.syncTimeoutMs) {
            const oldPCR = getOldPCR();
            const warmedUp = this._firstPacketAt !== null && Date.now() - this._firstPacketAt >= this._options.warmupMs;

            if (warmedUp && this.isReady && oldPCR !== null) {
                const targetPCR = oldPCR + margin;
                if (this.getPacketsFromPCR(targetPCR) !== null) {
                    return targetPCR;
                }
            }

            await sleep(50);
        }

        return null;
    }

    getPacketsFromPCR(targetPCR: number): Buffer[] | null {
        for (let i = 0; i < this._packets.length; i++) {
            const pcr = this._packets[i].pcr;
            if (pcr !== null && pcr >= targetPCR) {
                return this._packets.slice(i).map(item => Buffer.from(item.packet));
            }
        }

        return null;
    }

    protected _processPackets(packets: Buffer[]): void {
        if (packets.length > 0 && this._firstPacketAt === null) {
            this._firstPacketAt = Date.now();
        }

        for (const packet of packets) {
            const pcr = this._observePacket(packet);
            this._packets.push({ packet, pcr });
        }

        this._shrink();
    }

    private _shrink(): void {
        if (this._lastPCR !== null) {
            const minPCR = this._lastPCR - (this._options.maxBufferMs * PCR_TICKS_PER_MS);
            while (this._packets.length > 0) {
                const pcr = this._packets[0].pcr;
                if (pcr === null || pcr >= minPCR) {
                    break;
                }
                this._packets.shift();
            }
        }

        if (this._packets.length > MAX_PACKETS) {
            this._packets.splice(0, this._packets.length - MAX_PACKETS);
        }
    }
}

function readPCR(packet: Buffer): number | null {
    const adaptationFieldControl = (packet[3] >> 4) & 0x03;
    if (adaptationFieldControl !== 2 && adaptationFieldControl !== 3) {
        return null;
    }

    const adaptationFieldLength = packet[4];
    if (adaptationFieldLength < 7 || packet.length < 12) {
        return null;
    }

    const flags = packet[5];
    if ((flags & 0x10) === 0) {
        return null;
    }

    const base = (
        packet[6] * Math.pow(2, 25) +
        packet[7] * Math.pow(2, 17) +
        packet[8] * Math.pow(2, 9) +
        packet[9] * 2 +
        ((packet[10] & 0x80) >>> 7)
    );
    const extension = ((packet[10] & 0x01) << 8) | packet[11];

    return base * 300 + extension;
}

function getPayload(packet: Buffer): Buffer | null {
    const payloadUnitStart = (packet[1] & 0x40) !== 0;
    if (!payloadUnitStart) {
        return null;
    }

    const adaptationFieldControl = (packet[3] >> 4) & 0x03;
    if (adaptationFieldControl !== 1 && adaptationFieldControl !== 3) {
        return null;
    }

    let offset = 4;
    if (adaptationFieldControl === 3) {
        offset += 1 + packet[4];
    }
    if (offset >= packet.length) {
        return null;
    }

    return packet.slice(offset);
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
