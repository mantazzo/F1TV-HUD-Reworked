"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TimeTrialDataSetParser = void 0;
const F1Parser_1 = require("../F1Parser");
class TimeTrialDataSetParser extends F1Parser_1.F1Parser {
    constructor(packetFormat) {
        super();
        this.endianess('little').uint8('m_carIdx');
        if (packetFormat === 2026) {
            this.uint16le('m_teamId');
        }
        else {
            this.uint8('m_teamId');
        }
        this.uint32('m_lapTimeInMS')
            .uint32('m_sector1TimeInMS')
            .uint32('m_sector2TimeInMS')
            .uint32('m_sector3TimeInMS')
            .uint8('m_tractionControl')
            .uint8('m_gearboxAssist')
            .uint8('m_antiLockBrakes')
            .uint8('m_equalCarPerformance')
            .uint8('m_customSetup')
            .uint8('m_valid');
    }
}
exports.TimeTrialDataSetParser = TimeTrialDataSetParser;
//# sourceMappingURL=TimeTrialDataSetParser.js.map