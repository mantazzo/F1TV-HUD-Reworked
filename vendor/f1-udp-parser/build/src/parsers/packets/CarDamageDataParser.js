"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarDamageDataParser = void 0;
const binary_parser_1 = require("binary-parser");
const F1Parser_1 = require("../F1Parser");
class CarDamageDataParser extends F1Parser_1.F1Parser {
    constructor(packetFormat) {
        super();
        this.array('m_tyresWear', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_tyresDamage', {
            length: 4,
            type: new binary_parser_1.Parser().uint8(''),
        })
            .array('m_brakesDamage', {
            length: 4,
            type: new binary_parser_1.Parser().uint8(''),
        });
        // 2025/2026 m_tyreBlisters[4]
        if (packetFormat === 2025 || packetFormat === 2026) {
            this.array('m_tyreBlisters', {
                length: 4,
                type: new binary_parser_1.Parser().uint8(''),
            });
        }
        this.uint8('m_frontLeftWingDamage')
            .uint8('m_frontRightWingDamage')
            .uint8('m_rearWingDamage')
            .uint8('m_floorDamage')
            .uint8('m_diffuserDamage')
            .uint8('m_sidepodDamage')
            .uint8('m_drsFault')
            .uint8('m_ersFault')
            .uint8('m_gearBoxDamage')
            .uint8('m_engineDamage')
            .uint8('m_engineMGUHWear')
            .uint8('m_engineESWear')
            .uint8('m_engineCEWear')
            .uint8('m_engineICEWear')
            .uint8('m_engineMGUKWear')
            .uint8('m_engineTCWear')
            .uint8('m_engineBlown')
            .uint8('m_engineSeized');
    }
}
exports.CarDamageDataParser = CarDamageDataParser;
//# sourceMappingURL=CarDamageDataParser.js.map