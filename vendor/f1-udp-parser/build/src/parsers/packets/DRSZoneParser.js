"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DRSZoneParser = void 0;
const F1Parser_1 = require("../F1Parser");
class DRSZoneParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').floatle('m_zoneStart').floatle('m_zoneEnd');
    }
}
exports.DRSZoneParser = DRSZoneParser;
//# sourceMappingURL=DRSZoneParser.js.map