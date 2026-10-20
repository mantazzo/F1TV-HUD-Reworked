"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketTyreSetsDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const TyreSetDataParser_1 = require("./TyreSetDataParser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
class PacketTyreSetsDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .uint8('m_carIdx')
            .array('m_tyreSetData', {
            length: 20,
            type: new TyreSetDataParser_1.TyreSetDataParser(),
        })
            .uint8('m_fittedIdx');
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketTyreSetsDataParser = PacketTyreSetsDataParser;
//# sourceMappingURL=PacketTyreSetsDataParser.js.map