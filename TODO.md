# F1TV HUD Reworked - Current Progress

## Available Overlays

- Speedometer
    - Fully remade, animated and responsive
    - Includes an automatic MPH units toggle
        - Can override it in Extended Controller to use the units you want instead
    - Includes F1TV style and Multiviewer style
    - Likely the first fully finished overlay
- Lap Timer
    - Remade with some personal adjustments
    - Shows your current time (if no reference time) or delta (if there is a reference time)
    - Dynamic comparison for Qualifying 1 and Qualifying 2 sessions (if in knockout positions)
    - Compare against your Personal Best in Race and in Time Trial (if set)
    - Sector bar works and shows yellow, green and purple sectors (some game issues with packet 11 in Time Trial, though)
    - Might come back to it later to expand functionality even more
- Pit Timer
    - Remade in full, uses Primary Color from the game, can be overwritten in JSON
    - Only shows up when in race and when in pitlane
    - Holds the pit stop values for 6 seconds when exiting pits, then hides
    - Can toggle between using Team Color for the Pit Stop Timer in Extended Controller
    - Currently does not show if a penalty is being served (might change that in the future)
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
    - Forecast can be toggled using the Extended Controller
    - Primary units change depending on the default temperature units set by the player
        - Units can be overwritten in Extended Controller, or use Automatic from the game
    - Also includes night icons for potential use at night tracks (needs some more testing)
- Turn Indicator
    - Very simple, shows current Turn
    - Needs data set up by user (examples provided)
    - Can use different data depending on game year (potential older game support in the future?)
    - Needs data for all remaining tracks still
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
- Mini Leaderboard
    - Remade with some adjustments
    - Shows the Current Driver Last Name in the middle, with Driver Ahead at the top and Driver Behind at the bottom
        - If there is no driver ahead or behind, the row will be empty instead
        - Might change it in the future to show two places ahead (if you're last) or two places behind (if you're first)
    - Decorations on the sides are now infinitely animated
    - Also supports the Knockout Zone indicator for Qualifying
- Session Info
    - Fully remade, with some improvements
    - Shows Event Name, Year, Current Session and Location
        - Event Name and Location are set by the track's JSON data file (same file as with Turn Indicator)
        - F2 can use a different Event Name, falls back to F1 Event Name if not found
        - Year can be set by JSON file or it will use game's year by default
    - Can be set to just be a toggle, or have automatic hiding (after 10 seconds)
        - Also has the ability to show up for 10 seconds after every session start as well
    - Includes "alt" background flags for certain tracks
- Pit Window
    - Fully Remade
    - Shows your current tyre compound and the current scheduled pit window (during races)
        - When no more pitstops are scheduled, or when not in a race session, Pit Window will be shown as "N/A"
    - Uses current tyre compound colors for various text and decorations
    - Blinking animation is also active for 2 seconds after overlay is shown
    - Has an automatic display option as well (same as in original SimHub version)
    - Might need some extra work in the future - F2 SuperSoft was not considered currently and there's no real F2 support anyway

## Overlay Controllers

- Original Controller
    - Not available currently, will probably be done once I get most overlays working
- Extended Controller
    - Self-made Controller, with primary aim of introducing more functions or controls while keeping the setup relatively easy
    - Somewhat limited functionality at the moment, but hey, it works, and it's pretty easy to expand!
    - Also offers a simple "Shutdown" button

## Debug overlays (for public use)

- Position Debug
    - Shows current position on track (meters)
    - Shows active turn data (if set up)
    - Shows track length
    - Will help some of you to adjust/make accurate Turn Indicator positions (or might assist with other things)

## Currently Working On

Pit Window (completed)

## Next Planned Overlay

Car Damage (first of the bigger overlays, I suppose - or it could be Driver Name overlay instead... I'll have to try Sonnet 4.6 for next one)

## Not started

In no particular order:
- Battery Level (from older version, so might need some extra work)
- Car Damage (car damage, tyre wear, etc)
- Driver Ahead and Behind (the three versions of the overlay)
- Driver Name (and relevant info extensions like fastest lap and stuff)
- Leaderboard (Last Name version is much older and might need to be reworked to an extent; probably most difficult overlay to do)
- Control Dashboard (original version, likely saved for last)

## Debatable

- Data Channel
- Race Classification
- Halo HUD