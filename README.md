# F1TV-HUD-Reworked
F1TV HUD mod for latest Codemasters games, reworked and improved

Originally created by MISS1LE, reworked for F1 25 by Mantazzo 

Mod is being reworked with the help of AI (Grok)

This project is worked on with Windows systems in mind - it may work correctly on Linux as well, but, since F1 25 is only available on Windows systems, the primary setup is for Windows.

## Installation

1. **Install Node.js on Windows.**  
   I recommend using tools like [Nodist](https://github.com/nodists/nodist) or [NVM for Windows](https://github.com/coreybutler/nvm-windows) for easier version management.  
   I currently used the latest LTS version (v22.19.0 at the time of writing) when setting up, but most recent versions should work.

2. **Clone the repository or download the latest version.**  
   You can clone with `git clone https://github.com/mantazzo/F1TV-HUD-Reworked.git` or download the ZIP file [here](https://github.com/mantazzo/F1TV-HUD-Reworked/archive/refs/heads/main.zip).

3. **Extract the files** to any location on your computer.

4. **Navigate to the main folder.**  
   You should see `index.js`, `package.json`, and folders like `views/`, `public/`, and `images/`.  
   Open Windows Terminal in this folder by right-clicking an empty space and selecting "Open in Terminal" (or hold `Shift` and right-click for this option). If unavailable, open Terminal (e.g., PowerShell or Command Prompt) and navigate manually with `cd path/to/folder`.

5. **Install dependencies.**  
   Run `npm install` in the Terminal. This will download the required packages.

6. **Start the server.**  
   Run `node index.js`. Enter a port when prompted and press `Enter`. By default, if you don't enter anything, it will use port 20777 (as described in parentheses). Wait for a message confirming the server is running (e.g., "Overlays at http://localhost:3000/speedometer").

7. **Access the overlays.**  
   Open a browser and go to `http://localhost:3000` to see the default page, or `http://localhost:3000/speedometer` for the speedometer. Use these in tools like OBS to enhance your streams or recordings.

## Configuration
- Ensure telemetry is enabled in F1 25 and set to port you entered in the Terminal.
- If the overlay doesn’t work, check the Terminal for error messages or verify telemetry settings.

## Future Improvements
- Adding pictures and more detailed setup guides.
- Making the port configurable at launch.
- Setting up the rest of the overlays (Timer, Leaderboard, Driver Info, etc).

## License & Contributions
[Placeholder: Add license (e.g., MIT) and contribution guidelines later.]

*(This README may be updated with visuals and additional details over time.)*