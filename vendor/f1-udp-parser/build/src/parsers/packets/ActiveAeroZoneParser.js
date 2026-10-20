"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActiveAeroZoneParser = void 0;
const F1Parser_1 = require("../F1Parser");
class ActiveAeroZoneParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').floatle('m_zoneStart').floatle('m_zoneEnd');
    }
}
exports.ActiveAeroZoneParser = ActiveAeroZoneParser;
//# sourceMappingURL=ActiveAeroZoneParser.js.map