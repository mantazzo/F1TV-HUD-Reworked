"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketMotionExDataParser = void 0;
const binary_parser_1 = require("binary-parser");
const F1Parser_1 = require("../F1Parser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
class PacketMotionExDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .array('m_suspensionPosition', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_suspensionVelocity', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_suspensionAcceleration', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_wheelSpeed', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_wheelSlipRatio', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_wheelSlipAngle', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_wheelLatForce', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .array('m_wheelLongForce', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        })
            .floatle('m_heightOfCOGAboveGround')
            .floatle('m_localVelocityX')
            .floatle('m_localVelocityY')
            .floatle('m_localVelocityZ')
            .floatle('m_angularVelocityX')
            .floatle('m_angularVelocityY')
            .floatle('m_angularVelocityZ')
            .floatle('m_angularAccelerationX')
            .floatle('m_angularAccelerationY')
            .floatle('m_angularAccelerationZ')
            .floatle('m_frontWheelsAngle')
            .array('m_wheelVertForce', {
            length: 4,
            type: new binary_parser_1.Parser().floatle(''),
        });
        if (packetFormat === 2024 || packetFormat === 2025 || packetFormat === 2026) {
            this.floatle('m_frontAeroHeight')
                .floatle('m_rearAeroHeight')
                .floatle('m_frontRollAngle')
                .floatle('m_rearRollAngle')
                .floatle('m_chassisYaw');
        }
        if (packetFormat === 2025 || packetFormat === 2026) {
            this.floatle('m_chassisPitch')
                .array('m_wheelCamber', {
                length: 4,
                type: new binary_parser_1.Parser().floatle(''),
            })
                .array('m_wheelCamberGain', {
                length: 4,
                type: new binary_parser_1.Parser().floatle(''),
            });
        }
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketMotionExDataParser = PacketMotionExDataParser;
//# sourceMappingURL=PacketMotionExDataParser.js.map