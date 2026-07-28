/**
 * F1 HUD Driver Utilities
 * Shared utility functions for driver name matching and data loading
 */

// Driver IDs that indicate a human/custom driver (255 = pre-2026, 65535 = 2026+ extended DB)
const CUSTOM_DRIVER_IDS = new Set([255, 65535]);

const DriverUtils = {
    /**
     * Session Type Constants
     */
    SESSION_TYPE: {
        UNKNOWN: 0,
        PRACTICE_1: 1,
        PRACTICE_2: 2,
        PRACTICE_3: 3,
        SHORT_PRACTICE: 4,
        QUALIFYING_1: 5,
        QUALIFYING_2: 6,
        QUALIFYING_3: 7,
        SHORT_QUALIFYING: 8,
        ONE_SHOT_QUALIFYING: 9,
        SPRINT_SHOOTOUT_1: 10,
        SPRINT_SHOOTOUT_2: 11,
        SPRINT_SHOOTOUT_3: 12,
        SHORT_SPRINT_SHOOTOUT: 13,
        ONE_SHOT_SPRINT_SHOOTOUT: 14,
        RACE: 15,
        RACE_2: 16,
        RACE_3: 17,
        TIME_TRIAL: 18
    },

    /**
     * Knockout Zone Position Thresholds
     */
    KNOCKOUT_ZONE_POSITIONS: {
        Q1_20_CARS: 15,  // Positions 16-20 are knockout zone
        Q1_22_CARS: 16,  // Positions 17-22 are knockout zone
        Q2: 10           // Positions 11+ are knockout zone
    },

    /**
     * Formula Type Constants
     */
    FORMULA_TYPE: {
        F1_MODERN: 0,
        F1_CLASSIC: 1,
        F2: 2,
        F1_GENERIC: 3,
        BETA: 4,
        SUPERCARS: 5,
        ESPORTS: 6,
        F2_2021: 7,
        F1_WORLD: 8,
        F1_ELIMINATION: 9,
        F1_26: 13
    },

    /**
     * Resolve the car index overlays should treat as "the player"/"active driver".
     *
     * Normally this is just m_header.m_playerCarIndex. But in Multiplayer, once you
     * DNF/DSQ/finish (or if you're a pure spectator, where playerCarIndex is 255), the
     * game lets you spectate another car — the Session packet reports this via
     * m_isSpectating/m_spectatorCarIndex, and every position-keyed overlay (Leaderboard
     * PI row, etc.) should follow the spectated car instead of the now-inactive player car.
     *
     * @param {number} playerCarIndex - m_header.m_playerCarIndex (255 = no player car / full spectator)
     * @param {number} isSpectating - m_isSpectating from the Session packet (0 or 1)
     * @param {number} spectatorCarIndex - m_spectatorCarIndex from the Session packet
     * @returns {number} The car index overlays should treat as "the active driver"
     */
    getActiveDriverIndex(playerCarIndex, isSpectating, spectatorCarIndex) {
        return isSpectating === 1 ? spectatorCarIndex : playerCarIndex;
    },

    /**
     * Determine the "content era" year a car's livery belongs to, based on its team ID.
     * F1 25 keeps reporting m_gameYear = 25 even with the 2026 Season Pack active (it's
     * still the same game/title), so gameYear alone can't tell 2024/2025/2026-liveried
     * cars apart — only the team ID ranges in DefaultTeams.json do that.
     *
     * @param {number} teamId - m_teamId from a Participants packet entry
     * @returns {number|null} 2024, 2025, or 2026 if the ID is era-specific; null for the
     *   default real F1 teams (0-9), F1 Generic (41), and My Team (104) — callers should
     *   fall back to m_gameYear-derived year for those.
     */
    getCarEraYear(teamId) {
        if (teamId === undefined || teamId === null) return null;

        // 2024 classic-content teams (APXGP '24, Konnersport '24, F1 24 F2 grid, F1 24 real teams)
        if (teamId === 142 || teamId === 155 ||
            (teamId >= 158 && teamId <= 168) ||
            (teamId >= 185 && teamId <= 194)) {
            return 2024;
        }

        // 2025 content teams (APXGP, Konnersport, F2 grid pre-2026-pack)
        if (teamId === 129 || teamId === 154 ||
            (teamId >= 209 && teamId <= 219) ||
            (teamId >= 465 && teamId <= 475)) {
            return 2025;
        }

        // 2026 Season Pack teams (real F1 '26, F2 '26 reserved range, F1 Generic '26, My Team '26)
        if ((teamId >= 220 && teamId <= 230) ||
            (teamId >= 476 && teamId <= 486) ||
            teamId === 488 || teamId === 65535) {
            return 2026;
        }

        return null;
    },

    /**
     * Load custom drivers and team data based on formula type
     * @param {number} formulaType - The formula type from session packet
     * @returns {Promise<{customDrivers: Array, teamNames: Object}>}
     */
    async loadDriverData(formulaType) {
        try {
            let customDriversFile = 'CustomF1Drivers.json';
            
            // Determine which custom drivers file to load based on formula type
            if (formulaType === this.FORMULA_TYPE.F2 || formulaType === this.FORMULA_TYPE.F2_2021) {
                customDriversFile = 'CustomF2Drivers.json';
            }

            const [teamsResponse, customDriversResponse] = await Promise.all([
                fetch('/data/DefaultTeams.json'),
                fetch(`/data/${customDriversFile}`)
            ]);

            const customDrivers = await customDriversResponse.json();
            const teamNames = await teamsResponse.json();

            return { customDrivers, teamNames };
        } catch (error) {
            console.error('[DriverUtils] Error loading driver data:', error);
            return { customDrivers: [], teamNames: {} };
        }
    },

    /**
     * Match a custom driver using priority system:
     * Priority 1: Exact name match (MatchName) - only if m_showOnlineNames is enabled
     * Priority 2: Race number + team match
     * Priority 3: Race number only
     * 
     * @param {Object} participant - Participant data from telemetry
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {Object|null} Matched custom driver object or null
     */
    matchCustomDriver(participant, customDrivers, teamNames) {
        if (!participant || !customDrivers || customDrivers.length === 0) {
            return null;
        }

        const raceNumber = participant.m_raceNumber;
        const teamId = participant.m_teamId;
        const name = participant.m_name;
        const showOnlineNames = participant.m_showOnlineNames;
        
        // Priority 1: Exact name match (only if online names are enabled for privacy)
        if (showOnlineNames === 1) {
            let match = customDrivers.find(d => d.MatchName && d.MatchName === name);
            if (match) return match;
        }
        
        // Priority 2: Race number + team match
        const teamData = teamNames?.[teamId];
        const teamName = teamData?.Name || '';
        if (teamName) {
            const match = customDrivers.find(d => 
                d.RaceNumber === raceNumber && 
                d.Team && d.Team.toLowerCase() === teamName.toLowerCase()
            );
            if (match) return match;
        }
        
        // Priority 3: Race number only
        const match = customDrivers.find(d => d.RaceNumber === raceNumber);
        if (match) return match;
        
        return null;
    },

    /**
     * Get driver last name for display
     * Handles AI drivers (via driverId), custom drivers (driverId 255), and fallback
     * 
     * @param {Object} participant - Participant data from telemetry
     * @param {Object} aiDrivers - AI drivers lookup object (key: driverId)
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {string} Driver's last name for display
     */
    getDriverLastName(participant, aiDrivers, customDrivers, teamNames) {
        if (!participant) {
            return 'UNKNOWN';
        }

        // Custom driver (player or custom roster)
        if (CUSTOM_DRIVER_IDS.has(participant.m_driverId)) {
            const customMatch = this.matchCustomDriver(participant, customDrivers, teamNames);
            if (customMatch) {
                return customMatch.LastName || customMatch.DisplayName || 'PLAYER';
            }
            return participant.m_name || 'PLAYER';
        }
        
        // AI driver
        if (aiDrivers && aiDrivers[participant.m_driverId]) {
            return aiDrivers[participant.m_driverId].lastName || 'UNKNOWN';
        }
        
        // Fallback
        return participant.m_name || 'UNKNOWN';
    },

    /**
     * Get driver first name for display
     * Handles AI drivers (via driverId), custom drivers (driverId 255), and fallback
     * 
     * @param {Object} participant - Participant data from telemetry
     * @param {Object} aiDrivers - AI drivers lookup object (key: driverId)
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {string} Driver's first name for display
     */
    getDriverFirstName(participant, aiDrivers, customDrivers, teamNames) {
        if (!participant) {
            return '';
        }

        // Custom driver (player or custom roster)
        if (CUSTOM_DRIVER_IDS.has(participant.m_driverId)) {
            const customMatch = this.matchCustomDriver(participant, customDrivers, teamNames);
            if (customMatch) {
                return customMatch.FirstName || '';
            }
            // Fallback: try to extract first name from participant name
            const fullName = participant.m_name || '';
            const nameParts = fullName.split(' ');
            return nameParts.length > 1 ? nameParts[0] : '';
        }
        
        // AI driver
        if (aiDrivers && aiDrivers[participant.m_driverId]) {
            return aiDrivers[participant.m_driverId].firstName || '';
        }
        
        // Fallback
        return '';
    },

    /**
     * Get driver full name for display
     * Returns "FirstName LastName" format
     * 
     * @param {Object} participant - Participant data from telemetry
     * @param {Object} aiDrivers - AI drivers lookup object (key: driverId)
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {string} Driver's full name for display
     */
    getDriverFullName(participant, aiDrivers, customDrivers, teamNames) {
        if (!participant) {
            return 'UNKNOWN';
        }

        // Custom driver
        if (CUSTOM_DRIVER_IDS.has(participant.m_driverId)) {
            const customMatch = this.matchCustomDriver(participant, customDrivers, teamNames);
            if (customMatch) {
                const first = customMatch.FirstName || '';
                const last = customMatch.LastName || customMatch.DisplayName || 'PLAYER';
                return first ? `${first} ${last}` : last;
            }
            return participant.m_name || 'PLAYER';
        }
        
        // AI driver
        if (aiDrivers && aiDrivers[participant.m_driverId]) {
            const driver = aiDrivers[participant.m_driverId];
            const first = driver.firstName || '';
            const last = driver.lastName || 'UNKNOWN';
            return first ? `${first} ${last}` : last;
        }
        
        // Fallback
        return participant.m_name || 'UNKNOWN';
    },

    /**
     * Get driver last name for display
     * Resolves custom drivers, AI drivers, and falls back to the last word of m_name
     *
     * @param {Object} participant - Participant data from telemetry
     * @param {Object} aiDrivers - AI drivers lookup object (key: driverId)
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {string} Driver's last name
     */
    getDriverLastName(participant, aiDrivers, customDrivers, teamNames) {
        if (!participant) return '';

        // Custom driver
        if (CUSTOM_DRIVER_IDS.has(participant.m_driverId)) {
            const customMatch = this.matchCustomDriver(participant, customDrivers, teamNames);
            if (customMatch) {
                return customMatch.LastName || customMatch.DisplayName || 'PLAYER';
            }
            return (participant.m_name ?? '').split(' ').pop() || 'PLAYER';
        }

        // AI driver
        if (aiDrivers && aiDrivers[participant.m_driverId]) {
            const driver = aiDrivers[participant.m_driverId];
            if (driver.lastName) return driver.lastName;
        }

        // Fallback
        return (participant.m_name ?? '').split(' ').pop() || 'UNKNOWN';
    },

    /**
     * Get driver abbreviation (3-letter code) for display
     * Handles AI drivers, custom drivers, and generates fallback abbreviations
     * 
     * @param {Object} participant - Participant data from telemetry
     * @param {Object} aiDrivers - AI drivers lookup object (key: driverId)
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {string} Driver's 3-letter abbreviation
     */
    getDriverAbbreviation(participant, aiDrivers, customDrivers, teamNames) {
        if (!participant) {
            return 'UNK';
        }

        // Custom driver (player or custom roster)
        if (CUSTOM_DRIVER_IDS.has(participant.m_driverId)) {
            const customMatch = this.matchCustomDriver(participant, customDrivers, teamNames);
            if (customMatch) {
                // Check if custom driver has abbreviation defined
                if (customMatch.Abbreviation) {
                    return customMatch.Abbreviation.toUpperCase();
                }
                // Generate from last name
                const lastName = customMatch.LastName || customMatch.DisplayName || 'PLAYER';
                return this._generateAbbreviation(lastName);
            }
            // Generate from participant name
            return this._generateAbbreviation(participant.m_name || 'PLAYER');
        }
        
        // AI driver
        if (aiDrivers && aiDrivers[participant.m_driverId]) {
            const driver = aiDrivers[participant.m_driverId];
            // Check if AI driver has abbreviation defined
            if (driver.abbreviation) {
                return driver.abbreviation.toUpperCase();
            }
            // Generate from last name
            if (driver.lastName) {
                return this._generateAbbreviation(driver.lastName);
            }
        }
        
        // Fallback: generate from participant name
        return this._generateAbbreviation(participant.m_name || 'UNKNOWN');
    },

    /**
     * Generate a 3-letter abbreviation from a name
     * Internal helper function
     * 
     * @param {string} name - Name to abbreviate
     * @returns {string} 3-letter abbreviation
     * @private
     */
    _generateAbbreviation(name) {
        if (!name || typeof name !== 'string') {
            return 'UNK';
        }
        
        // Remove special characters and take first 3 letters
        const cleaned = name.replace(/[^A-Za-z]/g, '').toUpperCase();
        
        if (cleaned.length >= 3) {
            return cleaned.substring(0, 3);
        } else if (cleaned.length > 0) {
            // Pad with spaces if less than 3 characters
            return cleaned.padEnd(3, ' ');
        }
        
        return 'UNK';
    },

    /**
     * Build the ordered list of candidate image URLs for a driver's race number,
     * most specific first: team-curated design (DefaultTeams.json "NumberDesign_<num>")
     * before the flat default. Caller tries each in order until one loads.
     *
     * Note: a year-suffixed variant ("NumberDesign_<num>_<year>") is intentionally not
     * checked here — most team IDs aren't reused across game years (only a handful like
     * 0-9/41/104/129 are), so it's deferred until older-game-year support is needed.
     *
     * @param {number} raceNum - Driver's race number
     * @param {Object} teamData - This driver's team entry from DefaultTeams.json
     * @returns {string[]} Ordered candidate URLs
     */
    getDriverNumberImageCandidates(raceNum, teamData) {
        const candidates = [];
        const teamFile = teamData?.[`NumberDesign_${raceNum}`];
        if (teamFile) candidates.push(`/images/driver-numbers/${teamFile}`);
        candidates.push(`/images/driver-numbers/${raceNum}.svg`);
        candidates.push(`/images/driver-numbers/${raceNum}.png`);
        return candidates;
    },

    /**
     * Check if a position is in the knockout zone for qualifying sessions
     *
     * @param {number} position - Driver's current position
     * @param {number} sessionType - Current session type
     * @param {number} numActiveCars - Number of active cars in session
     * @returns {boolean} True if position is in knockout zone
     */
    isInKnockoutZone(position, sessionType, numActiveCars) {
        const isQ1 = [
            this.SESSION_TYPE.QUALIFYING_1, 
            this.SESSION_TYPE.SPRINT_SHOOTOUT_1
        ].includes(sessionType);
        
        const isQ2 = [
            this.SESSION_TYPE.QUALIFYING_2, 
            this.SESSION_TYPE.SPRINT_SHOOTOUT_2
        ].includes(sessionType);
        
        if (isQ1) {
            const threshold = numActiveCars === 20 
                ? this.KNOCKOUT_ZONE_POSITIONS.Q1_20_CARS 
                : this.KNOCKOUT_ZONE_POSITIONS.Q1_22_CARS;
            return position > threshold;
        } else if (isQ2) {
            return position > this.KNOCKOUT_ZONE_POSITIONS.Q2;
        }
        
        return false;
    },

    /**
     * Build participant name lookup for all drivers in session
     * 
     * @param {Array} participants - Array of participant data from Participants packet
     * @param {Object} aiDrivers - AI drivers lookup object
     * @param {Array} customDrivers - Array of custom driver objects
     * @param {Object} teamNames - Team names lookup object
     * @returns {Object} Lookup object mapping index to driver last name
     */
    buildParticipantNames(participants, aiDrivers, customDrivers, teamNames) {
        const names = {};
        
        if (!participants || !Array.isArray(participants)) {
            return names;
        }

        participants.forEach((participant, idx) => {
            names[idx] = this.getDriverLastName(participant, aiDrivers, customDrivers, teamNames);
        });

        return names;
    }
};

// Make available globally for overlay scripts
if (typeof window !== 'undefined') {
    window.DriverUtils = DriverUtils;
}
