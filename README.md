# F1TV-HUD-Reworked

![GitHub package.json version](https://img.shields.io/github/package-json/v/mantazzo/F1TV-HUD-Reworked?style=flat-square) ![GitHub last commit](https://img.shields.io/github/last-commit/mantazzo/F1TV-HUD-Reworked?style=flat-square) ![GitHub License](https://img.shields.io/github/license/mantazzo/F1TV-HUD-Reworked?style=flat-square)

F1TV HUD mod for latest Codemasters games, reworked and improved

[Originally created by MISS1LE](https://www.overtake.gg/downloads/f1tv-tv-style-hud.70701/) (check out his original mod on Overtake.gg), reworked for Codemasters F1 25 by Mantazzo 

Mod is being reworked with the assistance of AI

This project is worked on with Windows systems in mind - it may work on other systems as well, but, since F1 25 is only available on Windows systems, the primary setup is for Windows.

## Installation

1. **Install Bun or Node.js on Windows.**  
   At the moment, I currently recommend using [Bun](https://bun.sh/) Framework as it is considered to be more performative with virtually no differences to the classic Node.js.
   Setting it up on Windows systems is also easy - just run `irm bun.sh/install.ps1 | iex` in Powershell or Terminal and wait a little for it to install.

   If you prefer to use the classic Node.js framework, I would recommend using tools like [Nodist](https://github.com/nodists/nodist) or [NVM for Windows](https://github.com/coreybutler/nvm-windows) for easier version management.  
   I used the latest LTS version (v22.19.0 at the time of writing) when setting up, but most recent versions should work.

2. **Clone the repository or download the latest version.**  
   You can clone with `git clone https://github.com/mantazzo/F1TV-HUD-Reworked.git` or download the ZIP file [by clicking on the text here](https://github.com/mantazzo/F1TV-HUD-Reworked/archive/refs/heads/main.zip).

3. **Extract the files** to any location on your computer (if you have downloaded the ZIP file).

4. **Navigate to the main folder.**  
   You should see `index.js`, `package.json`, and folders like `views/`, `public/`, and `images/`.  
   Open Windows Terminal in this folder by right-clicking an empty space and selecting "Open in Terminal" (or hold `Shift` and right-click for this option). If unavailable, open Terminal (e.g., PowerShell or Command Prompt) and navigate manually with `cd path/to/folder`.

5. **Install dependencies.**  
   Run `bun install` in the Terminal. This will download and set up the required packages.
   If you want to use Node.js framework, run `npm install` in the Terminal instead.

6. **Start the server.**  
   Run `bun index.js` or `bun start`. This will start the Overlay system. If you want to use Node.js, run `node index.js` instead.
   Enter a port when prompted and press `Enter`. By default, if you don't enter anything, it will use port 20777. Wait for a message confirming the server is running (e.g., "Overlays at http://localhost:3000/speedometer").

7. **Access the overlays.**  
   Open a browser and go to `http://localhost:3000` to see the default page (Speedometer overlay). Check the [Available Overlays](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/AVAILABLE_OVERLAYS.md) page for all currently available overlays that can be used, with size references. You can use these in tools like OBS to enhance your streams or recordings.

## Configuration
- Ensure telemetry is enabled in F1 25 and set to port you entered in the Terminal.
- If the overlays don't work, check the Terminal for error messages and/or verify telemetry settings.

## Future Improvements
- Adding pictures and more detailed setup guides.
- Easier port configuration (if possible to improve upon it).
- Setting up the rest of the overlays (Leaderboard, Driver Info, etc - [check TODO.md for more details](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/TODO.md)).

## License & Contributions
This project is licensed under GNU GPLv3. Check the [LICENSE](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/LICENSE) for more info.

Assets used are licensed under a Custom license, check out [ASSETS_LICENSE.md](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/ASSETS_LICENSE.md) for further information.

*(This README may be updated with visuals and additional details over time.)*
