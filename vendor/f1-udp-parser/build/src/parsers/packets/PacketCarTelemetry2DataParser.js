"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketCarTelemetry2DataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const CarTelemetry2DataParser_1 = require("./CarTelemetry2DataParser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
class PacketCarTelemetry2DataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .array('m_carTelemetry2Data', {
            length: packetFormat === 2026 ? 24 : 22,
            type: new CarTelemetry2DataParser_1.CarTelemetry2DataParser(),
        });
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketCarTelemetry2DataParser = PacketCarTelemetry2DataParser;
//# sourceMappingURL=PacketCarTelemetry2DataParser.js.map