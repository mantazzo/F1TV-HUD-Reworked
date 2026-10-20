"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LobbyInfoDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
class LobbyInfoDataParser extends F1Parser_1.F1Parser {
    constructor(packetFormat) {
        super();
        this.uint8('m_aiControlled');
        if (packetFormat === 2026) {
            this.uint16le('m_teamId');
        }
        else {
            this.uint8('m_teamId');
        }
        this.uint8('m_nationality');
        if (packetFormat === 2023 || packetFormat === 2024 || packetFormat === 2025 || packetFormat === 2026) {
            this.uint8('m_platform');
        }
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
        this.uint8('m_carNumber');
        if (packetFormat === 2024 || packetFormat === 2025 || packetFormat === 2026) {
            this.uint8('m_yourTelemetry')
                .uint8('m_showOnlineNames')
                .uint16le('m_techLevel');
        }
        this.uint8('m_readyStatus');
    }
}
exports.LobbyInfoDataParser = LobbyInfoDataParser;
//# sourceMappingURL=LobbyInfoDataParser.js.map