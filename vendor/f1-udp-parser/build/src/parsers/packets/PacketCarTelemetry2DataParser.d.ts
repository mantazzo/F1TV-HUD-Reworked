/// <reference types="node" />
import { F1Parser } from '../F1Parser';
import { PacketCarTelemetry2Data } from './types';
export declare class PacketCarTelemetry2DataParser extends F1Parser {
    data: PacketCarTelemetry2Data;
    constructor(buffer: Buffer, packetFormat: number);
}
