"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CarTelemetry2DataParser = void 0;
const F1Parser_1 = require("../F1Parser");
class CarTelemetry2DataParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('m_activeAeroMode')
            .uint8('m_activeAeroAvailable')
            .uint16le('m_activeAeroActivationDistance')
            .uint8('m_overtakeAvailable')
            .uint8('m_overtakeActive')
            .uint16le('m_overtakeActivationDistance')
            .uint8('m_2026Regulations')
            .uint8('m_drivingWrongWay');
    }
}
exports.CarTelemetry2DataParser = CarTelemetry2DataParser;
//# sourceMappingURL=CarTelemetry2DataParser.js.map