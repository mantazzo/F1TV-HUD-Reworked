const dgram = require('dgram');
const fs = require('fs');
const path = require('path');

const RECORDINGS_DIR = path.join(__dirname, 'recordings');
const SEEK_STEP_MS = 30_000;   // ← / → : ±30 seconds
const SEEK_BIG_MS  = 300_000;  // PgUp / PgDn : ±5 minutes
const SPEED_STEP   = 0.25;
const SPEED_MIN    = 0.25;
const SPEED_MAX    = 8.0;

// ── CLI args ──────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

function getFlag(flag, defaultVal) {
    const idx = args.indexOf(flag);
    return idx !== -1 ? args[idx + 1] : defaultVal;
}

const flagsWithValues = ['--port', '--speed'];
const recordingArg = args.find((a, i) => !a.startsWith('--') && !flagsWithValues.includes(args[i - 1])) || null;
const targetPort   = parseInt(getFlag('--port', '20777'));
const initialSpeed = parseFloat(getFlag('--speed', '1.0'));
const loop         = args.includes('--loop');

if (!recordingArg) { printUsage(); process.exit(1); }

const filePath = fs.existsSync(recordingArg)
    ? recordingArg
    : path.join(RECORDINGS_DIR, recordingArg);

if (!fs.existsSync(filePath)) {
    console.error(`File not found: ${filePath}`);
    printUsage();
    process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fmt(ms) {
    const s = Math.floor(Math.abs(ms) / 1000);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

function findIndexAtTime(packets, targetMs) {
    let lo = 0, hi = packets.length - 1;
    while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (packets[mid].t < targetMs) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}

function printUsage() {
    console.log('Usage: node player.js <recording> [--port 20777] [--speed 1.0] [--loop]');
    console.log('');
    console.log('  <recording>   .jsonl file path, or filename only if inside recordings/');
    console.log('  --port        Port the main server is listening on (default: 20777)');
    console.log('  --speed       Initial playback speed multiplier, e.g. 2.0 (default: 1.0)');
    console.log('  --loop        Restart from the beginning when playback finishes');
    console.log('');
    listRecordings();
}

function listRecordings() {
    if (!fs.existsSync(RECORDINGS_DIR)) return;
    const files = fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.jsonl'));
    if (files.length === 0) { console.log('No recordings in recordings/'); return; }
    console.log('Available recordings:');
    files.forEach(f => {
        const kb = (fs.statSync(path.join(RECORDINGS_DIR, f)).size / 1024).toFixed(1);
        console.log(`  ${f}  (${kb} KB)`);
    });
}

// ── Virtual playback clock ────────────────────────────────────────────────────
//
// Instead of scheduling each packet at an absolute wall-clock time, we maintain
// a "recording-time cursor" (playbackMs) that advances at `speed` times real
// time. Pausing freezes the cursor; seeking moves it directly. This makes both
// operations trivially correct without having to cancel pending timers.

const state = {
    paused:     false,
    speed:      initialSpeed,
    running:    true,
    playbackMs: 0,          // recording-time cursor at the last sync point
    wallAtSync: Date.now(), // wall-clock ms when playbackMs was last set
    seekIndex:  null,       // set by the keyboard handler to jump to a packet index
};

function getPlaybackMs() {
    if (state.paused) return state.playbackMs;
    return state.playbackMs + (Date.now() - state.wallAtSync) * state.speed;
}

function syncClock() {
    state.playbackMs = getPlaybackMs();
    state.wallAtSync = Date.now();
}

function setPaused(val) {
    syncClock();
    state.paused = val;
    if (!val) state.wallAtSync = Date.now(); // restart wall anchor on resume
}

function setSpeed(v) {
    syncClock();
    state.speed = Math.max(SPEED_MIN, Math.min(SPEED_MAX, parseFloat(v.toFixed(2))));
}

// ── Status line ────────────────────────────────────────────────────────────────

let totalDurationMs = 0;

function printStatus() {
    const pos   = getPlaybackMs();
    const label = state.paused ? '[PAUSED] ' : '[PLAYING]';
    const spd   = Number.isInteger(state.speed) ? `${state.speed}.0x` : `${state.speed}x`;
    process.stdout.write(`\r\x1b[2K  ${label}  ${fmt(pos)} / ${fmt(totalDurationMs)}  ${spd}`);
}

function printMessage(msg) {
    // Step down to a fresh line so the message doesn't overwrite the status.
    process.stdout.write(`\n         ${msg}\n`);
}

// ── Keyboard handler ───────────────────────────────────────────────────────────

function setupKeyboard(packets) {
    if (!process.stdin.isTTY) return;
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');

    process.stdin.on('data', key => {
        if (key === 'q' || key === '') { // q or Ctrl+C
            state.running = false;
            return;
        }

        if (key === ' ') {
            setPaused(!state.paused);
            printStatus();
            return;
        }

        if (key === '+' || key === '=') { setSpeed(state.speed + SPEED_STEP); printStatus(); return; }
        if (key === '-')                { setSpeed(state.speed - SPEED_STEP); printStatus(); return; }

        const right  = key === '\x1b[C';
        const left   = key === '\x1b[D';
        const pgDown = key === '\x1b[6~';
        const pgUp   = key === '\x1b[5~';

        if (right || pgDown) {
            const step = pgDown ? SEEK_BIG_MS : SEEK_STEP_MS;
            syncClock();
            state.playbackMs = Math.min(state.playbackMs + step, packets[packets.length - 1].t);
            state.wallAtSync = Date.now();
            state.seekIndex  = findIndexAtTime(packets, state.playbackMs);
            printStatus();
            return;
        }

        if (left || pgUp) {
            if (!state.paused) {
                printMessage('Pause first (Space) before rewinding.');
                return;
            }
            const step = pgUp ? SEEK_BIG_MS : SEEK_STEP_MS;
            state.playbackMs = Math.max(0, state.playbackMs - step);
            state.seekIndex  = findIndexAtTime(packets, state.playbackMs);
            printMessage('Rewound — refresh your overlays to avoid any stale state.');
            printStatus();
            return;
        }
    });
}

// ── Playback loop ──────────────────────────────────────────────────────────────

async function playback(packets, socket) {
    let i = 0;
    let lastStatusAt = 0;

    while (i < packets.length && state.running) {

        // Pause: spin until resumed or stopped
        while (state.paused && state.running) {
            const now = Date.now();
            if (now - lastStatusAt > 100) { printStatus(); lastStatusAt = now; }
            await sleep(30);
        }
        if (!state.running) break;

        // Seek: jump to the requested packet index
        if (state.seekIndex !== null) {
            i = state.seekIndex;
            state.seekIndex = null;
            if (i >= packets.length) break;
        }

        const packet = packets[i];

        // Wait until the playback clock reaches this packet's timestamp.
        // We poll in short intervals so pauses and seeks are responsive.
        while (!state.paused && state.seekIndex === null && state.running) {
            const remaining = packet.t - getPlaybackMs();
            if (remaining <= 0) break;
            await sleep(Math.max(1, Math.min(remaining / state.speed, 16)));
        }

        if (state.paused || state.seekIndex !== null || !state.running) continue;

        socket.send(Buffer.from(packet.d), 0, packet.d.length, targetPort, '127.0.0.1');
        i++;

        const now = Date.now();
        if (now - lastStatusAt > 100) { printStatus(); lastStatusAt = now; }
    }
}

// ── File loading ───────────────────────────────────────────────────────────────

async function loadPackets(file) {
    const readline = require('readline');
    const packets = [];
    let capturedAt = null;
    let count = 0;

    const rl = readline.createInterface({ input: fs.createReadStream(file), crlfDelay: Infinity });

    for await (const line of rl) {
        if (!line.trim()) continue;
        let obj;
        try { obj = JSON.parse(line); } catch { continue; }
        if (obj.type === 'header') { capturedAt = obj.capturedAt; continue; }
        packets.push(obj);
        if (++count % 50_000 === 0) process.stdout.write('.');
    }
    if (count >= 50_000) process.stdout.write('\n');

    return { packets, capturedAt };
}

// ── Main ───────────────────────────────────────────────────────────────────────

async function main() {
    console.log(`Loading ${path.basename(filePath)}...`);
    const { packets, capturedAt } = await loadPackets(filePath);

    if (packets.length === 0) {
        console.error('No packets found in recording.');
        process.exit(1);
    }

    totalDurationMs  = packets[packets.length - 1].t;
    state.speed      = initialSpeed;
    state.wallAtSync = Date.now();

    console.log(`  Captured : ${capturedAt || 'unknown'}`);
    console.log(`  Packets  : ${packets.length.toLocaleString()} over ${fmt(totalDurationMs)}`);
    console.log(`  Target   : localhost:${targetPort}${loop ? '  [loop]' : ''}`);
    console.log('');
    console.log('  Controls');
    console.log('    Space       Pause / Resume');
    console.log('    + / -       Speed up / Slow down  (0.25x steps)');
    console.log('    ← / →       Seek  ±30 seconds');
    console.log('    PgUp/PgDn   Seek  ±5 minutes');
    console.log('    q           Quit');
    console.log('');
    console.log('  Rewinding is only available while paused.');
    console.log('  After rewinding, refresh your overlays to avoid stale state.');
    console.log('');

    const socket = dgram.createSocket('udp4');
    setupKeyboard(packets);

    process.on('SIGINT', () => { state.running = false; });

    let iteration = 0;
    do {
        if (++iteration > 1) {
            state.playbackMs = 0;
            state.wallAtSync = Date.now();
            process.stdout.write(`\n\n  Loop ${iteration}...\n`);
        }
        await playback(packets, socket);
    } while (loop && state.running);

    process.stdout.write('\n\n  Playback complete.\n');
    if (process.stdin.isTTY) { process.stdin.setRawMode(false); process.stdin.pause(); }
    socket.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
