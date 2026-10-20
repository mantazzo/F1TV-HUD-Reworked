"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParticipantDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
const LiveryColourParser_1 = require("./LiveryColourParser");
class ParticipantDataParser extends F1Parser_1.F1Parser {
    constructor(packetFormat) {
        super();
        this.uint8('m_aiControlled');
        if (packetFormat === 2026) {
            this.uint16le('m_driverId')
                .uint16le('m_networkId')
                .uint16le('m_teamId');
        }
        else {
            this.uint8('m_driverId')
                .uint8('m_networkId')
                .uint8('m_teamId');
        }
        this.uint8('m_myTeam')
            .uint8('m_raceNumber')
            .uint8('m_nationality');
        // Name length: 32 in 2025/2026, 48 in 2024 and earlier
        if (packetFormat === 2025 || packetFormat === 2026) {
            this.string('m_name', {
                length: 32,
                stripNull: true,
            });
        }
        else {
            this.string('m_name', {
                length: 48,
                stripNull: true,
            });
        }
        this.uint8('m_yourTelemetry');
        if (packetFormat === 2023) {
            this.uint8('m_showOnlineNames')
                .uint8('m_platform');
        }
        if (packetFormat === 2024) {
            this.uint8('m_showOnlineNames')
                .uint16le('m_techLevel')
                .uint8('m_platform');
        }
        if (packetFormat === 2025 || packetFormat === 2026) {
            this.uint8('m_showOnlineNames')
                .uint16le('m_techLevel')
                .uint8('m_platform')
                .uint8('m_numColours')
                .array('m_liveryColour', { length: 4, type: new LiveryColourParser_1.LiveryColourParser() });
        }
    }
}
exports.ParticipantDataParser = ParticipantDataParser;
//# sourceMappingURL=ParticipantDataParser.js.map