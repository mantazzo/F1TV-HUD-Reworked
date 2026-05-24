const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

const DEFAULT_PORT = 20777;
const RECORDINGS_DIR = path.join(__dirname, 'recordings');

// CLI: node recorder.js [--port 20777]
const args = process.argv.slice(2);
const portArgIdx = args.indexOf('--port');
const listenPort = portArgIdx !== -1 ? parseInt(args[portArgIdx + 1]) : DEFAULT_PORT;

// ── File size note ───────────────────────────────────────────────────────────
// Recordings can be large (~1 GB/18 min) because all packet types are captured,
// including Motion (ID 0) which fires at ~60 Hz and is one of the biggest packets.
// JSON encoding of raw byte arrays is also verbose (each byte costs 2–4 characters).
// Future options to reduce size: binary format, or skip Motion/MotionEx packets
// since they are not used by any overlay. A binary format alone would be ~4–5x smaller.
// ─────────────────────────────────────────────────────────────────────────────

// ── Proxy / transparent-forwarding mode ──────────────────────────────────────
// To record AND use overlays at the same time:
// 1. Uncomment the FORWARD_PORT constant and forwardSocket lines below.
// 2. Run index.js with --port 20778 (or any free port) instead of the default.
// 3. Point the game's UDP output to THIS recorder's port (e.g. 20777).
// The recorder will capture every packet and forward it live to the main server.
//
// const FORWARD_PORT = 20778;
// const FORWARD_HOST = '127.0.0.1';
// const forwardSocket = dgram.createSocket('udp4');
// ─────────────────────────────────────────────────────────────────────────────

if (!fs.existsSync(RECORDINGS_DIR)) {
    fs.mkdirSync(RECORDINGS_DIR);
}

const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
const outFile = path.join(RECORDINGS_DIR, `session_${sessionId}.jsonl`);
const stream = fs.createWriteStream(outFile);

const header = { type: 'header', version: 1, capturedAt: new Date().toISOString(), gamePort: listenPort };
stream.write(JSON.stringify(header) + '\n');

const socket = dgram.createSocket('udp4');
let startTime = null;
let packetCount = 0;

socket.on('message', (msg) => {
    const now = Date.now();
    if (startTime === null) startTime = now;

    stream.write(JSON.stringify({ t: now - startTime, d: [...msg] }) + '\n');
    packetCount++;

    // Uncomment when using proxy mode (see note above):
    // forwardSocket.send(msg, 0, msg.length, FORWARD_PORT, FORWARD_HOST);

    if (packetCount % 500 === 0) {
        const elapsed = ((now - startTime) / 1000).toFixed(1);
        process.stdout.write(`\r  Captured ${packetCount} packets (${elapsed}s elapsed)`);
    }
});

socket.on('error', (err) => {
    console.error('Socket error:', err);
    shutdown();
});

socket.bind({ port: listenPort, exclusive: false }, () => {
    console.log(`Recording UDP on port ${listenPort}`);
    console.log(`Saving to: ${outFile}`);
    console.log('Configure the game to send telemetry to this port, then start a session.');
    console.log('Press Ctrl+C to stop.\n');
});

function shutdown() {
    process.stdout.write('\n\nStopping...\n');
    socket.close();
    stream.end(() => {
        const duration = startTime ? ((Date.now() - startTime) / 1000).toFixed(1) : 0;
        const sizeKB = (fs.statSync(outFile).size / 1024).toFixed(1);
        console.log(`Captured ${packetCount} packets over ${duration}s`);
        console.log(`Saved to: ${outFile} (${sizeKB} KB)`);
        process.exit(0);
    });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);