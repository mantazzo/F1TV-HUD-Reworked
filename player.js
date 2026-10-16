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

const flagsWithValues = ['--port', '--speed', '--start', '--control'];
const recordingArg = args.find((a, i) => !a.startsWith('--') && !flagsWithValues.includes(args[i - 1])) || null;
let targetPort   = parseInt(getFlag('--port', '20777'));
let initialSpeed = parseFloat(getFlag('--speed', '1.0'));
let loop         = args.includes('--loop');
const controlPort = args.includes('--control') ? parseInt(getFlag('--control', '')) : null;

let startMs = 0;
if (args.includes('--start')) {
    startMs = parseTime(getFlag('--start', ''));
    if (startMs === null) { console.error('Invalid --start time. Use mm:ss, h:mm:ss or seconds.'); process.exit(1); }
}
if (controlPort !== null && !(controlPort > 0 && controlPort < 65536)) {
    console.error('Invalid --control port.');
    process.exit(1);
}

// Interactive mode: picks the recording from a numbered list (unless one was given,
// e.g. dropped onto play.bat) and asks for anything not set by a flag. Used by play.bat
// via --interactive, and also when started with no recording in a terminal.
const interactive = process.stdin.isTTY && (args.includes('--interactive') || !recordingArg);

if (!recordingArg && !interactive) { printUsage(); process.exit(1); }

let filePath = null;
if (recordingArg) {
    filePath = fs.existsSync(recordingArg)
        ? recordingArg
        : path.join(RECORDINGS_DIR, recordingArg);

    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        printUsage();
        process.exit(1);
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const sleep = ms => new Promise(r => setTimeout(r, ms));

function fmt(ms) {
    const s = Math.floor(Math.abs(ms) / 1000);
    const m = Math.floor(s / 60).toString().padStart(2, '0');
    return `${m}:${(s % 60).toString().padStart(2, '0')}`;
}

// "mm:ss", "h:mm:ss" or plain seconds ("90", "12.5") → ms. null if it doesn't parse.
// Minutes may exceed 59 ("75:00"), matching how fmt() prints long recordings.
function parseTime(text) {
    if (typeof text !== 'string' || !text.trim()) return null;
    const parts = text.trim().split(':');
    if (parts.length > 3 || !parts.every(p => /^\d+(\.\d+)?$/.test(p))) return null;
    const seconds = parts.reduce((total, p) => total * 60 + Number(p), 0);
    return Math.round(seconds * 1000);
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
    console.log('Usage: node player.js <recording> [--port 20777] [--speed 1.0] [--start mm:ss] [--loop] [--control <port>] [--interactive]');
    console.log('');
    console.log('  <recording>     .jsonl file path, or filename only if inside recordings/');
    console.log('  --port          Port the main server is listening on (default: 20777)');
    console.log('  --speed         Initial playback speed multiplier, e.g. 2.0 (default: 1.0)');
    console.log('  --start         Start partway in: mm:ss, h:mm:ss or seconds (default: 0:00)');
    console.log('  --loop          Restart from the beginning when playback finishes');
    console.log('  --control       Accept remote control over HTTP on this port (127.0.0.1 only)');
    console.log('                  e.g. curl -X POST "localhost:20800/seek?to=12:00" — see /help');
    console.log('  --interactive   Ask for the recording and any option not given above');
    console.log('                  (also the default when no recording is given in a terminal)');
    console.log('');
    listRecordings();
}

function formatSize(bytes) {
    if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
    if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
}

// Numbered recording picker + playback options, for interactive mode
async function askInteractiveOptions() {
    const { askValue, parsePort, parseYesNo } = require('./cli-prompt');

    if (!filePath) {
        const files = fs.existsSync(RECORDINGS_DIR)
            ? fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.jsonl')).sort()
            : [];
        if (files.length === 0) {
            console.log('No recordings found in recordings/ — record one first (record.bat / node recorder.js).');
            process.exit(1);
        }
        console.log('Available recordings:');
        const width = String(files.length).length;
        files.forEach((f, i) => {
            const stat = fs.statSync(path.join(RECORDINGS_DIR, f));
            const date = stat.mtime.toISOString().slice(0, 10);
            console.log(`  ${String(i + 1).padStart(width)}) ${f}  (${formatSize(stat.size)}, ${date})`);
        });
        console.log('');
        const pick = await askValue(`Pick a recording (1-${files.length}): `, null, text => {
            const n = Number(text);
            return Number.isInteger(n) && n >= 1 && n <= files.length ? n : undefined;
        });
        if (pick === null) { console.log('No recording picked.'); process.exit(1); }
        filePath = path.join(RECORDINGS_DIR, files[pick - 1]);
    } else {
        console.log(`Recording: ${path.basename(filePath)}`);
    }

    console.log('Press Enter to use the default.');
    if (!args.includes('--port')) {
        targetPort = await askValue(`Port the overlay server listens on (Enter = ${targetPort}): `, targetPort, parsePort);
    }
    if (!args.includes('--speed')) {
        initialSpeed = await askValue(`Playback speed, 0.25-8 (Enter = ${initialSpeed}x): `, initialSpeed, text => {
            const v = Number(text);
            return v >= SPEED_MIN && v <= SPEED_MAX ? v : undefined;
        });
    }
    if (!args.includes('--loop')) {
        loop = await askValue('Loop when it reaches the end? (y/N): ', false, parseYesNo);
    }
    console.log('');
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
    seekIndex:  null,       // set by seekTo() to jump to a packet index
    loading:    false,      // a recording is being read from disk
    pendingLoad: null,      // { file, startMs } — set by the remote /load, handled by main()
};

// The loaded recording — replaced when the remote control loads another one
let packets  = [];
let iteration = 0;

// Moves the playback cursor (clamped to the recording). Works while playing or paused:
// the playback loop picks up seekIndex on its next pass.
function seekTo(ms) {
    if (packets.length === 0) return;
    state.playbackMs = Math.max(0, Math.min(ms, packets[packets.length - 1].t));
    state.wallAtSync = Date.now();
    state.seekIndex  = findIndexAtTime(packets, state.playbackMs);
}

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
    // The status line redraws itself with \r — only useful in a terminal. Run in the
    // background (e.g. under --control), it would just flood the log.
    if (!process.stdout.isTTY) return;
    const pos   = getPlaybackMs();
    const label = state.paused ? '[PAUSED] ' : '[PLAYING]';
    const spd   = Number.isInteger(state.speed) ? `${state.speed}.0x` : `${state.speed}x`;
    process.stdout.write(`\r\x1b[2K  ${label}  ${fmt(pos)} / ${fmt(totalDurationMs)}  ${spd}`);
}

function printMessage(msg) {
    // Step down to a fresh line so the message doesn't overwrite the status.
    process.stdout.write(process.stdout.isTTY ? `\n         ${msg}\n` : `${msg}\n`);
}

// ── Keyboard handler ───────────────────────────────────────────────────────────

function setupKeyboard() {
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
            seekTo(getPlaybackMs() + (pgDown ? SEEK_BIG_MS : SEEK_STEP_MS));
            printStatus();
            return;
        }

        if (left || pgUp) {
            if (!state.paused) {
                printMessage('Pause first (Space) before rewinding.');
                return;
            }
            seekTo(state.playbackMs - (pgUp ? SEEK_BIG_MS : SEEK_STEP_MS));
            printMessage('Rewound — refresh your overlays to avoid any stale state.');
            printStatus();
            return;
        }
    });
}

// ── Remote control (--control <port>) ──────────────────────────────────────────
//
// A small HTTP API so scripts (or Claude) can drive playback without a terminal:
//   GET  /status                       position, duration, speed, paused, recording
//   GET  /recordings                   .jsonl files in recordings/
//   POST /pause   POST /resume
//   POST /speed?x=4                    0.25 – 8
//   POST /seek?to=12:00   /seek?by=-30 absolute (mm:ss / h:mm:ss / seconds) or relative seconds
//   POST /load?file=name.jsonl[&start=mm:ss]   switch recordings (recordings/ only)
//   POST /quit
// Bound to 127.0.0.1 only. Requests carrying an Origin header (i.e. from a web page) are
// refused, so a website can't drive the player in the background.

const CONTROL_HELP = [
    'GET  /status',
    'GET  /recordings',
    'POST /pause | /resume | /quit',
    'POST /speed?x=4',
    'POST /seek?to=12:00   or   /seek?by=-30',
    'POST /load?file=<name>.jsonl[&start=mm:ss]'
];

function listRecordingFiles() {
    if (!fs.existsSync(RECORDINGS_DIR)) return [];
    return fs.readdirSync(RECORDINGS_DIR).filter(f => f.endsWith('.jsonl')).sort()
        .map(name => ({ name, size: formatSize(fs.statSync(path.join(RECORDINGS_DIR, name)).size) }));
}

function playerStatus() {
    const pos = packets.length ? getPlaybackMs() : 0;
    return {
        recording:  filePath ? path.basename(filePath) : null,
        loading:    state.loading || !!state.pendingLoad,
        paused:     state.paused,
        speed:      state.speed,
        loop,
        position:   fmt(Math.min(pos, totalDurationMs)),
        positionMs: Math.round(Math.min(pos, totalDurationMs)),
        duration:   fmt(totalDurationMs),
        durationMs: totalDurationMs,
        target:     `127.0.0.1:${targetPort}`
    };
}

// Returns [httpStatus, body]. Everything here only touches `state` — the playback loop
// picks the changes up on its next pass.
function handleControl(method, route, query) {
    if (method === 'GET' && route === '/status')     return [200, playerStatus()];
    if (method === 'GET' && route === '/recordings') return [200, listRecordingFiles()];
    if (method === 'GET' && (route === '/' || route === '/help')) return [200, { endpoints: CONTROL_HELP }];
    if (method !== 'POST') return [405, { error: 'Use POST for this endpoint', endpoints: CONTROL_HELP }];

    switch (route) {
        case '/pause':
            setPaused(true);
            return [200, playerStatus()];
        case '/resume':
            setPaused(false);
            return [200, playerStatus()];
        case '/speed': {
            const x = Number(query.get('x'));
            if (!(x >= SPEED_MIN && x <= SPEED_MAX)) return [400, { error: `x must be ${SPEED_MIN}–${SPEED_MAX}` }];
            setSpeed(x);
            return [200, playerStatus()];
        }
        case '/seek': {
            if (packets.length === 0) return [409, { error: 'Nothing loaded yet' }];
            let target;
            if (query.has('to')) {
                target = parseTime(query.get('to'));
            } else if (query.has('by')) {
                const by = Number(query.get('by'));
                target = Number.isFinite(by) ? getPlaybackMs() + by * 1000 : null;
            }
            if (target === null || target === undefined) return [400, { error: 'Use ?to=mm:ss or ?by=±seconds' }];
            const backwards = target < getPlaybackMs();
            seekTo(target);
            printMessage(`Remote: seek to ${fmt(state.playbackMs)}`);
            const body = playerStatus();
            if (backwards) body.note = 'Rewound — refresh your overlays to avoid stale state.';
            return [200, body];
        }
        case '/load': {
            // Names only, from recordings/ — no paths, so the API can't be pointed at other files
            const name = query.get('file') || '';
            if (!name.endsWith('.jsonl') || path.basename(name) !== name) return [400, { error: 'file must be a .jsonl name from /recordings' }];
            const file = path.join(RECORDINGS_DIR, name);
            if (!fs.existsSync(file)) return [404, { error: `Not found in recordings/: ${name}` }];
            const startAt = query.has('start') ? parseTime(query.get('start')) : 0;
            if (startAt === null) return [400, { error: 'start must be mm:ss, h:mm:ss or seconds' }];
            if (state.loading) return [409, { error: 'Already loading a recording' }];
            state.pendingLoad = { file, startMs: startAt };
            printMessage(`Remote: load ${name}${startAt ? ` at ${fmt(startAt)}` : ''}`);
            return [202, { loading: name, note: 'Poll /status until loading is false — big recordings take a while.' }];
        }
        case '/quit':
            state.running = false;
            return [200, { quitting: true }];
        default:
            return [404, { error: `Unknown endpoint ${route}`, endpoints: CONTROL_HELP }];
    }
}

function startControlServer(port) {
    const http = require('http');
    const server = http.createServer((req, res) => {
        const send = (status, body) => {
            res.writeHead(status, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(body, null, 2) + '\n');
        };
        if (req.headers.origin) return send(403, { error: 'Requests from web pages are not allowed' });
        const url = new URL(req.url, 'http://127.0.0.1');
        try {
            send(...handleControl(req.method, url.pathname.replace(/\/+$/, '') || '/', url.searchParams));
        } catch (err) {
            send(500, { error: err.message });
        }
    });
    server.on('error', err => {
        console.error(`Remote control unavailable on port ${port}: ${err.message}`);
    });
    server.listen(port, '127.0.0.1', () => {
        console.log(`  Remote   : http://127.0.0.1:${port}  (GET /help for the endpoints)`);
        console.log('');
    });
}

// ── Playback loop ──────────────────────────────────────────────────────────────

async function playback(socket) {
    let i = 0;
    let lastStatusAt = 0;

    while (i < packets.length && state.running && !state.pendingLoad) {

        // Pause: spin until resumed, stopped or another recording is requested
        while (state.paused && state.running && !state.pendingLoad) {
            const now = Date.now();
            if (now - lastStatusAt > 100) { printStatus(); lastStatusAt = now; }
            await sleep(30);
        }
        if (!state.running || state.pendingLoad) break;

        // Seek: jump to the requested packet index
        if (state.seekIndex !== null) {
            i = state.seekIndex;
            state.seekIndex = null;
            if (i >= packets.length) break;
        }

        const packet = packets[i];

        // Wait until the playback clock reaches this packet's timestamp.
        // We poll in short intervals so pauses and seeks are responsive.
        while (!state.paused && state.seekIndex === null && state.running && !state.pendingLoad) {
            const remaining = packet.t - getPlaybackMs();
            if (remaining <= 0) break;
            await sleep(Math.max(1, Math.min(remaining / state.speed, 16)));
        }

        if (state.paused || state.seekIndex !== null || !state.running || state.pendingLoad) continue;

        socket.send(packet.d, 0, packet.d.length, targetPort, '127.0.0.1');
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
        packets.push({ t: obj.t, d: Buffer.from(obj.d) });
        if (++count % 50_000 === 0) process.stdout.write('.');
    }
    if (count >= 50_000) process.stdout.write('\n');

    return { packets, capturedAt };
}

// ── Main ───────────────────────────────────────────────────────────────────────

// Reads a recording and makes it the current one, starting at startAt (ms). Returns false
// (keeping whatever was loaded before) if the file has no packets.
async function loadRecording(file, startAt) {
    state.loading = true;
    console.log(`Loading ${path.basename(file)}...`);
    const loaded = await loadPackets(file);
    state.loading = false;

    if (loaded.packets.length === 0) {
        console.error(`No packets found in ${path.basename(file)}.`);
        return false;
    }

    packets         = loaded.packets;
    filePath        = file;
    totalDurationMs = packets[packets.length - 1].t;
    iteration       = 0;
    seekTo(startAt);

    console.log(`  Captured : ${loaded.capturedAt || 'unknown'}`);
    console.log(`  Packets  : ${packets.length.toLocaleString()} over ${fmt(totalDurationMs)}`);
    console.log(`  Target   : localhost:${targetPort}${loop ? '  [loop]' : ''}`);
    if (startAt > 0) console.log(`  Start    : ${fmt(state.playbackMs)}`);
    console.log('');
    return true;
}

async function main() {
    if (interactive) await askInteractiveOptions();

    state.speed = initialSpeed;
    if (!await loadRecording(filePath, startMs)) process.exit(1);

    if (controlPort !== null) startControlServer(controlPort);

    if (process.stdin.isTTY) { // keyboard controls only exist in a terminal
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
    }

    const socket = dgram.createSocket('udp4');
    setupKeyboard();

    process.on('SIGINT', () => { state.running = false; });

    while (state.running) {
        do {
            if (++iteration > 1) {
                state.playbackMs = 0;
                state.wallAtSync = Date.now();
                process.stdout.write(`\n\n  Loop ${iteration}...\n`);
            }
            await playback(socket);
        } while (loop && state.running && !state.pendingLoad);

        // Remote /load: switch recordings and keep going. The old one is released first —
        // two big recordings in memory at once could run the process out of heap.
        if (state.pendingLoad && state.running) {
            const { file, startMs: startAt } = state.pendingLoad;
            state.pendingLoad = null;
            packets = [];
            totalDurationMs = 0;
            if (!await loadRecording(file, startAt)) {
                filePath = null;
                printMessage('Load failed — nothing is loaded now. Use /load to pick another recording.');
            }
            continue;
        }

        // Finished (no loop). Under remote control, stay alive so it can seek or load again.
        if (controlPort === null || !state.running) break;
        printMessage('Reached the end — waiting for remote control (seek, load or quit).');
        setPaused(true);
        while (state.running && state.paused && state.seekIndex === null && !state.pendingLoad) await sleep(100);
        if (state.seekIndex === null && !state.pendingLoad) seekTo(state.playbackMs); // resumed at the end
        iteration = 0;
    }

    process.stdout.write('\n\n  Playback complete.\n');
    if (process.stdin.isTTY) { process.stdin.setRawMode(false); process.stdin.pause(); }
    socket.close();
    process.exit(0);
}

main().catch(err => {
    console.error('Error:', err.message);
    process.exit(1);
});
