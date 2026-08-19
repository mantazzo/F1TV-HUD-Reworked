/*
 * Used only as tauri.conf.json's beforeDevCommand.
 *
 * If a server is already answering on port 3000 (e.g. you started `node index.js`
 * yourself for live use, with your own game port and forwarding config), this does
 * nothing and lets `tauri dev` connect to that instead. Otherwise it falls back to
 * starting a disposable test-mode server, so `npm run tauri dev` on its own still
 * works as a quick one-command way to check things load in correctly.
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

function isServerRunning(callback) {
    const req = http.get({ host: 'localhost', port: 3000, path: '/', timeout: 1000 }, (res) => {
        res.resume();
        callback(true);
    });
    req.on('error', () => callback(false));
    req.on('timeout', () => {
        req.destroy();
        callback(false);
    });
}

isServerRunning((running) => {
    if (running) {
        console.log('[tauri dev] Server already running on port 3000 — connecting to it, not starting a new one.');
        process.exit(0);
        return;
    }

    console.log('[tauri dev] No server detected on port 3000 — starting one in test mode for quick iteration.');
    const child = spawn(process.execPath, [path.join(__dirname, 'index.js'), '--test'], { stdio: 'inherit' });
    child.on('exit', (code) => process.exit(code ?? 0));
});
