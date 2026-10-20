"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FORWARD_ADDRESSES = exports.DEFAULT_PORT = exports.packetTypes = exports.constantsTypes = exports.constants = exports.F1TelemetryClient = void 0;
// tslint:disable-next-line
const dgram = __importStar(require("dgram"));
const events_1 = require("events");
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const constants = __importStar(require("./constants"));
exports.constants = constants;
const constantsTypes = __importStar(require("./constants/types"));
exports.constantsTypes = constantsTypes;
const packets_1 = require("./parsers/packets");
const packetTypes = __importStar(require("./parsers/packets/types"));
exports.packetTypes = packetTypes;
const DEFAULT_PORT = 20777;
exports.DEFAULT_PORT = DEFAULT_PORT;
const FORWARD_ADDRESSES = undefined;
exports.FORWARD_ADDRESSES = FORWARD_ADDRESSES;
/**
 *
 */
class F1TelemetryClient extends events_1.EventEmitter {
    port;
    forwardAddresses;
    socket;
    testModeActive = false;
    testMode;
    constructor(opts = {}) {
        super();
        const { port = DEFAULT_PORT, forwardAddresses = FORWARD_ADDRESSES, testModeActive, } = opts;
        this.port = port;
        this.forwardAddresses = forwardAddresses;
        this.socket = dgram.createSocket('udp4');
        this.testModeActive = testModeActive;
        if (testModeActive)
            this.testMode = initializeTestMode.call(this);
    }
    /**
     *
     * @param {Buffer} message
     */
    static parseBufferMessage(message) {
        const { m_packetFormat, m_packetId } = F1TelemetryClient.parsePacketHeader(message);
        const parser = F1TelemetryClient.getParserByPacketId(m_packetId);
        if (!parser) {
            return;
        }
        const packetData = new parser(message, m_packetFormat);
        const packetID = Object.keys(constants.PACKETS)[m_packetId];
        // emit parsed message
        return { packetData, packetID };
    }
    /**
     *
     * @param {Buffer} buffer
     */
    static parsePacketHeader(buffer
    // tslint:disable-next-line:no-any
    ) {
        const packetFormatParser = new packets_1.PacketFormatParser();
        const { m_packetFormat } = packetFormatParser.fromBuffer(buffer);
        const packetHeaderParser = new packets_1.PacketHeaderParser(m_packetFormat);
        return packetHeaderParser.fromBuffer(buffer);
    }
    /**
     *
     * @param {Number} packetFormat
     * @param {Number} packetId
     */
    static getPacketSize(packetFormat, packetId) {
        const { PACKET_SIZES } = constants;
        const packetValues = Object.values(PACKET_SIZES);
        return packetValues[packetId][packetFormat];
    }
    /**
     *
     * @param {Number} packetId
     */
    static getParserByPacketId(packetId) {
        const { PACKETS } = constants;
        const packetKeys = Object.keys(PACKETS);
        const packetType = packetKeys[packetId];
        switch (packetType) {
            case PACKETS.session:
                return packets_1.PacketSessionDataParser;
            case PACKETS.motion:
                return packets_1.PacketMotionDataParser;
            case PACKETS.lapData:
                return packets_1.PacketLapDataParser;
            case PACKETS.event:
                return packets_1.PacketEventDataParser;
            case PACKETS.participants:
                return packets_1.PacketParticipantsDataParser;
            case PACKETS.carSetups:
                return packets_1.PacketCarSetupDataParser;
            case PACKETS.carTelemetry:
                return packets_1.PacketCarTelemetryDataParser;
            case PACKETS.carStatus:
                return packets_1.PacketCarStatusDataParser;
            case PACKETS.finalClassification:
                return packets_1.PacketFinalClassificationDataParser;
            case PACKETS.lobbyInfo:
                return packets_1.PacketLobbyInfoDataParser;
            case PACKETS.carDamage:
                return packets_1.PacketCarDamageDataParser;
            case PACKETS.sessionHistory:
                return packets_1.PacketSessionHistoryDataParser;
            case PACKETS.tyreSets:
                return packets_1.PacketTyreSetsDataParser;
            case PACKETS.motionEx:
                return packets_1.PacketMotionExDataParser;
            case PACKETS.timeTrial:
                return packets_1.PacketTimeTrialDataParser;
            case PACKETS.lapPositions:
                return packets_1.PacketLapPositionsDataParser;
            case PACKETS.carTelemetry2:
                return packets_1.PacketCarTelemetry2DataParser;
            default:
                return null;
        }
    }
    /**
     *
     * @param {Buffer} message
     */
    handleMessage(message) {
        if (this.forwardAddresses) {
            // bridge message
            this.bridgeMessage(message);
        }
        const parsedMessage = F1TelemetryClient.parseBufferMessage(message);
        if (!parsedMessage || !parsedMessage.packetData) {
            return;
        }
        // emit parsed message
        this.emit(parsedMessage.packetID, parsedMessage.packetData.data);
    }
    /**
     *
     * @param {Buffer} message
     */
    handleTestModeMessage(message) {
        const { testMode } = this;
        if (!testMode)
            return;
        testMode.bufferStream.write(`${JSON.stringify(message.toJSON().data)},\n`);
        testMode.bufferCount += 1;
        if (testMode.bufferCount > 10000) {
            testMode.bufferStream.end();
            testMode.fileCount++;
            testMode.bufferCount = 0;
            testMode.bufferStream = fs_1.default.createWriteStream(`${testMode.logDir}/chunk_${testMode.fileCount}.json`);
        }
    }
    /**
     *
     * @param {Buffer} message
     */
    bridgeMessage(message) {
        if (!this.socket) {
            throw new Error('Socket is not initialized');
        }
        if (!this.forwardAddresses) {
            throw new Error('No ports to bridge over');
        }
        for (const address of this.forwardAddresses) {
            this.socket.send(message, 0, message.length, address.port, address.ip || '0.0.0.0');
        }
    }
    /**
     * Method to start listening for packets
     */
    start() {
        if (!this.socket) {
            return;
        }
        this.socket.on('listening', () => {
            if (!this.socket) {
                return;
            }
            const address = this.socket.address();
            // console.log(
            //   `UDP Client listening on ${address.address}:${address.port} 🏎`
            // );
            this.socket.setBroadcast(true);
        });
        this.socket.on('message', (m) => {
            if (this.testModeActive && this.testMode) {
                this.handleTestModeMessage(m);
            }
            else
                this.handleMessage(m);
        });
        this.socket.bind({
            port: this.port,
            exclusive: false,
        });
    }
    /**
     * Method to close the client
     */
    stop() {
        if (!this.socket) {
            return;
        }
        return this.socket.close(() => {
            // console.log(`UDP Client closed 🏁`);
            this.socket = undefined;
        });
    }
    /**
     * Method to add a new forward address
     */
    addForwardAddress(address) {
        if (!this.forwardAddresses) {
            this.forwardAddresses = [];
        }
        this.forwardAddresses.push(address);
        return this.forwardAddresses;
    }
    /**
     * Method to remove a forward address
     */
    removeForwardAddress(address) {
        if (!this.forwardAddresses) {
            return;
        }
        // remove address by splicing array
        this.forwardAddresses.splice(this.forwardAddresses.findIndex((forwardAddress) => forwardAddress.port === address.port &&
            forwardAddress.ip === address.ip), 1);
        return this.forwardAddresses;
    }
}
exports.F1TelemetryClient = F1TelemetryClient;
function initializeTestMode() {
    const localAppDataDirectory = path_1.default.join(os_1.default.homedir(), 'AppData', 'Local');
    // directory of logs from Test Mode
    const testLogDir = `${localAppDataDirectory}/Podium/udp_logs/${Date.now()}`;
    fs_1.default.mkdirSync(testLogDir);
    const testMode = {
        bufferStream: fs_1.default.createWriteStream(`${testLogDir}/chunk_${0}.json`),
        fileCount: 0,
        bufferCount: 0,
        logDir: testLogDir,
    };
    return testMode;
}
//# sourceMappingURL=index.js.map