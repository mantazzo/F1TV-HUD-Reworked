// Builds the Lite package — a small "taster" version with only the overlays listed in lite/lite.json.
// Output: dist/F1TV-HUD-Reworked-Lite-v<version>/ and a .zip of it next to the folder.
//
// Usage: npm run build:lite   (or: node lite/build-lite.js)
//
// Only files tracked by git are packaged, so local-only files (recordings, test images, untracked
// fonts, CustomOverlayConfig.json...) never end up in the zip. Changes to tracked files are picked
// up as they are in the working tree, without needing a commit first.
// Desktop Mode exe is the one exception: it's a build output, copied from src-tauri/target/release/.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const lite = JSON.parse(fs.readFileSync(path.join(__dirname, 'lite.json'), 'utf8'));
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const PACKAGE_NAME = `F1TV-HUD-Reworked-Lite-v${pkg.version}`;
const DIST_DIR = path.join(ROOT, 'dist');
const OUT_DIR = path.join(DIST_DIR, PACKAGE_NAME);
const ZIP_PATH = path.join(DIST_DIR, `${PACKAGE_NAME}.zip`);
const EXE_NAME = 'F1TVHUDReworked_DesktopMode.exe';
const EXE_PATH = path.join(ROOT, 'src-tauri', 'target', 'release', EXE_NAME);

// Images each overlay needs (folders under images/), found by checking the overlay's HTML/CSS
// and the shared utils. Add an entry here when adding an overlay to lite.json.
const OVERLAY_IMAGES = {
    'leaderboard': ['leaderboard', 'team-logos', 'common', 'driver-numbers'],
    'lap-timer': ['lap-timer', 'team-logos', 'other-logos', 'common'],
    'speedometer': ['speedometer']
};
// Data files an overlay needs on top of the shared ones (public/data/)
const OVERLAY_DATA = {
    'leaderboard': ['DriverStandings.json', 'ConstructorStandings.json']
};
// Controller hint images (images/help/) for each overlay, by file name prefix — images of overlays
// that aren't included would never be shown. Add an entry here when adding an overlay to lite.json.
const OVERLAY_HELP_IMAGES = {
    'leaderboard': ['leaderboard-'],
    'speedometer': ['speedometer-']
};

// Everything the Lite package needs: files, folders (copied with all their tracked files),
// or a "prefix*" entry for every tracked file whose path starts with that prefix
const INCLUDE = [
    // Server + scripts
    'index.js', 'LICENSE', 'ASSETS_LICENSE.md',
    'install.ps1', 'install.bat', 'run.ps1', 'run.bat',
    'package-lock.json', 'vendor/f1-udp-parser',
    // Launcher, Controller, custom overlay support
    'views/launcher.html', 'views/controller', 'views/custom',
    'public/styles-launcher.css', 'public/styles-controller.css', 'public/styles-tauri-overlay.css',
    'public/fonts.css', 'public/fonts', 'public/utils',
    'public/data/DefaultTeams.json', 'public/data/CustomF1Drivers.json', 'public/data/CustomF2Drivers.json',
    'images/favicon.ico', 'images/logo.png',
    // The included overlays
    ...lite.overlays.flatMap(id => [
        `views/${id}.html`,
        `public/styles-${id}.css`,
        ...(OVERLAY_IMAGES[id] || []).map(dir => `images/${dir}`),
        ...(OVERLAY_DATA[id] || []).map(file => `public/data/${file}`),
        ...(OVERLAY_HELP_IMAGES[id] || []).map(prefix => `images/help/${prefix}*`)
    ])
];
const matchesEntry = (file, entry) => entry.endsWith('*')
    ? file.startsWith(entry.slice(0, -1))
    : file === entry || file.startsWith(`${entry}/`);
// Optional entries — not tracked in every checkout, so a missing one is only a note, not a warning
const OPTIONAL = new Set(['public/data/CustomF2Drivers.json']);

function trackedFiles() {
    const out = execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    return out.split('\0').filter(Boolean);
}

function copyFile(relPath) {
    const target = path.join(OUT_DIR, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(path.join(ROOT, relPath), target);
}

function writeFile(relPath, contents) {
    const target = path.join(OUT_DIR, relPath);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, contents);
}

// Same shape as the full package.json, minus the dev tooling (Tauri, recorder/player).
// The UDP parser is installed from vendor/f1-udp-parser (a file: dependency), so no install scripts are needed.
function litePackageJson() {
    return {
        name: `${pkg.name}-lite`,
        version: pkg.version,
        description: `${pkg.description} (Lite version)`,
        main: pkg.main,
        scripts: {
            start: pkg.scripts.start
        },
        keywords: pkg.keywords,
        author: pkg.author,
        license: pkg.license,
        homepage: lite.fullVersionUrl,
        dependencies: pkg.dependencies
    };
}

// Default overlay settings from the last commit (not the working copy, which holds your own
// settings), trimmed to the included overlays. Both leaderboards share the "leaderboard" entry.
function liteOverlayConfig() {
    const committed = JSON.parse(execFileSync('git', ['show', 'HEAD:public/data/OverlayConfig.json'], { cwd: ROOT, encoding: 'utf8' }));
    const keep = new Set(lite.overlays.map(id => (id === 'leaderboard-lastname' ? 'leaderboard' : id)));
    const overlays = {};
    for (const [id, config] of Object.entries(committed.overlays)) {
        if (keep.has(id)) overlays[id] = config;
    }
    return { ...committed, overlays };
}

function build() {
    console.log(`Building ${PACKAGE_NAME} — overlays: ${lite.overlays.join(', ')}`);

    for (const id of lite.overlays) {
        if (!OVERLAY_IMAGES[id]) console.warn(`  Warning: no image list for "${id}" in OVERLAY_IMAGES — its images won't be included.`);
    }

    // Zip first — it's the one usually held open (Explorer preview, archive tool), and failing
    // here leaves the previous build untouched
    try {
        fs.rmSync(ZIP_PATH, { force: true });
    } catch (err) {
        console.error(`  Can't replace dist/${PACKAGE_NAME}.zip (${err.code}) — it's probably open in another program. Close it and run the build again.`);
        process.exit(1);
    }
    fs.rmSync(OUT_DIR, { recursive: true, force: true });
    fs.mkdirSync(OUT_DIR, { recursive: true });

    // 1. Tracked files matching INCLUDE
    const tracked = trackedFiles();
    const matched = new Set();
    let copied = 0;
    for (const file of tracked) {
        const entry = INCLUDE.find(inc => matchesEntry(file, inc));
        if (!entry || !fs.existsSync(path.join(ROOT, file))) continue; // tracked but deleted locally
        copyFile(file);
        matched.add(entry);
        copied++;
    }
    for (const entry of INCLUDE) {
        if (matched.has(entry)) continue;
        if (OPTIONAL.has(entry)) console.log(`  Note: ${entry} isn't tracked by git — skipped.`);
        else console.warn(`  Warning: nothing tracked by git matches "${entry}" — skipped.`);
    }
    console.log(`  Copied ${copied} tracked files.`);

    // 2. Generated files
    writeFile('package.json', JSON.stringify(litePackageJson(), null, 2) + '\n');
    writeFile('public/data/OverlayConfig.json', JSON.stringify(liteOverlayConfig(), null, 2));
    writeFile('public/data/DesktopModeSettings.json', JSON.stringify({ layouts: {} }, null, 2));
    // lite.json next to index.js is what switches the server into Lite mode
    writeFile('lite.json', JSON.stringify(lite, null, 2) + '\n');
    copyFile('lite/README.md');
    fs.renameSync(path.join(OUT_DIR, 'lite', 'README.md'), path.join(OUT_DIR, 'README.md'));
    fs.rmdirSync(path.join(OUT_DIR, 'lite'));

    // 3. Desktop Mode exe — the same build as the full version; the server decides what it shows
    if (fs.existsSync(EXE_PATH)) {
        fs.copyFileSync(EXE_PATH, path.join(OUT_DIR, EXE_NAME));
        console.log(`  Copied ${EXE_NAME} (built ${fs.statSync(EXE_PATH).mtime.toLocaleString()}).`);
    } else {
        console.warn(`  Warning: ${EXE_NAME} not found in src-tauri/target/release/ — build it first (npm run tauri build), or the Lite package ships without Desktop Mode.`);
    }

    // 4. Zip it
    // Drop PSModulePath: when the build runs from PowerShell 7, it points at PowerShell 7's modules,
    // and Windows PowerShell (powershell.exe) then fails to load its PS7-only Microsoft.PowerShell.Archive.
    // Without it, Windows PowerShell falls back to its own default module paths.
    const zipEnv = Object.fromEntries(Object.entries(process.env).filter(([key]) => key.toLowerCase() !== 'psmodulepath'));
    execFileSync('powershell', [
        '-NoProfile', '-Command',
        `Compress-Archive -Path '${OUT_DIR}' -DestinationPath '${ZIP_PATH}' -Force`
    ], { stdio: 'inherit', env: zipEnv });
    const sizeMB = (fs.statSync(ZIP_PATH).size / 1024 / 1024).toFixed(1);
    console.log(`Done: dist/${PACKAGE_NAME}.zip (${sizeMB} MB)`);
}

build();
