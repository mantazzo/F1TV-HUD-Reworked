"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketCarDamageDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const CarDamageDataParser_1 = require("./CarDamageDataParser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
class PacketCarDamageDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .array('m_carDamageData', {
            length: packetFormat === 2026 ? 24 : 22,
            type: new CarDamageDataParser_1.CarDamageDataParser(packetFormat),
        });
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketCarDamageDataParser = PacketCarDamageDataParser;
//# sourceMappingURL=PacketCarDamageDataParser.js.map