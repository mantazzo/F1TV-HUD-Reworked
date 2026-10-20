/// <reference types="node" />
import { F1Parser } from '../F1Parser';
import { PacketTyreSetsData } from './types';
export declare class PacketTyreSetsDataParser extends F1Parser {
    data: PacketTyreSetsData;
    constructor(buffer: Buffer, packetFormat: number);
}
