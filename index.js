const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { F1TelemetryClient, constants } = require('@deltazeroproduction/f1-udp-parser');
const { PACKETS } = constants;
const path = require('path');
const prompt = require('prompt');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Prompt for port
prompt.start();
const promptSchema = {
    properties: {
        port: {
            description: 'Please enter the Game Port that you want to use (default: 20777)',
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

    // Listen for Car Telemetry packets (ID 6)
    client.on(PACKETS.carTelemetry, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Car Status packets (ID 7)
    client.on(PACKETS.carStatus, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Lap Data packets (ID 2)
    client.on(PACKETS.lapData, (data) => {
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
    app.get('/', (req, res) => res.redirect('/speedometer'));

    server.listen(3000, () => console.log('Overlays at http://localhost:3000/speedometer'));
});