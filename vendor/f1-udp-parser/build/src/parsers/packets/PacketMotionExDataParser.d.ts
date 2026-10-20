/// <reference types="node" />
import { F1Parser } from '../F1Parser';
import { PacketMotionExData } from './types';
export declare class PacketMotionExDataParser extends F1Parser {
    data: PacketMotionExData;
    constructor(buffer: Buffer, packetFormat: number);
}
