"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PacketSessionDataParser = void 0;
const binary_parser_1 = require("binary-parser");
const F1Parser_1 = require("../F1Parser");
const ActiveAeroZoneParser_1 = require("./ActiveAeroZoneParser");
const DRSZoneParser_1 = require("./DRSZoneParser");
const MarshalZoneParser_1 = require("./MarshalZoneParser");
const PacketHeaderParser_1 = require("./PacketHeaderParser");
const WeatherForecastSampleParser_1 = require("./WeatherForecastSampleParser");
class PacketSessionDataParser extends F1Parser_1.F1Parser {
    data;
    constructor(buffer, packetFormat) {
        super();
        this.endianess('little')
            .nest('m_header', {
            type: new PacketHeaderParser_1.PacketHeaderParser(packetFormat),
        })
            .uint8('m_weather')
            .int8('m_trackTemperature')
            .int8('m_airTemperature')
            .uint8('m_totalLaps')
            .uint16le('m_trackLength')
            .uint8('m_sessionType')
            .int8('m_trackId')
            .uint8('m_formula')
            .uint16le('m_sessionTimeLeft')
            .uint16le('m_sessionDuration')
            .uint8('m_pitSpeedLimit')
            .uint8('m_gamePaused')
            .uint8('m_isSpectating')
            .uint8('m_spectatorCarIndex')
            .uint8('m_sliProNativeSupport')
            .uint8('m_numMarshalZones')
            .array('m_marshalZones', { length: 21, type: new MarshalZoneParser_1.MarshalZoneParser() })
            .uint8('m_safetyCarStatus')
            .uint8('m_networkGame')
            .uint8('m_numWeatherForecastSamples');
        if (packetFormat === 2022 || packetFormat === 2023) {
            this.array('m_weatherForecastSamples', {
                length: 56,
                type: new WeatherForecastSampleParser_1.WeatherForecastSampleParser(),
            });
        }
        if (packetFormat === 2024 || packetFormat === 2025 || packetFormat === 2026) {
            this.array('m_weatherForecastSamples', {
                length: 64,
                type: new WeatherForecastSampleParser_1.WeatherForecastSampleParser(),
            });
        }
        this.uint8('m_forecastAccuracy')
            .uint8('m_aiDifficulty')
            .uint32le('m_seasonLinkIdentifier')
            .uint32le('m_weekendLinkIdentifier')
            .uint32le('m_sessionLinkIdentifier')
            .uint8('m_pitStopWindowIdealLap')
            .uint8('m_pitStopWindowLatestLap')
            .uint8('m_pitStopRejoinPosition')
            .uint8('m_steeringAssist')
            .uint8('m_brakingAssist')
            .uint8('m_gearboxAssist')
            .uint8('m_pitAssist')
            .uint8('m_pitReleaseAssist')
            .uint8('m_ERSAssist')
            .uint8('m_DRSAssist')
            .uint8('m_dynamicRacingLine')
            .uint8('m_dynamicRacingLineType')
            .uint8('m_gameMode')
            .uint8('m_ruleSet')
            .uint32le('m_timeOfDay')
            .uint8('m_sessionLength');
        if (packetFormat === 2023) {
            this.uint8('m_speedUnitsLeadPlayer')
                .uint8('m_temperatureUnitsLeadPlayer')
                .uint8('m_speedUnitsSecondaryPlayer')
                .uint8('m_temperatureUnitsSecondaryPlayer')
                .uint8('m_numSafetyCarPeriods')
                .uint8('m_numVirtualSafetyCarPeriods')
                .uint8('m_numRedFlagPeriods');
        }
        if (packetFormat === 2024 || packetFormat === 2025 || packetFormat === 2026) {
            this.uint8('m_speedUnitsLeadPlayer')
                .uint8('m_temperatureUnitsLeadPlayer')
                .uint8('m_speedUnitsSecondaryPlayer')
                .uint8('m_temperatureUnitsSecondaryPlayer')
                .uint8('m_numSafetyCarPeriods')
                .uint8('m_numVirtualSafetyCarPeriods')
                .uint8('m_numRedFlagPeriods')
                .uint8('m_equalCarPerformance')
                .uint8('m_recoveryMode')
                .uint8('m_flashbackLimit')
                .uint8('m_surfaceType')
                .uint8('m_lowFuelMode')
                .uint8('m_raceStarts')
                .uint8('m_tyreTemperature')
                .uint8('m_pitLaneTyreSim')
                .uint8('m_carDamage')
                .uint8('m_carDamageRate')
                .uint8('m_collisions')
                .uint8('m_collisionsOffForFirstLapOnly')
                .uint8('m_mpUnsafePitRelease')
                .uint8('m_mpOffForGriefing')
                .uint8('m_cornerCuttingStringency')
                .uint8('m_parcFermeRules')
                .uint8('m_pitStopExperience')
                .uint8('m_safetyCar')
                .uint8('m_safetyCarExperience')
                .uint8('m_formationLap')
                .uint8('m_formationLapExperience')
                .uint8('m_redFlags')
                .uint8('m_affectsLicenceLevelSolo')
                .uint8('m_affectsLicenceLevelMP')
                .uint8('m_numSessionsInWeekend')
                .array('m_weekendStructure', {
                length: 12,
                type: new binary_parser_1.Parser().uint8(''),
            })
                .floatle('m_sector2LapDistanceStart')
                .floatle('m_sector3LapDistanceStart');
        }
        if (packetFormat === 2026) {
            this.uint8('m_activeAeroTrackStatus')
                .uint8('m_numActiveAeroZonesFull')
                .array('m_activeAeroZonesFull', {
                length: 8,
                type: new ActiveAeroZoneParser_1.ActiveAeroZoneParser(),
            })
                .uint8('m_numActiveAeroZonesPartial')
                .array('m_activeAeroZonesPartial', {
                length: 8,
                type: new ActiveAeroZoneParser_1.ActiveAeroZoneParser(),
            })
                .uint8('m_numDRSZones')
                .array('m_drsZones', {
                length: 4,
                type: new DRSZoneParser_1.DRSZoneParser(),
            })
                .floatle('m_startReactionTime')
                .uint8('m_antiLockBrakesAssist')
                .uint8('m_tractionControlAssist')
                .uint8('m_dynamicRacingLineHiVis')
                .uint8('m_dynamicRacingLineColourBlind')
                .uint8('m_recurringRewindPrompt');
        }
        this.data = this.fromBuffer(buffer);
    }
}
exports.PacketSessionDataParser = PacketSessionDataParser;
//# sourceMappingURL=PacketSessionDataParser.js.map