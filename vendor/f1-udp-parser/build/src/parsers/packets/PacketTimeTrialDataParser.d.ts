/// <reference types="node" />
import { F1Parser } from '../F1Parser';
import { PacketTimeTrialData } from './types';
export declare class PacketTimeTrialDataParser extends F1Parser {
    data: PacketTimeTrialData;
    constructor(buffer: Buffer, packetFormat: number);
}
