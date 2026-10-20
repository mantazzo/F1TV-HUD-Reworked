"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LiveryColourParser = void 0;
const F1Parser_1 = require("../F1Parser");
class LiveryColourParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('red').uint8('green').uint8('blue');
    }
}
exports.LiveryColourParser = LiveryColourParser;
//# sourceMappingURL=LiveryColourParser.js.map