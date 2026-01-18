const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { F1TelemetryClient, constants } = require('@deltazeroproduction/f1-udp-parser');
const { PACKETS, DRIVERS, EVENT_CODES, WEATHER, PENALTIES, INFRINGEMENTS } = constants;
const path = require('path');
const fs = require('fs');
const prompt = require('prompt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Overlay config management
const CONFIG_PATH = path.join(__dirname, 'public', 'data', 'OverlayConfig.json');

function loadOverlayConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading overlay config:', err);
    }
    // Default config if file doesn't exist or error
    return {
        overlays: {
            'weather': { visible: true, name: 'Weather' },
            'speedometer': { visible: true, name: 'Speedometer' },
            'lap-timer': { visible: true, name: 'Lap Timer' },
            'live-speed': { visible: true, name: 'Live Speed' },
            'turn-indicator': { visible: true, name: 'Turn Indicator' }
        }
    };
}

function saveOverlayConfig(config) {
    try {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Error saving overlay config:', err);
    }
}

let overlayConfig = loadOverlayConfig();

// Prompt for port
prompt.start();
const promptSchema = {
    properties: {
        port: {
            description: 'Please enter the Game Port that you want to use',
            type: 'integer',
            default: 20777,
            required: false
        }
    }
};

prompt.get(promptSchema, (err, result) => {
    if (err) {
        console.error('Error getting port:', err);
        process.exit(1);
    }
    const portNumber = result.port || 20777;
    console.log(`Using port ${portNumber} for telemetry`);

    // Set up F1 telemetry client with dynamic port
    const client = new F1TelemetryClient({ port: portNumber });
    // Might add a UDP redirection option later as well

    // Handle Socket.IO connections
    io.on('connection', (socket) => {
        let overlayName = 'Unknown';
        
        // Handle overlay identification
        socket.on('identify', (name) => {
            overlayName = name;
            console.log(`Overlay connected: ${overlayName}`);
        });
        
        // Send constants to client
        socket.emit('drivers_data', DRIVERS);
        socket.emit('event_codes', EVENT_CODES);
        socket.emit('weather_data', WEATHER);
        socket.emit('penalties_data', PENALTIES);
        socket.emit('infringements_data', INFRINGEMENTS);
        // Send current overlay config
        socket.emit('overlay_config', overlayConfig);
        
        // Handle config updates from controller
        socket.on('config_update', (update) => {
            if (update.overlay && overlayConfig.overlays[update.overlay]) {
                overlayConfig.overlays[update.overlay][update.property] = update.value;
                saveOverlayConfig(overlayConfig);
                // Broadcast to all clients (including overlays)
                io.emit('overlay_config', overlayConfig);
                console.log(`Config updated: ${update.overlay}.${update.property} = ${update.value}`);
            }
        });
        
        socket.on('disconnect', () => {
            console.log(`Overlay disconnected: ${overlayName}`);
        });
        
        // Handle server shutdown request
        socket.on('shutdown_server', () => {
            console.log('Shutdown requested from Controller');
            console.log('Shutting down server...');
            
            // Notify all clients
            io.emit('server_shutdown');
            
            // Give clients a moment to receive the message, then exit
            setTimeout(() => {
                process.exit(0);
            }, 500);
        });
    });

    function convertBigInt(obj) {
        if (typeof obj === 'bigint') return obj.toString();
        if (Array.isArray(obj)) return obj.map(convertBigInt);
        if (obj && typeof obj === 'object') {
            const res = {};
            for (const key in obj) res[key] = convertBigInt(obj[key]);
            return res;
        }
        return obj;
    }

    // Listen for Session packets (ID 1)
    client.on(PACKETS.session, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Lap Data packets (ID 2)
    client.on(PACKETS.lapData, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Event packets (ID 3)
    client.on(PACKETS.event, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    //Listen for Participants packets (ID 4)
    client.on(PACKETS.participants, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Car Telemetry packets (ID 6)
    client.on(PACKETS.carTelemetry, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Car Status packets (ID 7)
    client.on(PACKETS.carStatus, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Session History packets (ID 11)
    client.on(PACKETS.sessionHistory, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Time Trial packets (ID 14)
    client.on(PACKETS.timeTrial, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Error handling
    client.on('error', (err) => {
        console.error('UDP Client Error:', err);
        io.emit('error', 'UDP connection issue. Check game telemetry settings.');
    });

    // Start client
    try {
        client.start();
        console.log(`UDP Client started on port ${portNumber}`);
    } catch (err) {
        console.error('Failed to start UDP client:', err);
    }

    // Serve static files (images, CSS)
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/images', express.static(path.join(__dirname, 'images')));

    // Routes
    app.get('/speedometer', (req, res) => res.sendFile(path.join(__dirname, 'views', 'speedometer.html')));
    app.get('/lap-timer', (req, res) => res.sendFile(path.join(__dirname, 'views', 'lap-timer.html')));
    app.get('/pit-timer', (req, res) => res.sendFile(path.join(__dirname, 'views', 'pit-timer.html')));
    app.get('/live-speed', (req, res) => res.sendFile(path.join(__dirname, 'views', 'live-speed.html')));
    app.get('/fastest-lap', (req, res) => res.sendFile(path.join(__dirname, 'views', 'fastest-lap.html')));
    app.get('/weather', (req, res) => res.sendFile(path.join(__dirname, 'views', 'weather.html')));
    app.get('/turn-indicator', (req, res) => res.sendFile(path.join(__dirname, 'views', 'turn-indicator.html')));
    app.get('/controller-extended', (req, res) => res.sendFile(path.join(__dirname, 'views', 'controller-extended.html')));
    app.get('/fastest-sectors', (req, res) => res.sendFile(path.join(__dirname, 'views', 'fastest-sectors.html')));
    app.get('/message-box', (req, res) => res.sendFile(path.join(__dirname, 'views', 'message-box.html')));

    // Public Debug pages
    app.get('/position-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'position-debug.html')));
    app.get('/event-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'event-debug.html')));

    // Local Debug only - not added in public source code (would prefer to only add these if these files exist)
    app.get('/session-history-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'session-history-debug.html')));

    // Default to speedometer overlay (for now)
    app.get('/', (req, res) => res.redirect('/speedometer'));
    
    server.listen(3000, () => console.log('Overlays at http://localhost:3000/speedometer'));
});