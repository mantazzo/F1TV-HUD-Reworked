# F1TV HUD Reworked - Current Progress

## Available Overlays

- Speedometer
    - Fully remade, animated and responsive
    - Includes an automatic MPH units toggle
        - Can override it in Extended Controller to use the units you want instead
    - Includes F1TV style and Multiviewer style
    - NEW: Added Overtake Mode (OT) display for F1 2026 cars (replaces DRS for these cars): blinking Blue Outline when Active, Filled with Blue Tint when OT is Active and using Boost
    - Likely the first fully finished overlay
- Lap Timer
    - Remade with some personal adjustments
    - Shows your current time (if no reference time) or delta (if there is a reference time)
    - Dynamic comparison for Qualifying 1 and Qualifying 2 sessions (if in knockout positions), or you can override the check in the Extended Controller to Always compare to Leader's time
    - Compare against your Personal Best in Race and in Time Trial (if set), or use the Extended Controller to compare to other times
        - Select between Session Best, Personal Best or Rival times for Time Trial
        - Select between Fastest Lap, Personal Best or Last Lap times for Race
    - Sector bar works and shows yellow, green and purple sectors
    - May come back to it later to expand functionality even more
- Pit Timer
    - Remade in full, uses Primary Color from the game, color can be overwritten in Teams JSON
    - Only shows up when in race and only when in pitlane
    - Holds the pit stop values for 6 seconds when exiting pits, then hides
    - Can toggle between using Team Color for the Pit Stop Timer in Extended Controller
    - Currently does not show if a penalty is being served (might change that in the future, if I find an idea how to display that)
- Live Speed
    - Remade in full, uses Primary Color from the game or the overwrite from JSON
    - Dynamic units change depending on whether you use KPH or MPH as primary units in the game
    - A little bit of animation, animating the "LIVE SPEED" header and the "sponsor" logo
    - Can toggle between using Team Color for the Name in the Extended Controller
    - Color changes accordingly as well for speed values - RED for speed over 200 KPH and LIME when DRS is active
- Fastest Lap
    - Fully remade
    - Small popup showing the fastest lap set, with laptime and driver name in team color
    - Works based on the received Event packet instead of cycling through data
    - Currently works in any session (might change it later)
    - Re-trigger system added as well (hides and shows again with new value if triggered while overlay was already displayed)
- Weather
    - Fully remade
    - An overlay showing current weather and weather forecast for the next 5, 10, 15 and 30 minutes
    - Forecast display can be toggled using the Extended Controller
    - Primary units change depending on the default temperature units set by the player
        - Units can be overwritten in Extended Controller or use Automatic from the game
    - Also includes night icons for potential use at night tracks (needs some more testing)
- Turn Indicator
    - A very basic overlay that shows current Turn
    - Turn data is set up by the user and uses a somewhat simple JSON system (with some examples provided)
    - Can use different data depending on game year (potential older game support in the future - low priority to add support for now)
    - Default Data for all F1 25 tracks have been included (incl. Madrid, added via 2026 Season Pack DLC)
- Fastest Sectors
    - Fully remade
    - Shows the current fastest sector times and driver names
    - Overlay visibility can be toggled in the Extended Controller
    - Data is cleared for every session
    - Might need a few extra tweaks for data updates - tricky to work with Session History packet sometimes
- Message Box (FIA Stewards)
    - Fully remade and improved
    - A popup which shows various events - Retirements, DRS switches (enabled/disabled), Penalties/Warnings, Red Flag, SC/VSC, Served Penalties
    - Uses a "FIFO" (First In, First Out) queue system so all events will be shown properly
    - FORMATION LAP box also works as intended and uses the in-game event trigger instead
    - Potential improvement in the future with more supported events (if there's interest) and possibly "custom" message setup
        - Overtake Enabled/Disabled and Partial Active Aero Mode Enabled/Disabled messages will be added soon
- Mini Leaderboard
    - Remade with some adjustments
    - Shows the Current Driver Last Name in the middle, with Driver Ahead at the top and Driver Behind at the bottom
        - If there is no driver ahead or behind, the row will be empty instead
        - Might change it in the future to show two places ahead (if you're last) or two places behind (if you're first), but that's some extra work
    - Decorations on the sides are infinitely animated
    - Also supports the Knockout Zone indicator for Qualifying (supports 2026 24 drivers grid size for Q1/SQ1)
- Session Info
    - Fully remade, with some improvements
    - Shows Event Name, Year, Current Session and Location
        - Event Name and Location are set by the track's JSON data file (same file as with Turn Indicator)
        - F2 can use a different Event Name, falls back to F1 Event Name if not found
            - Can also show different eventName per car year, so that you can have different event names for 2026 cars and 2025 cars, for example
        - Year can be set by JSON file or it will use game's year by default
            - Most of the non-default Teams have been set up to show the correct year (like F1 2026 or F2 2026 cars - these will trigger showing year "2026" instead)
    - Can be set to just be a toggle, or have automatic hiding (after 10 seconds)
        - Can be changed to show up for 10 seconds after every session start as well
    - Includes "alt" background flags for certain tracks
- Pit Window
    - Fully Remade
    - Shows your current tyre compound and the current scheduled pit window (during races)
        - When no more pitstops are scheduled, or when not in a race session, Pit Window will be shown as "N/A"
    - Uses current tyre compound colors for various text and decorations
    - Blinking animation is also active for 2 seconds after overlay is shown
    - Has an automatic display option as well (same as in the original SimHub version)
    - Might need some extra work in the future - F2 SuperSoft was not considered currently and there's no real F2 support anyway
- Car Damage
    - Fully Remade and Upgraded
    - Shows either current tyre wear or remaining tyre life (controlled through the Extended Controller)
    - Shows damage to Wings, Sidepods, Floor, Diffuser, Rear Wing, Engine (overall) and Brakes (note: brakes will likely be 0% all the time, but may be useful with some game mods...)
    - Can hide automatically after showing up (extra option toggle, controlled through Extended Controller)
    - Can show up automatically on any car part damage received (any Wings (Front + Rear) or Diffuser damage, 25%+ damage on Sidepods and Floor)
        - Or it can show up on any damage - that will include tyre wear! (Will show up every 5% of highest worn tyre, additionally)
    - Driver Name uses textFit to fit the field and also uses Primary Color from the game (can be overwritten in JSON) or uses White color as default
    - Current Tyre Compound and Tyre Age are shown as well
    - Additionally, the Title automatically hides after 8 seconds of showing up
    - Further improvements may be done in the future (like temperatures)
- Leaderboard ("Initials" version)
    - Original version, remade to the best of mine and AI abilities and extended to support up to 24 drivers
    - MFD pages are available (same as the original)
    - Resizing works as intended (Narrow - Pane 1, Short - Pane 2, Narrow+Short - Pane 3, Logo - Pane 4)
    - All original features are available, with a few improvements/fixes where applicable
    - Uses Initials for display
    - Driver Numbers display can either use images (.svg or .png) or use a fallback to text version
        - You can also use different Driver Number styles per team!
    - Flags Display is implemented and improved (displayed according to marshall post data, instead of local car data)
    - Time Remaining/Laps Remaining banner has also been implemented
    - Standings (Driver and Team) have been reimplemented
        - Support is added for up to 24 drivers and 12 teams display (with individual controls!)
        - You can use ID data for automatic assignment or add overrides for Drivers or Teams Logos and/or Names (in the DriverStandings.json or ConstructorStandings.json files)
        - Can be shown automatically during Formation Lap
        - Name displays use textFit library to fit names better for display
    - DRS Indicator was updated to also show "Overtake Active" Mode for 2026 F1 cars when enabled
    - Likely feature complete, may get a few improvements over time (and bugfixes)
- Leaderboard ("Last Name" version)
    - A fully remade version of the old "Last Name" version Leaderboard, with some upgrades
    - Feature list should be identical to the "Initials" version
        - The main change is that instead of Initials, it now shows Last Name/Display Name in full size
    - Implemented textFit library across multiple areas to help with fitting the data to properly display it with more space available
    - 24 drivers support is available as well
    - Uses the same controls in the Controller as the "Initials" version of the Leaderboard (Controller feature parity)
    - Might have some bugs remaining, I haven't fully tested out every single situation yet
- Driver Name
    - Fully Remade, with some personal fixes and improvements
    - Shows Driver's Name, Team Logo, Team Name and the current position for the driver
    - Offers 5 "variants" so far (same as original)
        - Number (default, shows Driver Number, in text form or in image form (can be selected through Extended Controller))
        - Race Leader (shows the "RACE LEADER" text for the driver if he is leading the race)
        - Race Story (shows data for Starting Position and Current Position during a race)
        - Personal Best Time (shows the best lap time for the driver and tyre compound used for that lap during non-race sessions; does not work in race sessions)
        - Chasing Driver Ahead (shows the driver who is ahead and which position we are going for in the race; if the driver is leading, Race Leader is triggered instead)
        - More variants may be added in the future, I'm open to ideas what could be shown here...
    - Somewhat unified, compared to the original version (original had 5 separate overlay versions, this is one base with 5 different information variants displayed)
    - Also has "automatic hiding" option (hides the overlay after 15 seconds, shows up again once another variant is toggled in the Extended Controller; feature can be enabled in Extended Controller as well)

## Overlay Controllers

- Original Controller
    - Not available currently, will probably be done once I get most overlays working
- Extended Controller
    - Self-made Controller, with the primary aim of introducing more functions or controls while keeping the setup relatively easy
    - Maybe somewhat limited functionality at the moment, but hey, it works, and it's pretty easy to expand!
    - Expanded with various functionality from F1TV plugin settings (and personal ideas)
    - Also offers a simple "Shutdown" button

## Debug overlays (for non-public use)

- Position Debug
    - Shows current position on track (meters)
    - Shows active turn data (if set up)
    - Shows track length
    - Will help some of you to adjust/make accurate Turn Indicator positions (or might assist with other things)

## Currently Working On

Bugfixes and improvements after latest version release

## Next Planned Overlay

Driver Ahead and Behind (the three versions of the overlay) (one of the last overlays that I consider to be "priority" overlay)

## Not started

In no particular order:
- Battery Level (from older version, so might need some extra work)
- Driver Ahead and Behind (the three versions of the overlay)
- Control Dashboard (original version, likely saved for last)
- Race Classification (probably could use data sent from the game)

## Debatable

- Data Channel (haven't looked much into it so far)
- Halo HUD (likely possible, but would probably require too much time)

## Future / Low Priority Ideas

- **MCP Server** - A locally running Model Context Protocol server that exposes live telemetry state (session, drivers, lap data, etc.) as queryable tools for AI-assisted debugging. Would allow direct inspection of live data during a session without having to manually relay debug page output. Suggested approach: add lightweight HTTP endpoints to `index.js` exposing in-memory state, then build a thin `mcp-server.js` wrapping those as MCP tools, registered via `.vscode/mcp.json`. (AI-written note - *editing note*)
- Low priority: Once completed to a satisfactory level, try to backport the overlays to older games (F1 22-F1 23-F1-24)