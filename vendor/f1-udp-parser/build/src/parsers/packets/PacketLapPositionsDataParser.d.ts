/// <reference types="node" />
import { F1Parser } from '../F1Parser';
import { PacketLapPositionsData } from './types';
/**
 * Parser for F1 25 Lap Positions packet (1131 bytes)
 * Parses the positions of all drivers at the start of each lap.
 */
export declare class PacketLapPositionsDataParser extends F1Parser {
    data: PacketLapPositionsData;
    constructor(buffer: Buffer, packetFormat: number);
}
