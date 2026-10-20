"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketEventDataParser = exports.PartialModeEnabledParser = exports.CollisionParser2026 = exports.CollisionParser = exports.SafetyCarParser = exports.OvertakeParser = exports.ButtonsParser = exports.FlashbackParser = exports.StopGoPenaltyServedParser2025 = exports.StopGoPenaltyServedParser = exports.DriveThroughPenaltyServedParser = exports.StartLightsParser = exports.SpeedTrapParser = exports.PenaltyParser = exports.RaceWinnerParser = exports.TeamMateInPitsParser = exports.DRSDisabledParser = exports.RetirementParser2025 = exports.RetirementParser = exports.FastestLapParser = void 0;
const binary_parser_1 = require("binary-parser");
const constants_1 = require("../../constants");
const F1Parser_1 = require("../F1Parser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
class FastestLapParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx').floatle('lapTime');
    }
}
exports.FastestLapParser = FastestLapParser;
class RetirementParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx');
    }
}
exports.RetirementParser = RetirementParser;
class RetirementParser2025 extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx').uint8('reason');
    }
}
exports.RetirementParser2025 = RetirementParser2025;
class DRSDisabledParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('reason');
    }
}
exports.DRSDisabledParser = DRSDisabledParser;
class TeamMateInPitsParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx');
    }
}
exports.TeamMateInPitsParser = TeamMateInPitsParser;
class RaceWinnerParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx');
    }
}
exports.RaceWinnerParser = RaceWinnerParser;
class PenaltyParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('penaltyType')
            .uint8('infringementType')
            .uint8('vehicleIdx')
            .uint8('otherVehicleIdx')
            .uint8('time')
            .uint8('lapNum')
            .uint8('placesGained');
    }
}
exports.PenaltyParser = PenaltyParser;
class SpeedTrapParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('vehicleIdx')
            .floatle('speed')
            .uint8('isOverallFastestInSession')
            .uint8('isDriverFastestInSession')
            .uint8('fastestVehicleIdxInSession')
            .floatle('fastestSpeedInSession');
    }
}
exports.SpeedTrapParser = SpeedTrapParser;
class StartLightsParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('numLights');
    }
}
exports.StartLightsParser = StartLightsParser;
class DriveThroughPenaltyServedParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx');
    }
}
exports.DriveThroughPenaltyServedParser = DriveThroughPenaltyServedParser;
class StopGoPenaltyServedParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicleIdx');
    }
}
exports.StopGoPenaltyServedParser = StopGoPenaltyServedParser;
class StopGoPenaltyServedParser2025 extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('vehicleIdx')
            .floatle('stopTime');
    }
}
exports.StopGoPenaltyServedParser2025 = StopGoPenaltyServedParser2025;
class FlashbackParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint32le('flashbackFrameIdentifier')
            .floatle('flashbackSessionTime');
    }
}
exports.FlashbackParser = FlashbackParser;
class ButtonsParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint32le('buttonStatus');
    }
}
exports.ButtonsParser = ButtonsParser;
class OvertakeParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('overtakingVehicleIdx')
            .uint8('beingOvertakenVehicleIdx');
    }
}
exports.OvertakeParser = OvertakeParser;
class SafetyCarParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('safetyCarType').uint8('eventType');
    }
}
exports.SafetyCarParser = SafetyCarParser;
class CollisionParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('vehicle1Idx').uint8('vehicle2Idx');
    }
}
exports.CollisionParser = CollisionParser;
class CollisionParser2026 extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little')
            .uint8('vehicle1Idx')
            .uint8('vehicle2Idx')
            .uint8('severity');
    }
}
exports.CollisionParser2026 = CollisionParser2026;
class PartialModeEnabledParser extends F1Parser_1.F1Parser {
    constructor() {
        super();
        this.endianess('little').uint8('reason');
    }
}
exports.PartialModeEnabledParser = PartialModeEnabledParser;
class PacketEventDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little').nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        });
        this.string('m_eventStringCode', { length: 4 });
        if (packetFormat === 2022) {
            this.unpack2022Format(buffer, packetFormat);
        }
        if (packetFormat === 2023) {
            this.unpack2023Format(buffer, packetFormat);
        }
        if (packetFormat === 2024) {
            this.unpack2024Format(buffer, packetFormat);
        }
        if (packetFormat === 2025) {
            this.unpack2025Format(buffer, packetFormat);
        }
        if (packetFormat === 2026) {
            this.unpack2026Format(buffer, packetFormat);
        }
        this.data = this.fromBuffer(buffer);
    }
    unpack2022Format = (buffer, packetFormat) => {
        const eventStringCode = this.getEventStringCode(buffer, packetFormat);
        if (eventStringCode === constants_1.EVENT_CODES.FastestLap) {
            this.nest('m_eventDetails', { type: new FastestLapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Retirement) {
            this.nest('m_eventDetails', { type: new RetirementParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.TeammateInPits) {
            this.nest('m_eventDetails', { type: new TeamMateInPitsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.RaceWinner) {
            this.nest('m_eventDetails', { type: new RaceWinnerParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.PenaltyIssued) {
            this.nest('m_eventDetails', { type: new PenaltyParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SpeedTrapTriggered) {
            this.nest('m_eventDetails', { type: new SpeedTrapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StartLights) {
            this.nest('m_eventDetails', { type: new StartLightsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DriveThroughServed) {
            this.nest('m_eventDetails', {
                type: new DriveThroughPenaltyServedParser(),
            });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StopGoServed) {
            this.nest('m_eventDetails', { type: new StopGoPenaltyServedParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Flashback) {
            this.nest('m_eventDetails', { type: new FlashbackParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.ButtonStatus) {
            this.nest('m_eventDetails', { type: new ButtonsParser() });
        }
    };
    unpack2023Format = (buffer, packetFormat) => {
        const eventStringCode = this.getEventStringCode(buffer, packetFormat);
        if (eventStringCode === constants_1.EVENT_CODES.FastestLap) {
            this.nest('m_eventDetails', { type: new FastestLapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Retirement) {
            this.nest('m_eventDetails', { type: new RetirementParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.TeammateInPits) {
            this.nest('m_eventDetails', { type: new TeamMateInPitsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.RaceWinner) {
            this.nest('m_eventDetails', { type: new RaceWinnerParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.PenaltyIssued) {
            this.nest('m_eventDetails', { type: new PenaltyParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SpeedTrapTriggered) {
            this.nest('m_eventDetails', { type: new SpeedTrapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StartLights) {
            this.nest('m_eventDetails', { type: new StartLightsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DriveThroughServed) {
            this.nest('m_eventDetails', {
                type: new DriveThroughPenaltyServedParser(),
            });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StopGoServed) {
            this.nest('m_eventDetails', { type: new StopGoPenaltyServedParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Flashback) {
            this.nest('m_eventDetails', { type: new FlashbackParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.ButtonStatus) {
            this.nest('m_eventDetails', { type: new ButtonsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Overtake) {
            this.nest('m_eventDetails', { type: new OvertakeParser() });
        }
    };
    unpack2024Format = (buffer, packetFormat) => {
        const eventStringCode = this.getEventStringCode(buffer, packetFormat);
        if (eventStringCode === constants_1.EVENT_CODES.FastestLap) {
            this.nest('m_eventDetails', { type: new FastestLapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Retirement) {
            this.nest('m_eventDetails', { type: new RetirementParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.TeammateInPits) {
            this.nest('m_eventDetails', { type: new TeamMateInPitsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.RaceWinner) {
            this.nest('m_eventDetails', { type: new RaceWinnerParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.PenaltyIssued) {
            this.nest('m_eventDetails', { type: new PenaltyParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SpeedTrapTriggered) {
            this.nest('m_eventDetails', { type: new SpeedTrapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StartLights) {
            this.nest('m_eventDetails', { type: new StartLightsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DriveThroughServed) {
            this.nest('m_eventDetails', {
                type: new DriveThroughPenaltyServedParser(),
            });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StopGoServed) {
            this.nest('m_eventDetails', { type: new StopGoPenaltyServedParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Flashback) {
            this.nest('m_eventDetails', { type: new FlashbackParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.ButtonStatus) {
            this.nest('m_eventDetails', { type: new ButtonsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Overtake) {
            this.nest('m_eventDetails', { type: new OvertakeParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SafetyCar) {
            this.nest('m_eventDetails', { type: new SafetyCarParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Collision) {
            this.nest('m_eventDetails', { type: new CollisionParser() });
        }
    };
    unpack2025Format = (buffer, packetFormat) => {
        const eventStringCode = this.getEventStringCode(buffer, packetFormat);
        if (eventStringCode === constants_1.EVENT_CODES.FastestLap) {
            this.nest('m_eventDetails', { type: new FastestLapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Retirement) {
            this.nest('m_eventDetails', { type: new RetirementParser2025() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DRSDisabled) {
            this.nest('m_eventDetails', { type: new DRSDisabledParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.TeammateInPits) {
            this.nest('m_eventDetails', { type: new TeamMateInPitsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.RaceWinner) {
            this.nest('m_eventDetails', { type: new RaceWinnerParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.PenaltyIssued) {
            this.nest('m_eventDetails', { type: new PenaltyParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SpeedTrapTriggered) {
            this.nest('m_eventDetails', { type: new SpeedTrapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StartLights) {
            this.nest('m_eventDetails', { type: new StartLightsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DriveThroughServed) {
            this.nest('m_eventDetails', {
                type: new DriveThroughPenaltyServedParser(),
            });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StopGoServed) {
            this.nest('m_eventDetails', { type: new StopGoPenaltyServedParser2025() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Flashback) {
            this.nest('m_eventDetails', { type: new FlashbackParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.ButtonStatus) {
            this.nest('m_eventDetails', { type: new ButtonsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Overtake) {
            this.nest('m_eventDetails', { type: new OvertakeParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SafetyCar) {
            this.nest('m_eventDetails', { type: new SafetyCarParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Collision) {
            this.nest('m_eventDetails', { type: new CollisionParser() });
        }
    };
    unpack2026Format = (buffer, packetFormat) => {
        const eventStringCode = this.getEventStringCode(buffer, packetFormat);
        if (eventStringCode === constants_1.EVENT_CODES.FastestLap) {
            this.nest('m_eventDetails', { type: new FastestLapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Retirement) {
            this.nest('m_eventDetails', { type: new RetirementParser2025() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DRSDisabled) {
            this.nest('m_eventDetails', { type: new DRSDisabledParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.TeammateInPits) {
            this.nest('m_eventDetails', { type: new TeamMateInPitsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.RaceWinner) {
            this.nest('m_eventDetails', { type: new RaceWinnerParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.PenaltyIssued) {
            this.nest('m_eventDetails', { type: new PenaltyParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SpeedTrapTriggered) {
            this.nest('m_eventDetails', { type: new SpeedTrapParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StartLights) {
            this.nest('m_eventDetails', { type: new StartLightsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.DriveThroughServed) {
            this.nest('m_eventDetails', {
                type: new DriveThroughPenaltyServedParser(),
            });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.StopGoServed) {
            this.nest('m_eventDetails', { type: new StopGoPenaltyServedParser2025() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Flashback) {
            this.nest('m_eventDetails', { type: new FlashbackParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.ButtonStatus) {
            this.nest('m_eventDetails', { type: new ButtonsParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Overtake) {
            this.nest('m_eventDetails', { type: new OvertakeParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.SafetyCar) {
            this.nest('m_eventDetails', { type: new SafetyCarParser() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.Collision) {
            this.nest('m_eventDetails', { type: new CollisionParser2026() });
        }
        else if (eventStringCode === constants_1.EVENT_CODES.PartialModeEnabled) {
            this.nest('m_eventDetails', { type: new PartialModeEnabledParser() });
        }
    };
    getEventStringCode = (buffer, packetFormat) => {
        const headerParser = new binary_parser_1.Parser()
            .endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .string('m_eventStringCode', { length: 4 });
        const { m_eventStringCode } = headerParser.parse(buffer);
        return m_eventStringCode;
    };
}
exports.PacketEventDataParser = PacketEventDataParser;
//# sourceMappingURL=PacketEventDataParser.js.map