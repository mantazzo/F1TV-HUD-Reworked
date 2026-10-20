"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TyreSetDataParser = void 0;
const F1Parser_1 = require("../F1Parser");
class TyreSetDataParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('m_actualTyreCompound')
            .uint8('m_visualTyreCompound')
            .uint8('m_wear')
            .uint8('m_available')
            .uint8('m_recommendedSession')
            .uint8('m_lifeSpan')
            .uint8('m_usableLife')
            .int16('m_lapDeltaTime')
            .uint8('m_fitted');
    }
}
exports.TyreSetDataParser = TyreSetDataParser;
//# sourceMappingURL=TyreSetDataParser.js.map