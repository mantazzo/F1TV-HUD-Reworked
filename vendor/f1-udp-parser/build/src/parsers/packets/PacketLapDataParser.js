"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketLapDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const LapDataParser_1 = require("./LapDataParser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
class PacketLapDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .array('m_lapData', {
            length: packetFormat === 2026 ? 24 : 22,
            type: new LapDataParser_1.LapDataParser(packetFormat),
        });
        this.uint8('m_timeTrialPBCarIdx').uint8('m_timeTrialRivalCarIdx');
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketLapDataParser = PacketLapDataParser;
//# sourceMappingURL=PacketLapDataParser.js.map