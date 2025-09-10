const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { F1TelemetryClient, constants } = require('@deltazeroproduction/f1-udp-parser');
const { PACKETS } = constants;
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Set up F1 telemetry client for F1 25
const client = new F1TelemetryClient({ port: 20778 });

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

// Listen for Car Status packets (ID 7) for DRS data
client.on(PACKETS.carStatus, (data) => {
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
    console.log('UDP Client started on port 20778');
} catch (err) {
    console.error('Failed to start UDP client:', err);
}

// Serve static files (images, CSS)
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'images')));

// Routes
app.get('/speedometer-new', (req, res) => res.sendFile(path.join(__dirname, 'views', 'speedometer.html')));
app.get('/', (req, res) => res.redirect('/speedometer-new'));

server.listen(3000, () => console.log('Overlays at http://localhost:3000/speedometer'));