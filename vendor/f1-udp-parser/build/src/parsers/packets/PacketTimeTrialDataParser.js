"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketTimeTrialDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
const TimeTrialDataSetParser_1 = require("./TimeTrialDataSetParser");
class PacketTimeTrialDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little').nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        });
        this.nest('m_playerSessionBestDataSet', {
            type: new TimeTrialDataSetParser_1.TimeTrialDataSetParser(packetFormat),
        });
        this.nest('m_personalBestDataSet', {
            type: new TimeTrialDataSetParser_1.TimeTrialDataSetParser(packetFormat),
        });
        this.nest('m_rivalDataSet', {
            type: new TimeTrialDataSetParser_1.TimeTrialDataSetParser(packetFormat),
        });
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketTimeTrialDataParser = PacketTimeTrialDataParser;
//# sourceMappingURL=PacketTimeTrialDataParser.js.map