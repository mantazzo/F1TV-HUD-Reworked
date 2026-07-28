// Read-only Socket.IO client for inspecting live telemetry from an already-running
// F1TV HUD server (index.js), without touching or restarting anything — connects
// alongside your open overlays/Controller as just another passive client.
//
// CLI: node inspect-live.js [--port 3000] [--packet <id>] [--count <n>] [--field <path>]
//
// Examples:
//   node inspect-live.js --packet 2                     # log every Lap Data packet
//   node inspect-live.js --packet 1 --count 3            # log first 3 Session packets, then exit
//   node inspect-live.js --packet 2 --field m_lapData     # log just one field from each match

const { io } = require('socket.io-client');

const args = process.argv.slice(2);
const getArg = (name, def) => {
    const i = args.indexOf(`--${name}`);
    return i !== -1 ? args[i + 1] : def;
};

const port      = parseInt(getArg('port', '3000'));
const pidFilter = getArg('packet', null);
const maxCount  = parseInt(getArg('count', '0')); // 0 = unlimited, run until Ctrl+C
const fieldPath = getArg('field', null);

const socket = io(`http://localhost:${port}`, { transports: ['websocket'] });

let count = 0;
let printedConfig = false;

socket.on('connect', () => {
    console.log(`[inspect-live] connected to :${port} as ${socket.id}`);
    socket.emit('identify', 'inspect-live (diagnostic)');
});

socket.on('overlay_config', (cfg) => {
    if (printedConfig) return;
    printedConfig = true;
    console.log('[inspect-live] overlay_config:', JSON.stringify(cfg.overlays, null, 2));
});

socket.on('f1_data', (data) => {
    const pid = data?.m_header?.m_packetId;
    if (pid === undefined) return;
    if (pidFilter !== null && String(pid) !== pidFilter) return;

    const payload = fieldPath ? fieldPath.split('.').reduce((o, k) => o?.[k], data) : data;
    console.log(`[inspect-live] pid=${pid}`, JSON.stringify(payload));

    count++;
    if (maxCount > 0 && count >= maxCount) {
        socket.disconnect();
        process.exit(0);
    }
});

socket.on('connect_error', (err) => {
    console.error('[inspect-live] connect_error:', err.message);
    process.exit(1);
});
