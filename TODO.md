# F1TV HUD Reworked - Current Progress

## Available Overlays

- Speedometer
    - Fully animated and responsive
    - Includes an automatic MPH toggle
    - Might still require some tiny tweaks for the design (will come back to it afterwards)
- Lap Timer
    - Remade with some personal adjustments
    - Shows your current time (if no reference time) or delta (if there is a reference time)
    - Dynamic comparison for Qualifying 1 and Qualifying 2 sessions (if in knockout positions)
    - Compare against your Personal Best in Race and in Time Trial (if set)
    - Sector bar works and shows yellow, green and purple sectors (some game issues with packet 11, though)
- Pit Timer
    - Remade in full, uses Primary Color from the game, can be overwritten in JSON
    - Only shows up when in race and when in pitlane
    - Holds the pit stop values for 6 seconds when exiting pits, then hides
- Live Speed
    - Remade in full, uses Primary Color from the game or the overwrite from JSON
    - Dynamic layout change depending on whether you use KPH or MPH as primary units in the game
    - A little bit of animation, animating the "LIVE SPEED" header and the "sponsor" logo
    - Color changes accordingly as well for speed values - RED for speed over 200 KPH and LIME when DRS is active
- Fastest Lap
    - Small popup showing the fastest lap set, with laptime and driver name in team color
    - Works based on the received Event packet instead of cycling through data

## Currently Working On

???

## Next Planned Overlay

???

## Not started

In no particular order:
- Battery Level (from older version)
- Car Damage
- Driver Ahead and Behind
- Driver Name
- Fastest Sectors
- FIA Stewards (Message Box)
- Leaderboard (Last Name version is much older and will likely need to be reworked to an extent)
- Mini Leaderboard
- Pit Windows
- Session Info
- Turn Indicator
- Weather
- Control Dashboard

## Debatable

- Data Channel
- Race Classification
- Halo HUD