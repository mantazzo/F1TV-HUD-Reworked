/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import * as dgram from 'dgram';
import { EventEmitter } from 'events';
import * as constants from './constants';
import * as constantsTypes from './constants/types';
import { PacketCarDamageDataParser, PacketCarSetupDataParser, PacketCarStatusDataParser, PacketCarTelemetryDataParser, PacketCarTelemetry2DataParser, PacketEventDataParser, PacketFinalClassificationDataParser, PacketLapDataParser, PacketLobbyInfoDataParser, PacketMotionDataParser, PacketParticipantsDataParser, PacketSessionDataParser, PacketSessionHistoryDataParser, PacketTyreSetsDataParser, PacketMotionExDataParser, PacketTimeTrialDataParser, PacketLapPositionsDataParser } from './parsers/packets';
import * as packetTypes from './parsers/packets/types';
import { Address, Options, ParsedMessage, TestMode } from './types';
declare const DEFAULT_PORT = 20777;
declare const FORWARD_ADDRESSES: undefined;
/**
 *
 */
declare class F1TelemetryClient extends EventEmitter {
    port: number;
    forwardAddresses?: Address[];
    socket?: dgram.Socket;
    testModeActive?: boolean;
    testMode?: TestMode;
    constructor(opts?: Options);
    /**
     *
     * @param {Buffer} message
     */
    static parseBufferMessage(message: Buffer): ParsedMessage | undefined;
    /**
     *
     * @param {Buffer} buffer
     */
    static parsePacketHeader(buffer: Buffer): any;
    /**
     *
     * @param {Number} packetFormat
     * @param {Number} packetId
     */
    static getPacketSize(packetFormat: number, packetId: number): number;
    /**
     *
     * @param {Number} packetId
     */
    static getParserByPacketId(packetId: number): typeof PacketCarDamageDataParser | typeof PacketCarSetupDataParser | typeof PacketCarStatusDataParser | typeof PacketCarTelemetryDataParser | typeof PacketCarTelemetry2DataParser | typeof PacketEventDataParser | typeof PacketFinalClassificationDataParser | typeof PacketLapDataParser | typeof PacketLobbyInfoDataParser | typeof PacketMotionDataParser | typeof PacketParticipantsDataParser | typeof PacketSessionDataParser | typeof PacketSessionHistoryDataParser | typeof PacketTyreSetsDataParser | typeof PacketMotionExDataParser | typeof PacketTimeTrialDataParser | typeof PacketLapPositionsDataParser | null;
    /**
     *
     * @param {Buffer} message
     */
    handleMessage(message: Buffer): void;
    /**
     *
     * @param {Buffer} message
     */
    handleTestModeMessage(message: Buffer): void;
    /**
     *
     * @param {Buffer} message
     */
    bridgeMessage(message: Buffer): void;
    /**
     * Method to start listening for packets
     */
    start(): void;
    /**
     * Method to close the client
     */
    stop(): dgram.Socket | undefined;
    /**
     * Method to add a new forward address
     */
    addForwardAddress(address: Address): Address[];
    /**
     * Method to remove a forward address
     */
    removeForwardAddress(address: Address): Address[] | undefined;
}
export { F1TelemetryClient, constants, constantsTypes, packetTypes, DEFAULT_PORT, FORWARD_ADDRESSES, };
