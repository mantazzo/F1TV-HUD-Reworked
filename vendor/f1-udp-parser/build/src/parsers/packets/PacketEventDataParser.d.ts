/// <reference types="node" />
import { F1Parser } from '../F1Parser';
import { PacketEventData } from './types';
export declare class FastestLapParser extends F1Parser {
    constructor();
}
export declare class RetirementParser extends F1Parser {
    constructor();
}
export declare class RetirementParser2025 extends F1Parser {
    constructor();
}
export declare class DRSDisabledParser extends F1Parser {
    constructor();
}
export declare class TeamMateInPitsParser extends F1Parser {
    constructor();
}
export declare class RaceWinnerParser extends F1Parser {
    constructor();
}
export declare class PenaltyParser extends F1Parser {
    constructor();
}
export declare class SpeedTrapParser extends F1Parser {
    constructor();
}
export declare class StartLightsParser extends F1Parser {
    constructor();
}
export declare class DriveThroughPenaltyServedParser extends F1Parser {
    constructor();
}
export declare class StopGoPenaltyServedParser extends F1Parser {
    constructor();
}
export declare class StopGoPenaltyServedParser2025 extends F1Parser {
    constructor();
}
export declare class FlashbackParser extends F1Parser {
    constructor();
}
export declare class ButtonsParser extends F1Parser {
    constructor();
}
export declare class OvertakeParser extends F1Parser {
    constructor();
}
export declare class SafetyCarParser extends F1Parser {
    constructor();
}
export declare class CollisionParser extends F1Parser {
    constructor();
}
export declare class CollisionParser2026 extends F1Parser {
    constructor();
}
export declare class PartialModeEnabledParser extends F1Parser {
    constructor();
}
export declare class PacketEventDataParser extends F1Parser {
    data: PacketEventData;
    constructor(buffer: Buffer, packetFormat: number);
    unpack2022Format: (buffer: Buffer, packetFormat: number) => void;
    unpack2023Format: (buffer: Buffer, packetFormat: number) => void;
    unpack2024Format: (buffer: Buffer, packetFormat: number) => void;
    unpack2025Format: (buffer: Buffer, packetFormat: number) => void;
    unpack2026Format: (buffer: Buffer, packetFormat: number) => void;
    getEventStringCode: (buffer: Buffer, packetFormat: number) => any;
}
