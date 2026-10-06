const dgram = require('dgram');
const fs = require('fs');
const path = require('path');
const { askValue, parsePort, parseYesNo } = require('./cli-prompt');

const DEFAULT_PORT = 20777;
const DEFAULT_FORWARD_PORT = 20778;
const PROMPT_TIMEOUT_SEC = 10; // interactive questions auto-answer with the default after this
const RECORDINGS_DIR = path.join(__dirname, 'recordings');

// CLI: node recorder.js [--port 20777] [--name "Race Monza"] [--forward 20778] [--interactive]
//   --interactive asks for any of the above that wasn't given (used by record.bat).
const args = process.argv.slice(2);

function getFlag(flag) {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : undefined;
}

// ── File size note ───────────────────────────────────────────────────────────
// Recordings can be large (~1 GB/18 min) because all packet types are captured,
// including Motion (ID 0) which fires at ~60 Hz and is one of the biggest packets.
// JSON encoding of raw byte arrays is also verbose (each byte costs 2–4 characters).
// Future options to reduce size: binary format, or skip Motion/MotionEx packets
// since they are not used by any overlay. A binary format alone would be ~4–5x smaller.
// ─────────────────────────────────────────────────────────────────────────────

// ── Forwarding (record AND use overlays at the same time) ────────────────────
// With --forward <port>, every packet is also passed on, unchanged, to that port on
// this PC. Start index.js on that port (e.g. 20778) and point the game's UDP output
// at the recorder's port (e.g. 20777).
// ─────────────────────────────────────────────────────────────────────────────

// Optional recording name, added after the timestamp: spaces become underscores,
// characters Windows doesn't allow in file names are dropped.
function sanitizeName(name) {
    return (name || '')
        .replace(/[<>:"/\\|?*\x00-\x1f]/g, '')
        .trim()
        .replace(/\s+/g, '_')
        .replace(/^[._]+|[._]+$/g, '')
        .slice(0, 60);
}

async function getOptions() {
    const interactive = args.includes('--interactive');
    const portFlag = getFlag('--port');
    const nameFlag = getFlag('--name');
    const forwardFlag = getFlag('--forward');

    let listenPort = portFlag !== undefined ? parsePort(portFlag) : DEFAULT_PORT;
    if (listenPort === undefined) {
        console.error(`Invalid --port value: ${portFlag}`);
        process.exit(1);
    }
    let forwardPort = forwardFlag !== undefined ? parsePort(forwardFlag) : null;
    if (forwardPort === undefined) {
        console.error(`Invalid --forward value: ${forwardFlag}`);
        process.exit(1);
    }
    let name = sanitizeName(nameFlag);

    if (interactive) {
        console.log(`Recorder setup — press Enter for the default. Unanswered questions use the default after ${PROMPT_TIMEOUT_SEC}s.\n`);
        const timeout = { timeoutSec: PROMPT_TIMEOUT_SEC };

        if (portFlag === undefined) {
            listenPort = await askValue(`Game UDP port (Enter = ${DEFAULT_PORT}): `, DEFAULT_PORT, parsePort, timeout);
        }
        if (nameFlag === undefined) {
            name = sanitizeName(await askValue('Recording name, optional (e.g. Race Monza): ', '', text => text, timeout));
        }
        if (forwardFlag === undefined) {
            const forward = await askValue('Forward the data to the overlays while recording? (y/N): ', false, parseYesNo, timeout);
            if (forward) {
                // Must differ from the recording port, or the recorder would receive its own packets
                const defaultForward = listenPort === DEFAULT_FORWARD_PORT ? DEFAULT_PORT : DEFAULT_FORWARD_PORT;
                forwardPort = await askValue(`Overlay server's UDP port, not ${listenPort} (Enter = ${defaultForward}): `, defaultForward,
                    text => { const port = parsePort(text); return port !== listenPort ? port : undefined; }, timeout);
            }
        }
        console.log('');
    }

    if (forwardPort !== null && forwardPort === listenPort) {
        console.error(`The forward port can't be the same as the recording port (${listenPort}) — the recorder would receive its own packets.`);
        process.exit(1);
    }

    return { listenPort, forwardPort, name };
}

async function main() {
    const { listenPort, forwardPort, name } = await getOptions();

    if (!fs.existsSync(RECORDINGS_DIR)) {
        fs.mkdirSync(RECORDINGS_DIR);
    }

    const sessionId = new Date().toISOString().replace(/[:.]/g, '-');
    const outFile = path.join(RECORDINGS_DIR, `session_${sessionId}${name ? `_${name}` : ''}.jsonl`);
    const stream = fs.createWriteStream(outFile);

    const header = { type: 'header', version: 1, capturedAt: new Date().toISOString(), gamePort: listenPort };
    if (name) header.name = name;
    stream.write(JSON.stringify(header) + '\n');

    const socket = dgram.createSocket('udp4');
    const forwardSocket = forwardPort !== null ? dgram.createSocket('udp4') : null;
    let startTime = null;
    let packetCount = 0;

    socket.on('message', (msg) => {
        const now = Date.now();
        if (startTime === null) startTime = now;

        stream.write(JSON.stringify({ t: now - startTime, d: [...msg] }) + '\n');
        packetCount++;

        if (forwardSocket) forwardSocket.send(msg, 0, msg.length, forwardPort, '127.0.0.1');

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
        if (forwardSocket) {
            console.log(`Forwarding to: localhost:${forwardPort} (start the overlay server on this port)`);
        }
        console.log('Configure the game to send telemetry to this port, then start a session.');
        console.log('Press Ctrl+C to stop.\n');
    });

    let stopping = false;
    function shutdown() {
        if (stopping) return;
        stopping = true;
        process.stdout.write('\n\nStopping...\n');
        socket.close();
        if (forwardSocket) forwardSocket.close();
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
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
