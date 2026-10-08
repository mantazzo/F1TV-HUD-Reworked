const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { F1TelemetryClient, constants } = require('@deltazeroproduction/f1-udp-parser');
const { PACKETS, DRIVERS, EVENT_CODES, WEATHER, INFRINGEMENTS } = constants;
const path = require('path');
const fs = require('fs');
const prompt = require('prompt');
const net = require('net');

// Network access: only this PC and devices on the local network (e.g. a phone on the same
// Wi-Fi) may use the overlays, Controller and socket.io. Anything else — a request that
// reached this PC from the internet via port forwarding/UPnP or a public IPv6 address —
// is refused. The address checked is the TCP connection's own source, which can't be
// faked through headers.
const LOCAL_NETWORKS = new net.BlockList();
LOCAL_NETWORKS.addSubnet('127.0.0.0', 8, 'ipv4');     // this PC (loopback)
LOCAL_NETWORKS.addSubnet('10.0.0.0', 8, 'ipv4');      // private ranges (home/office routers)
LOCAL_NETWORKS.addSubnet('172.16.0.0', 12, 'ipv4');
LOCAL_NETWORKS.addSubnet('192.168.0.0', 16, 'ipv4');
LOCAL_NETWORKS.addSubnet('169.254.0.0', 16, 'ipv4');  // link-local (direct cable, no DHCP)
LOCAL_NETWORKS.addAddress('::1', 'ipv6');             // this PC (loopback)
LOCAL_NETWORKS.addSubnet('fc00::', 7, 'ipv6');        // unique local addresses
LOCAL_NETWORKS.addSubnet('fe80::', 10, 'ipv6');       // link-local

function isLocalNetworkAddress(address) {
    if (typeof address !== 'string') return false;
    const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i); // IPv4 seen through an IPv6 socket
    if (mapped) return LOCAL_NETWORKS.check(mapped[1], 'ipv4');
    if (net.isIPv4(address)) return LOCAL_NETWORKS.check(address, 'ipv4');
    if (net.isIPv6(address)) return LOCAL_NETWORKS.check(address.replace(/%.*$/, ''), 'ipv6'); // drop zone id (fe80::1%eth0)
    return false;
}

// Logged once per address, not every request — a page load alone is dozens of requests
const refusedAddresses = new Set();
function refuseConnection(address, target) {
    if (refusedAddresses.has(address)) return;
    refusedAddresses.add(address);
    const time = new Date().toLocaleTimeString();
    console.error(`[${time}] Connection refused: ${address} tried to open ${target} — only this PC and the local network are allowed. (Further attempts from this address won't be logged.)`);
}

const app = express();
const server = http.createServer(app);
// socket.io accepts its connections before Express sees them, so it needs its own check
const io = socketIo(server, {
    allowRequest: (req, callback) => {
        const address = req.socket.remoteAddress;
        if (isLocalNetworkAddress(address)) return callback(null, true);
        refuseConnection(address, 'the live data connection (socket.io)');
        callback('Forbidden', false);
    }
});

// Registered before every other route/static mount, so nothing is served to other networks
app.use((req, res, next) => {
    const address = req.socket.remoteAddress;
    if (isLocalNetworkAddress(address)) return next();
    refuseConnection(address, req.originalUrl);
    res.status(403).send('Forbidden: F1TV HUD only accepts connections from this PC and the local network.');
});

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
    // TODO: Since the systems are expanding - need to update this default config in the future to represent the new options as well
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

// Custom (user-made) overlays — see views/custom/README.md.
// Each overlay declares its name, size and Controller controls in a JSON manifest
// (<script type="application/json" id="overlay-manifest">) inside its own HTML.
// Settings live in their own git-ignored file, keyed by overlay id, holding only the
// values changed from the manifest defaults: { "telemetry-example": { "visible": false } }
const CUSTOM_DIR = path.join(__dirname, 'views', 'custom');
const CUSTOM_CONFIG_PATH = path.join(__dirname, 'public', 'data', 'CustomOverlayConfig.json');
const CUSTOM_CONTROL_TYPES = ['toggle', 'select', 'buttons'];
const MANIFEST_REGEX = /<script[^>]*\bid\s*=\s*["']overlay-manifest["'][^>]*>([\s\S]*?)<\/script>/i;

function loadCustomOverlayConfig() {
    try {
        if (fs.existsSync(CUSTOM_CONFIG_PATH)) {
            return JSON.parse(fs.readFileSync(CUSTOM_CONFIG_PATH, 'utf8'));
        }
    } catch (err) {
        console.error('Error loading custom overlay config:', err);
    }
    return {};
}

function saveCustomOverlayConfig(config) {
    try {
        fs.writeFileSync(CUSTOM_CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (err) {
        console.error('Error saving custom overlay config:', err);
    }
}

let customOverlayConfig = loadCustomOverlayConfig();

// Keep only well-formed controls, so the Controller and the overlays can trust the shape
function normalizeManifest(id, raw) {
    const manifest = {
        name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : id,
        width: Number.isFinite(raw.width) && raw.width > 0 ? raw.width : null,
        height: Number.isFinite(raw.height) && raw.height > 0 ? raw.height : null,
        controls: []
    };
    const seen = new Set(['visible']); // reserved — every custom overlay gets a Visible toggle
    for (const control of Array.isArray(raw.controls) ? raw.controls : []) {
        if (!control || typeof control.id !== 'string' || seen.has(control.id)) continue;
        if (!CUSTOM_CONTROL_TYPES.includes(control.type)) continue;
        const label = typeof control.label === 'string' ? control.label : control.id;
        if (control.type === 'toggle') {
            manifest.controls.push({ id: control.id, type: 'toggle', label, default: control.default === true });
        } else {
            const options = (Array.isArray(control.options) ? control.options : [])
                .filter(o => o && (typeof o.value === 'string' || typeof o.value === 'number'))
                .map(o => ({ value: o.value, label: typeof o.label === 'string' ? o.label : String(o.value) }));
            if (options.length === 0) continue;
            const hasDefault = options.some(o => o.value === control.default);
            manifest.controls.push({ id: control.id, type: control.type, label, options, default: hasDefault ? control.default : options[0].value });
        }
        seen.add(control.id);
    }
    return manifest;
}

// Scan views/custom/ — "name.html" and "name/index.html" both become overlay "name".
// Read fresh on every call, so added/edited overlays show up without a restart.
// Only pages with a manifest are listed; a broken manifest is listed with its error.
function scanCustomOverlays() {
    const overlays = [];
    let entries = [];
    try {
        entries = fs.readdirSync(CUSTOM_DIR, { withFileTypes: true });
    } catch (err) {
        return overlays; // no views/custom/ folder
    }
    for (const entry of entries) {
        let id, file, url;
        if (entry.isFile() && entry.name.toLowerCase().endsWith('.html')) {
            id = entry.name.slice(0, -5);
            file = path.join(CUSTOM_DIR, entry.name);
            url = `/custom/${encodeURIComponent(id)}`;
        } else if (entry.isDirectory() && fs.existsSync(path.join(CUSTOM_DIR, entry.name, 'index.html'))) {
            id = entry.name;
            file = path.join(CUSTOM_DIR, entry.name, 'index.html');
            url = `/custom/${encodeURIComponent(id)}/`;
        } else {
            continue;
        }
        let html;
        try {
            html = fs.readFileSync(file, 'utf8');
        } catch (err) {
            continue;
        }
        const match = html.match(MANIFEST_REGEX);
        if (!match) continue;
        try {
            overlays.push({ id, url, ...normalizeManifest(id, JSON.parse(match[1])) });
        } catch (err) {
            overlays.push({ id, url, name: id, width: null, height: null, controls: [], error: `Invalid manifest JSON: ${err.message}` });
        }
    }
    return overlays.sort((a, b) => a.name.localeCompare(b.name));
}

// Check a Controller update against the overlay's own manifest before saving it
function isValidCustomUpdate(update) {
    if (!update || typeof update.overlay !== 'string' || typeof update.property !== 'string') return false;
    const overlay = scanCustomOverlays().find(o => o.id === update.overlay && !o.error);
    if (!overlay) return false;
    if (update.property === 'visible') return typeof update.value === 'boolean';
    const control = overlay.controls.find(c => c.id === update.property);
    if (!control) return false;
    if (control.type === 'toggle') return typeof update.value === 'boolean';
    return control.options.some(o => o.value === update.value);
}

// Desktop Mode layout management (Tauri launcher — saved window position/scale per overlay)
const DESKTOP_LAYOUTS_PATH = path.join(__dirname, 'public', 'data', 'DesktopModeSettings.json');

function loadDesktopLayouts() {
    try {
        if (fs.existsSync(DESKTOP_LAYOUTS_PATH)) {
            const data = fs.readFileSync(DESKTOP_LAYOUTS_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('Error loading desktop layouts:', err);
    }
    return { layouts: {} };
}

function saveDesktopLayouts(data) {
    try {
        fs.writeFileSync(DESKTOP_LAYOUTS_PATH, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error('Error saving desktop layouts:', err);
    }
}

let desktopLayouts = loadDesktopLayouts();

// Lite mode — a smaller "taster" package with only a few overlays (see lite/lite.json).
// The Lite build puts lite.json next to index.js, which switches Lite mode on; in the full
// project the same manifest can be tried out with --lite (or F1TV_LITE=1).
// Returns null when Lite mode is off.
const LITE_PATHS = [
    path.join(__dirname, 'lite.json'),
    ...(process.argv.includes('--lite') || process.env.F1TV_LITE === '1' ? [path.join(__dirname, 'lite', 'lite.json')] : [])
];

function loadLiteManifest() {
    const file = LITE_PATHS.find(p => fs.existsSync(p));
    if (!file) return null;
    try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        return {
            name: typeof raw.name === 'string' && raw.name.trim() ? raw.name.trim() : 'F1TV HUD Reworked Lite',
            overlays: Array.isArray(raw.overlays) ? raw.overlays.filter(id => typeof id === 'string') : [],
            fullVersionUrl: typeof raw.fullVersionUrl === 'string' ? raw.fullVersionUrl : 'https://github.com/mantazzo/F1TV-HUD-Reworked'
        };
    } catch (err) {
        console.error(`Error loading Lite manifest (${file}):`, err);
        return null;
    }
}

const liteManifest = loadLiteManifest();

// Prompt for port
// Recursively prompts for IP + port for each requested redirect
function collectForwardAddresses(total, collected, callback) {
    if (collected.length === total) {
        callback(collected);
        return;
    }
    const idx = collected.length + 1;
    prompt.get({
        properties: {
            ip: {
                description: `UDP Forwarding ${idx} of ${total} — IP address`,
                type: 'string',
                default: '127.0.0.1',
                required: true,
                pattern: /^(\d{1,3}\.){3}\d{1,3}$/,
                message: 'Must be a valid IPv4 address (e.g. 127.0.0.1)'
            },
            port: {
                description: `UDP Forwarding ${idx} of ${total} — Port`,
                type: 'integer',
                required: true
            }
        }
    }, (err, result) => {
        if (err) {
            console.error('Error getting forwarding address:', err);
            process.exit(1);
        }
        collected.push({ ip: result.ip, port: result.port });
        collectForwardAddresses(total, collected, callback);
    });
}

function startServer(portNumber, forwardAddresses) {
    // Set up F1 telemetry client
    const clientOptions = { port: portNumber };
    if (forwardAddresses.length > 0) {
        clientOptions.forwardAddresses = forwardAddresses;
        console.log(`UDP Forwarding active — forwarding to: ${forwardAddresses.map(a => `${a.ip}:${a.port}`).join(', ')}`);
    }
    const client = new F1TelemetryClient(clientOptions);

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
        // socket.emit('penalties_data', PENALTIES); // We don't need it in the end, but keeping this in case it's useful later
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

        // Custom overlay settings — separate event/file from the built-in overlay config
        socket.emit('custom_overlay_config', customOverlayConfig);

        socket.on('custom_config_update', (update) => {
            if (!isValidCustomUpdate(update)) return;
            customOverlayConfig[update.overlay] = customOverlayConfig[update.overlay] || {};
            customOverlayConfig[update.overlay][update.property] = update.value;
            saveCustomOverlayConfig(customOverlayConfig);
            io.emit('custom_overlay_config', customOverlayConfig);
            console.log(`Custom config updated: ${update.overlay}.${update.property} = ${update.value}`);
        });

        // Desktop (Tauri) overlay rescaling — ephemeral, not persisted to OverlayConfig.json
        socket.on('set_scale', (data) => {
            if (data && data.overlay && typeof data.scale === 'number') {
                io.emit('set_scale', data);
            }
        });

        // Desktop (Tauri) reposition mode — shows a placeholder border for overlays
        // that are otherwise invisible until a game event triggers them. Ephemeral.
        socket.on('set_reposition_mode', (data) => {
            if (data && data.overlay && typeof data.active === 'boolean') {
                io.emit('set_reposition_mode', data);
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

    // Listen for Motion packets (ID 0)
    // Uncomment later if necessary - might be useful if you want to display G-forces, for example
    /* client.on(PACKETS.motion, (data) => {
        io.emit('f1_data', convertBigInt(data));
    }); */

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

    // Listen for Participants packets (ID 4)
    client.on(PACKETS.participants, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Car Setups packets (ID 5)
    // Uncomment later if necessary (if you want to display car setup information, or use it for some calculations related to the car performance or something like that)
    /* client.on(PACKETS.carSetups, (data) => {
        io.emit('f1_data', convertBigInt(data));
    }); */

    // Listen for Car Telemetry packets (ID 6)
    client.on(PACKETS.carTelemetry, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Car Status packets (ID 7)
    client.on(PACKETS.carStatus, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Final Classification packets (ID 8)
    // Uncomment later if necessary (if you need it for final classification table or something similar, or perhaps if you're just testing the packet for development purposes)
    /* client.on(PACKETS.finalClassification, (data) => {
        io.emit('f1_data', convertBigInt(data));
    }); */

    // Listen for Lobby Info packets (ID 9)
    client.on(PACKETS.lobbyInfo, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Car Damage packets (ID 10)
    client.on(PACKETS.carDamage, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Session History packets (ID 11)
    client.on(PACKETS.sessionHistory, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Tyre Sets packets (ID 12)
    // Uncomment later if necessary (for example, you have an overlay to display the information about the tyre sets available, remaining or being used by each driver)
    /* client.on(PACKETS.tyreSets, (data) => {
        io.emit('f1_data', convertBigInt(data));
    }); */

    // Listen for Motion Ex packets (ID 13)
    // Uncomment later if necessary (if you have any use to display all of these extra motion parameters)
    /* client.on(PACKETS.motionEx, (data) => {
        io.emit('f1_data', convertBigInt(data));
    }); */

    // Listen for Time Trial packets (ID 14)
    client.on(PACKETS.timeTrial, (data) => {
        io.emit('f1_data', convertBigInt(data));
    });

    // Listen for Lap Position packets (ID 15)
    // Uncomment later if necessary (might be useful for something like a session history, displaying driver positions for each lap)
    /* client.on(PACKETS.lapPositions, (data) => {
        io.emit('f1_data', convertBigInt(data));
    }); */

    // Listen for Car Telemetry 2 packets (ID 16)
    // 2026 Season Pack only — carries per-car Active Aero / Overtake Mode state
    client.on(PACKETS.carTelemetry2, (data) => {
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

    // Serve static files (images, CSS, fonts...)
    app.use(express.static(path.join(__dirname, 'public')));
    app.use('/images', express.static(path.join(__dirname, 'images')));
    app.use(express.json());

    // Desktop Mode layouts (Tauri launcher only — saved window position/scale per overlay).
    // Five slots ("1"-"5"), each { name, savedAt, overlays }. A slot can exist with only a
    // custom name (renamed before anything was saved into it) — overlays is then empty.
    const LAYOUT_SLOTS = ['1', '2', '3', '4', '5'];
    const LAYOUT_NAME_MAX = 24;
    const isValidSlot = (slot) => LAYOUT_SLOTS.includes(slot);

    // Summary of every slot for the Launcher's picker (no overlay positions)
    app.get('/api/desktop-layouts', (req, res) => {
        const summary = {};
        for (const slot of LAYOUT_SLOTS) {
            const layout = desktopLayouts.layouts[slot];
            summary[slot] = {
                name: layout?.name || null,
                savedAt: layout?.savedAt || null,
                hasData: !!layout?.overlays && Object.keys(layout.overlays).length > 0
            };
        }
        res.json(summary);
    });

    app.get('/api/desktop-layouts/:slot', (req, res) => {
        if (!isValidSlot(req.params.slot)) return res.status(400).json(null);
        const layout = desktopLayouts.layouts[req.params.slot];
        if (!layout) return res.status(404).json(null);
        res.json(layout);
    });

    app.post('/api/desktop-layouts/:slot', (req, res) => {
        if (!isValidSlot(req.params.slot)) return res.status(400).json({ success: false });
        desktopLayouts.layouts[req.params.slot] = req.body;
        saveDesktopLayouts(desktopLayouts);
        res.json({ success: true });
    });

    // Clear a slot completely (saved positions + custom name) — back to an empty "Layout N"
    app.delete('/api/desktop-layouts/:slot', (req, res) => {
        if (!isValidSlot(req.params.slot)) return res.status(400).json({ success: false });
        delete desktopLayouts.layouts[req.params.slot];
        saveDesktopLayouts(desktopLayouts);
        res.json({ success: true });
    });

    // Rename a slot. An empty name resets it to the default "Layout N" (name removed).
    app.post('/api/desktop-layouts/:slot/name', (req, res) => {
        const { slot } = req.params;
        if (!isValidSlot(slot)) return res.status(400).json({ success: false });
        const name = String(req.body?.name ?? '').trim().slice(0, LAYOUT_NAME_MAX);
        const layout = desktopLayouts.layouts[slot] || { overlays: {} };
        if (name) layout.name = name;
        else delete layout.name;
        desktopLayouts.layouts[slot] = layout;
        saveDesktopLayouts(desktopLayouts);
        res.json({ success: true, name: layout.name || null });
    });

    // Custom overlays found in views/custom/ (manifest only — name, size, controls)
    app.get('/api/custom-overlays', (req, res) => res.json(scanCustomOverlays()));

    // Lite mode status for the Launcher and Controller: { lite: false } in the full version,
    // otherwise the manifest (name, included overlay ids, link to the full version)
    app.get('/api/lite', (req, res) => res.json(liteManifest ? { lite: true, ...liteManifest } : { lite: false }));

    // Overlays (route id = file name in views/, without .html)
    const OVERLAY_ROUTES = [
        'car-damage',           // Car Damage overlay
        'speedometer',          // Speedometer overlay
        'lap-timer',            // Lap Timer overlay
        'pit-timer',            // Pit Timer overlay
        'pit-window',           // Pit Window overlay
        'live-speed',           // Live Speed overlay
        'fastest-lap',          // Fastest Lap overlay
        'weather',              // Weather overlay (incl. forecast)
        'turn-indicator',       // Turn Indicator overlay
        'fastest-sectors',      // Fastest Sectors overlay
        'message-box',          // Message Box overlay (known as FIA Stewards previously)
        'mini-leaderboard',     // Mini Leaderboard overlay
        'session-info',         // Session Info overlay
        'driver-name',          // Driver Name overlay
        'leaderboard',          // Leaderboard overlay (Initials version)
        'leaderboard-lastname'  // Leaderboard overlay (Last Name version)
    ];
    // In Lite mode only the overlays listed in the manifest get a route
    const servedOverlays = liteManifest ? OVERLAY_ROUTES.filter(id => liteManifest.overlays.includes(id)) : OVERLAY_ROUTES;
    for (const id of servedOverlays) {
        app.get(`/${id}`, (req, res) => res.sendFile(path.join(__dirname, 'views', `${id}.html`)));
    }

    // Controllers
    app.get('/controller/controller-extended', (req, res) => res.sendFile(path.join(__dirname, 'views', 'controller', 'controller-extended.html')));

    // Desktop (Tauri) launcher — opens/closes individual overlay windows
    app.get('/launcher', (req, res) => res.sendFile(path.join(__dirname, 'views', 'launcher.html')));

    // Debug pages aren't part of the Lite package — answer 404 before any route below is reached
    if (liteManifest) app.use('/debug', (req, res) => res.status(404).send('Debug pages are only available in the full version.'));

    // Debug overlays
    app.get('/debug/position-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'position-debug.html')));

    // UDP Debug pages
    // Only really useful for analyzing raw packet data and verifying if the parser is working correctly, but can be helpful for troubleshooting and development purposes
    app.get('/debug/header-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'header-debug.html')));                     // Header (sent by any packet)
    app.get('/debug/session-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'session-debug.html')));                   // Session packet (ID 1)
    app.get('/debug/lap-data-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'lap-data-debug.html')));                 // Lap Data packet (ID 2)
    app.get('/debug/event-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'event-debug.html')));                       // Event packet (ID 3)
    app.get('/debug/participants-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'participants-debug.html')));         // Participants packet (ID 4)
    app.get('/debug/car-telemetry-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'car-telemetry-debug.html')));       // Car Telemetry packet (ID 6)
    app.get('/debug/car-status-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'car-status-debug.html')));             // Car Status packet (ID 7)
    app.get('/debug/lobby-info-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'lobby-info-debug.html')));             // Lobby Info packet (ID 9)
    app.get('/debug/car-damage-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'car-damage-debug.html')));             // Car Damage packet (ID 10)
    app.get('/debug/session-history-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'session-history-debug.html')));   // Session History packet (ID 11)
    app.get('/debug/time-trial-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'time-trial-debug.html')));             // Time Trial packet (ID 14)
    app.get('/debug/car-telemetry-2-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'car-telemetry-2-debug.html')));   // Car Telemetry 2 packet (ID 16, 2026 Season Pack only)

    // Other Debug pages
    app.get('/debug/fonts-debug', (req, res) => res.sendFile(path.join(__dirname, 'views', 'debug', 'fonts-debug.html'))); // A page to test the fonts
    
    // Custom (user-made) overlays: any file dropped into views/custom/ is served under /custom.
    // /custom/my-overlay serves views/custom/my-overlay.html (the .html extension is optional), and
    // /custom/my-overlay/ serves views/custom/my-overlay/index.html, so an overlay can also be a folder
    // with its own CSS/images next to it. Served live - new files work without a restart.
    // See views/custom/README.md for how to write one.
    app.use('/custom', express.static(path.join(__dirname, 'views', 'custom'), { extensions: ['html'] }));

    // Default to speedometer overlay (for now) — or the first included overlay in Lite mode
    const defaultOverlay = servedOverlays.includes('speedometer') ? 'speedometer' : servedOverlays[0];
    if (defaultOverlay) app.get('/', (req, res) => res.redirect(`/${defaultOverlay}`));

    if (liteManifest) console.log(`${liteManifest.name} — included overlays: ${servedOverlays.join(', ') || 'none'}. Full version: ${liteManifest.fullVersionUrl}`);
    server.listen(3000, () => console.log('Overlays running at http://localhost:3000/ (For example, http://localhost:3000/speedometer) \nController (for various overlays) available at [http://localhost:3000/controller/controller-extended] \n\n**Reminder** - you can press Ctrl+C to stop the system manually.'));
}

// ── Startup prompt chain ──────────────────────────────────────────────────────
const TEST_MODE = process.argv.includes('--test') || process.env.F1TV_TEST_MODE === '1';

if (TEST_MODE) {
    const testPort = parseInt(process.env.F1TV_TEST_PORT, 10) || 20799;
    console.log(`Test mode active — skipping startup prompts, using port ${testPort} for telemetry.`);
    startServer(testPort, []);
} else {
    prompt.start();

    prompt.get({
        properties: {
            port: {
                description: 'Please enter the Game Port that you want to use',
                type: 'integer',
                default: 20777,
                required: false
            }
        }
    }, (err, result) => {
        if (err) {
            console.error('Error getting port:', err);
            process.exit(1);
        }
        const portNumber = result.port || 20777;
        console.log(`Using port ${portNumber} for telemetry`);

        prompt.get({
            properties: {
                setupForwarding: {
                    description: 'Set up UDP Forwarding? (y/n)',
                    type: 'string',
                    default: 'n',
                    pattern: /^[yYnN]$/,
                    message: 'Please enter y or n',
                    required: false
                }
            }
        }, (err, result) => {
            if (err) {
                console.error('Error during forwarding prompt:', err);
                process.exit(1);
            }

            if ((result.setupForwarding || 'n').toLowerCase() !== 'y') {
                startServer(portNumber, []);
                return;
            }

            prompt.get({
                properties: {
                    count: {
                        description: 'How many forwarding targets?',
                        type: 'integer',
                        default: 1,
                        minimum: 1,
                        required: true
                    }
                }
            }, (err, result) => {
                if (err) {
                    console.error('Error getting forwarding count:', err);
                    process.exit(1);
                }
                collectForwardAddresses(result.count || 1, [], (addresses) => {
                    startServer(portNumber, addresses);
                });
            });
        });
    });
}