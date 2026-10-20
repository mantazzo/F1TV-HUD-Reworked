"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketLapPositionsDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
/**
 * Parser for F1 25 Lap Positions packet (1131 bytes)
 * Parses the positions of all drivers at the start of each lap.
 */
class PacketLapPositionsDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', { type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat) })
            .uint8('m_numLaps')
            .uint8('m_lapStart')
            .array('m_positionForVehicleIdx', {
            length: 50,
            type: new F1Parser_1.F1Parser().array('', {
                length: packetFormat === 2026 ? 24 : 22,
                type: new F1Parser_1.F1Parser().uint8(''),
            }),
        });
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketLapPositionsDataParser = PacketLapPositionsDataParser;
//# sourceMappingURL=PacketLapPositionsDataParser.js.map