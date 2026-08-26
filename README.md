# F1TV-HUD-Reworked

![GitHub package.json version](https://img.shields.io/github/package-json/v/mantazzo/F1TV-HUD-Reworked?style=flat-square) ![GitHub last commit (branch)](https://img.shields.io/github/last-commit/mantazzo/F1TV-HUD-Reworked/main?style=flat-square&label=Main%20Branch%20Last%20Commit%3A) ![GitHub last commit (branch)](https://img.shields.io/github/last-commit/mantazzo/F1TV-HUD-Reworked/dev?style=flat-square&label=Dev%20Branch%20Last%20Commit%3A) ![GitHub License](https://img.shields.io/github/license/mantazzo/F1TV-HUD-Reworked?style=flat-square)

F1TV HUD mod for latest Codemasters games, reworked and improved

[Originally created by MISS1LE](https://www.overtake.gg/downloads/f1tv-tv-style-hud.70701/) (check out his original mod on Overtake.gg), reworked for Codemasters F1 25 by Mantazzo 

Mod is being reworked with the assistance of AI

This project is worked on with Windows systems in mind - it may work on other systems as well, but, since F1 25 is only available on Windows systems, the primary setup is for Windows.

## Installation

1. **Install Node.js on Windows.**  
   I would recommend using tools like [Nodist](https://github.com/nodists/nodist) or [NVM for Windows](https://github.com/coreybutler/nvm-windows) or [Volta](https://volta.sh/) (currently used personally) for easier installation and version management. Any option works, as long as you can run commands like `node` or `npm`.  
   I used the latest LTS version (v24.19.0 at the time of writing) when setting up, but most recent versions should work.

2. **Clone the repository or download the latest version.**  
   You can clone with `git clone https://github.com/mantazzo/F1TV-HUD-Reworked.git` or download the ZIP file [by clicking on the text here](https://github.com/mantazzo/F1TV-HUD-Reworked/archive/refs/heads/main.zip). 
   Alternatively, you can download the Source Code from [Releases](https://github.com/mantazzo/F1TV-HUD-Reworked/releases). Downloading the executable (F1TVHUDReworked_DesktopMode.exe) is Optional.

3. **Extract the files** to any location on your computer (if you have downloaded the ZIP file).

4. **Navigate to the main folder.**  
   You should see `index.js`, `package.json`, and folders like `views/`, `public/`, and `images/` (and more).  
   Open Windows Terminal in this folder by right-clicking an empty space and selecting "Open in Terminal" (or hold `Shift` and right-click for this option). If unavailable, open Terminal (e.g., PowerShell or Command Prompt) and navigate manually with `cd path/to/folder`.

5. **Install dependencies.**  
   Run `npm install` in the Terminal. This will download and set up the required packages, and also apply the required patches.

6. **Start the server.**  
   Run `node index.js` or `npm start`. This will start the Overlay system.
   Enter a port when prompted and press `Enter`. By default, if you don't enter anything, it will use port 20777. Then select if you want to use the UDP Forwarding feature (sending data to other applications on different ports) - if you don't enter anything, it will default to "No Forwarding" option. Wait for a message confirming the server is running (e.g., "Overlays at http://localhost:3000/").

7. **Access the overlays.**  
   You can access the overlays in multiple ways.
   - Open a browser and go to `http://localhost:3000` to see the default page (Speedometer overlay). Check the [Available Overlays](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/AVAILABLE_OVERLAYS.md) page for all currently available overlays that can be used, with size references. You can use these in tools like OBS to enhance your streams or recordings. 
   - If you would prefer to see the overlays on your screen instead, I have compiled an executable to run the overlays in what I call "Desktop Mode". You can find it in the Releases, alongside the latest version. After running the server, launch the executable that you can find along the Releases, then in the opened "Launcher" window, select which overlays you want to see and scale them to fit your screen. Then go play the game and enjoy seeing all the overlay data on the screen instead. Keep in mind that this will use extra resources from your computer.
      - (Note 1: Keep in mind that "Desktop Mode" usage will require extra resources from your computer.)
      - (Note 2: While you can see overlays in Desktop Mode, you can still access them using links as well.)
      - (Note 3: WebView2 Runtime **MUST** be installed on your PC if you want to run the "Desktop Mode". It usually comes in by default with Windows 11 systems, and on Windows 10 it comes by default if you have Microsoft Edge installed.)
      - (Note 4: Usually on first launch, Windows Defender SmartScreen may likely pop up, blocking the "Desktop Mode" run - this is because the executable isn't signed. Just click on "More info" and select to "Run anyway". If I decide to get the proper license to be able to sign the app, then it should get fixed.)

## Quick Setup

If you're not feeling comfortable with all the extensive setup, I have now provided an alternative quicker approach:

1. **Run the "install.bat" script.** 
This will execute the *"install.ps1"* Powershell script, which will download the standalone binary of Node.js (latest LTS version, currently it's v24.19.0) and set it up in a "runtime/" folder, and also will set up the project's dependencies. 
If you ever need to do a module update, just rerun the script - it will update the modules as well, and install required patches (if any are required). 

2. **Run the "run.bat" script.** 
This will execute the *"run.ps1"* Powershell script, which will run the project using the downloaded standalone binary. No other setup is required!  
Afterwards, just access the links in appropriate software, or use the overlays on screen - you can follow the Step 7 of the Installation above.

## Configuration
- Ensure telemetry is enabled in F1 25 and set to port you entered in the Terminal. 
   - While there is support for 2026 Telemetry Format, it is unofficial, so bugs might happen. Please report any bugs you may encounter while using the overlays with the 2026 Telemetry Format.
- If the overlays don't work, check the Terminal for error messages and/or verify telemetry settings.

## Future Improvements
- Adding pictures and more detailed setup guides.
- Easier port configuration (if possible to improve upon it).
- Setting up the rest of the overlays (Driver Info, etc - [check TODO.md for more details](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/TODO.md)).

## License & Contributions
This project is licensed under GNU GPLv3. Check the [LICENSE](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/LICENSE) for more info.

Assets used are licensed under a Custom license, check out [ASSETS_LICENSE.md](https://github.com/mantazzo/F1TV-HUD-Reworked/blob/main/ASSETS_LICENSE.md) for further information.

Any contribution is greatly appreciated - they will be reviewed, and if deemed fit for the project, will be added.

*(This README may be updated with visuals and additional details over time.)*
