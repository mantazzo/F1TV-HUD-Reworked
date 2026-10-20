"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinalClassificationDataParser = void 0;
const binary_parser_1 = require("binary-parser");
const F1Parser_1 = require("../F1Parser");
class FinalClassificationDataParser extends F1Parser_1.F1Parser {
    constructor(packetFormat) {
        super();
        this.uint8('m_position')
            .uint8('m_numLaps')
            .uint8('m_gridPosition')
            .uint8('m_points')
            .uint8('m_numPitStops')
            .uint8('m_resultStatus');
        // 2025/2026 m_resultReason
        if (packetFormat === 2025 || packetFormat === 2026) {
            this.uint8('m_resultReason');
        }
        this.uint32le('m_bestLapTimeInMS')
            .doublele('m_totalRaceTime')
            .uint8('m_penaltiesTime')
            .uint8('m_numPenalties')
            .uint8('m_numTyreStints')
            .array('m_tyreStintsActual', {
            length: 8,
            type: new binary_parser_1.Parser().uint8(''),
        })
            .array('m_tyreStintsVisual', {
            length: 8,
            type: new binary_parser_1.Parser().uint8(''),
        })
            .array('m_tyreStintsEndLaps', {
            length: 8,
            type: new binary_parser_1.Parser().uint8(''),
        });
    }
}
exports.FinalClassificationDataParser = FinalClassificationDataParser;
//# sourceMappingURL=FinalClassificationDataParser.js.map