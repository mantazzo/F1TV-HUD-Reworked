/**
 * F1 HUD Driver Utilities
 * Shared utility functions for driver name matching and data loading
 */

// Driver IDs that indicate a human/custom driver (255 = pre-2026, 65535 = 2026+ extended DB)
const CUSTOM_DRIVER_IDS = new Set([255, 65535]);
// m_name sent for online players who have "Show Online Names" off
const HIDDEN_PLAYER_NAME = 'Player';

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
     * Short session name for tight UI spots (e.g. the Weather forecast header).
     * Races depend on the weekend: Race (15) is the Sprint Race when the weekend also has
     * a Race 2 (16) — F1 Sprint weekends and F2 — and Race 2 is F2's Feature Race.
     * @param {number} sessionType - m_sessionType
     * @param {number[]} weekendStructure - m_weekendStructure (session types, 0-padded)
     * @param {number} formulaType - m_formula
     * @returns {string}
     */
    getSessionShortName(sessionType, weekendStructure = [], formulaType = 0) {
        const T = this.SESSION_TYPE;
        switch (sessionType) {
            case T.RACE:   return weekendStructure.includes(T.RACE_2) ? 'SR' : 'RACE';
            case T.RACE_2: return formulaType === this.FORMULA_TYPE.F2 ? 'FR' : 'RACE';
            case T.RACE_3: return 'RACE';
        }
        const SHORT_NAMES = {
            // Short-format sessions drop the "SHORT" prefix to fit (P / Q / SQ)
            1: 'FP1', 2: 'FP2', 3: 'FP3', 4: 'P',
            5: 'Q1', 6: 'Q2', 7: 'Q3', 8: 'Q', 9: 'OSQ',
            10: 'SQ1', 11: 'SQ2', 12: 'SQ3', 13: 'SQ', 14: 'OSSQ',
            18: 'TT'
        };
        return SHORT_NAMES[sessionType] ?? '';
    },

    /**
     * Knockout Zone Position Thresholds
     */
    KNOCKOUT_ZONE_POSITIONS: {
        Q1_20_CARS: 15,  // Positions 16-20 are knockout zone
        Q1_22_CARS: 16,  // Positions 17-22 are knockout zone
        Q1_24_CARS: 17,  // Positions 18-24 are knockout zone (2026 season, 24-car grid)
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

        // 2026 Season Pack teams (real F1 '26, F2 '26, F1 Generic '26, My Team '26)
        if ((teamId >= 220 && teamId <= 230) ||
            (teamId >= 233 && teamId <= 243) ||
            (teamId >= 476 && teamId <= 486) ||
            (teamId >= 489 && teamId <= 499) ||
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
            this._warnUnmatchableDrivers(customDrivers);

            return { customDrivers, teamNames };
        } catch (error) {
            console.error('[DriverUtils] Error loading driver data:', error);
            return { customDrivers: [], teamNames: {} };
        }
    },

    /**
     * Match a custom driver. Each entry is matched in exactly one way:
     * - Entry with MatchName: matched ONLY by exact name (never a hidden name, i.e.
     *   "Player" with m_showOnlineNames 0). RaceNumber/Team on such an entry are
     *   ignored, so other cars using the same number never inherit it.
     * - Entry without MatchName: matched by RaceNumber. If Team is set, the car's
     *   team must match too; a number + team entry wins over a number-only one.
     * Entries with neither MatchName nor RaceNumber are skipped.
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
        const name = participant.m_name;

        // Name-locked entries. m_showOnlineNames alone can't gate this: the local player
        // always gets their real name even with the flag at 0. Hidden online players
        // arrive as "Player" with the flag at 0, so only that combination is skipped;
        // someone actually named "Player" with online names on can still match.
        const nameHidden = name === HIDDEN_PLAYER_NAME && participant.m_showOnlineNames !== 1;
        if (name && !nameHidden) {
            const match = customDrivers.find(d => d.MatchName && d.MatchName === name);
            if (match) return match;
        }

        // Number-based entries (no MatchName)
        const numberEntries = customDrivers.filter(d => !d.MatchName && d.RaceNumber === raceNumber);
        if (numberEntries.length === 0) return null;

        const teamMatch = numberEntries.find(d => d.Team != null && d.Team !== ''
            && this._teamMatches(d.Team, participant.m_teamId, teamNames));
        if (teamMatch) return teamMatch;

        return numberEntries.find(d => d.Team == null || d.Team === '') || null;
    },

    /**
     * Normalize a team name for comparison: lowercase, curly/straight apostrophes
     * unified. With stripEra, a trailing era suffix ("Haas ‘26" -> "haas") is removed.
     *
     * @param {string} name - Team name
     * @param {boolean} stripEra - Remove a trailing 'YY suffix
     * @returns {string}
     */
    _normalizeTeamName(name, stripEra) {
        let n = String(name).toLowerCase().replace(/[‘’`´]/g, "'").trim();
        if (stripEra) n = n.replace(/\s*'\d{2}$/, '');
        return n;
    },

    /**
     * Whether a custom driver's Team value matches the car's team ID.
     * Team can be a team ID (number), a name (ShortName or FullName from
     * DefaultTeams.json), or an array mixing both (any element may match).
     * Names are case/apostrophe-insensitive; a name without an era suffix
     * ("Haas") matches every era, one with a suffix ("Haas '26") only that era.
     *
     * @param {number|string|Array} team - Team value from the custom driver entry
     * @param {number} teamId - Car's m_teamId
     * @param {Object} teamNames - Team names lookup object
     * @returns {boolean}
     */
    _teamMatches(team, teamId, teamNames) {
        if (Array.isArray(team)) return team.some(t => this._teamMatches(t, teamId, teamNames));
        if (typeof team === 'number') return team === teamId;
        if (typeof team !== 'string' || !team) return false;

        const teamData = teamNames?.[teamId];
        const carNames = [teamData?.ShortName, teamData?.FullName].filter(Boolean);
        if (carNames.length === 0) return false;

        const wanted = this._normalizeTeamName(team, false);
        const wantedHasEra = wanted !== this._normalizeTeamName(team, true);
        return carNames.some(n => this._normalizeTeamName(n, !wantedHasEra) === wanted);
    },

    /**
     * Log custom driver entries that can never match (runs on each load):
     * no MatchName and no RaceNumber.
     *
     * @param {Array} customDrivers - Array of custom driver objects
     */
    _warnUnmatchableDrivers(customDrivers) {
        if (!Array.isArray(customDrivers)) return;
        customDrivers.forEach((d, i) => {
            if (!d.MatchName && d.RaceNumber == null) {
                console.warn(`[DriverUtils] Custom driver entry #${i} ("${d.DisplayName || '?'}") has neither MatchName nor RaceNumber and will never match.`);
            }
        });
    },

    /**
     * Whether a custom driver entry prefers its DisplayName over FirstName/LastName
     * (DisplayNamePriority: true). Only an explicit boolean true counts.
     *
     * @param {Object} customDriver - Matched custom driver object
     * @returns {boolean}
     */
    _prefersDisplayName(customDriver) {
        return customDriver.DisplayNamePriority === true && !!customDriver.DisplayName;
    },

    /**
     * Name a custom driver entry shows in the "last name" slot:
     * DisplayName if DisplayNamePriority is on, else LastName, then DisplayName.
     *
     * @param {Object} customDriver - Matched custom driver object
     * @returns {string}
     */
    _customLastName(customDriver) {
        if (this._prefersDisplayName(customDriver)) return customDriver.DisplayName;
        return customDriver.LastName || customDriver.DisplayName || 'PLAYER';
    },

    /**
     * Get driver first name for display
     * Handles AI drivers (via driverId), custom drivers (driverId 255), and fallback.
     * Empty for custom drivers with DisplayNamePriority on (DisplayName stands alone).
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
                if (this._prefersDisplayName(customMatch)) return '';
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
                const first = this._prefersDisplayName(customMatch) ? '' : (customMatch.FirstName || '');
                const last = this._customLastName(customMatch);
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
                return this._customLastName(customMatch);
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
                // Generate from last name (or DisplayName, if prioritized)
                return this._generateAbbreviation(this._customLastName(customMatch));
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
            const threshold = numActiveCars > 22
                ? this.KNOCKOUT_ZONE_POSITIONS.Q1_24_CARS
                : numActiveCars > 20
                    ? this.KNOCKOUT_ZONE_POSITIONS.Q1_22_CARS
                    : this.KNOCKOUT_ZONE_POSITIONS.Q1_20_CARS;
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
