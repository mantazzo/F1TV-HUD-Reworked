/**
 * F1 HUD Driver Utilities
 * Shared utility functions for driver name matching and data loading
 */

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
        F2_2021: 7
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
        if (participant.m_driverId === 255) {
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
        if (participant.m_driverId === 255) {
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
        if (participant.m_driverId === 255) {
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
        if (participant.m_driverId === 255) {
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
