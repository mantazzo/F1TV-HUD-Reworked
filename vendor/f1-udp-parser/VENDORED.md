# Vendored f1-udp-parser

This folder is a copy of [`@deltazeroproduction/f1-udp-parser`](https://github.com/deltazeroproduction/f1-udp-parser) **1.2.2** (MIT, see `LICENSE`), with the F1 25 2026-season UDP changes applied (Active Aero zones, extra car telemetry, updated drivers/teams/tracks, event codes and packet sizes).

It used to be applied at install time with `patch-package`. It now lives in the repo instead, so installs don't need a postinstall step or `patch-package` (whose dependency chain pulled in a vulnerable `braces`).

Changes to `package.json` compared to the original:
- Trimmed to what's needed at runtime: the original `scripts` (including `prepare`, which runs `tsc`) and `devDependencies` were removed, so npm can install this folder without trying to build it.
- `binary-parser` raised from `^1.5.0` to `^2.3.0`, which fixes GHSA-m39p-34qh-rh3w (code injection through parser field names; not reachable here, since all field names are hard-coded, but it kept `npm audit` from being clean). Parsed output was checked to be identical between 1.9.2 and 2.3.0 on a full 2026 recording and on randomised packets of every type for formats 2022-2026. The parser objects themselves differ internally, but only `packetData.data` is emitted to the app.

## How it's installed

The project's `package.json` depends on `file:vendor/f1-udp-parser`, so npm links `node_modules/@deltazeroproduction/f1-udp-parser` to this folder (a directory junction on Windows) and installs its dependencies into the project's own `node_modules`.

## Changing the parser

Edit the files under `build/` directly. Because of the link, changes take effect right away, with no reinstall needed. Bump the `-f1tvhud.N` suffix of `version` in this folder's `package.json` so the version shows the change. Run `npm install` in the project root only when you change this folder's `dependencies`, and commit the updated `package-lock.json` with it.
