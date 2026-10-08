# F1TV HUD Reworked — Lite

A small taster of [F1TV HUD Reworked](https://github.com/mantazzo/F1TV-HUD-Reworked): F1TV-style broadcast overlays for Codemasters F1 25, driven by the game's UDP telemetry.

This Lite version includes:

- **Leaderboard** (Initials version)
- **Lap Timer**
- **Speedometer**
- **Extended Controller**: change overlay options live while you play
- **Desktop Mode**: show the overlays directly on screen, on top of the game
- **Custom Overlays** support (see `views/custom/README.md`)

Like what you see? The full version has many more overlays (Weather, Session Info, Driver Name, Fastest Lap, Pit Window, Car Damage and more). Get it from GitHub: https://github.com/mantazzo/F1TV-HUD-Reworked

## Installation

1. Extract this folder anywhere on your PC.
2. Double-click `install.bat`. It downloads a standalone copy of Node.js into `runtime\` (nothing is installed system-wide) and sets up the required packages. You only need to do this once.
3. Double-click `run.bat` to start the server. Press Enter at each prompt to keep the defaults.

## In-game setup

Enable UDP telemetry in F1 25's telemetry settings and set the port to the one you entered when starting the server (20777 by default).

The 2026 Telemetry Format is supported, but unofficially, so bugs might happen.

If the overlays don't show any data, check the server window for error messages and double-check the game's telemetry settings.

## Showing the overlays

- **Desktop Mode:** with the server running, open `F1TVHUDReworked_DesktopMode.exe`. The Launcher lets you turn each overlay on, scale and reposition it, and save layouts. It also opens the Extended Controller.
- **OBS / browser:** add the overlays as Browser Sources:
  - http://localhost:3000/leaderboard
  - http://localhost:3000/lap-timer
  - http://localhost:3000/speedometer
- **Controller:** http://localhost:3000/controller/controller-extended (also works from a phone or tablet on the same network).

## License

The code is licensed under the GNU GPLv3 (see `LICENSE`). The image assets have their own terms (see `ASSETS_LICENSE.md`).
