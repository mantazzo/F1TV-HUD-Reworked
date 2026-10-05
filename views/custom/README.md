# Custom Overlays

Put your own overlays in this folder. No server changes needed: every file here is served under `/custom`.

| File | URL |
| --- | --- |
| `views/custom/my-overlay.html` | `http://localhost:3000/custom/my-overlay` |
| `views/custom/my-overlay/index.html` | `http://localhost:3000/custom/my-overlay/` |

New and edited files work right away, with no restart. Use the folder form if your overlay has its own CSS, JS or images. Relative paths (`style.css`, `img/logo.png`) then resolve inside that folder.

Your files in this folder are ignored by git, so updating the project won't overwrite them. Only this README and the example are tracked.

## Getting started

Copy `telemetry-example.html` (open it at `/custom/telemetry-example`), rename it, and edit it. It shows the active driver's speed, gear, inputs, ERS, fuel, tyres and the 2026 Overtake Mode state, and it covers everything below, including Controller settings.

## Manifest and Controller settings

An overlay shows up in the Controller's **Custom Overlays** section when its HTML contains a manifest:

```html
<script type="application/json" id="overlay-manifest">
{
    "name": "My Overlay",
    "width": 420,
    "height": 230,
    "controls": [
        { "id": "showTemps", "type": "toggle", "label": "Show Temperatures", "default": true },
        { "id": "units", "type": "select", "label": "Units", "default": "kph",
          "options": [ { "value": "kph", "label": "KM/H" }, { "value": "mph", "label": "MPH" } ] },
        { "id": "mode", "type": "buttons", "label": "Mode", "default": "a",
          "options": [ { "value": "a", "label": "Mode A" }, { "value": "b", "label": "Mode B" } ] }
    ]
}
</script>
```

- `name`: shown in the Controller. Defaults to the file name.
- `width` / `height`: the overlay's native pixel size. Set the OBS browser source to this. The Desktop Mode Launcher also uses it for the window size.
- `controls`: optional. The types are `toggle` (on/off), `select` (dropdown) and `buttons` (a row of buttons, one active). `select` and `buttons` need `options`, whose values can be strings or numbers. If `default` is missing or isn't one of the options, the first option is used.
- A **Visible** toggle is always added. Don't declare a control with the id `visible`.

The overlay's id is its file name (`my-overlay.html`) or folder name (`my-overlay/index.html`). New overlays appear when you press **Refresh** in the Controller, and manifest edits do too.

Load `/utils/custom-overlay.js`, then call `CustomOverlay.init` to receive the settings:

```js
CustomOverlay.init(socket, {
    // Runs right away with the manifest defaults, then again on every Controller change
    onSettings: (settings) => {
        console.log(settings.showTemps, settings.units, settings.mode, settings.visible);
    },
    // Optional. Without it, the page's content is hidden/shown instantly.
    onVisibility: (visible) => document.querySelector('.panel').classList.toggle('hidden', !visible)
});
```

Settings are saved in `public/data/CustomOverlayConfig.json` (not tracked by git). The file only stores values that you changed from the defaults.

## Receiving data

```html
<script src="/socket.io/socket.io.js"></script>
<script>
    const socket = io();
    socket.on('f1_data', (data) => {
        if (data.m_header.m_packetId === 6) { // Car Telemetry
            const car = data.m_carTelemetryData[data.m_header.m_playerCarIndex];
            console.log(car.m_speed);
        }
    });
</script>
```

Each UDP packet arrives as its own `f1_data` event, and its field names match the official spec. See `documentation/UDP_Output/F1 25 2026 Season Pack Telemetry Output Structures.txt`. The server forwards these packets:

| ID | Packet | Per-car array |
| --- | --- | --- |
| 1 | Session | (none) |
| 2 | Lap Data | `m_lapData` |
| 3 | Event | (none) |
| 4 | Participants | `m_participants` |
| 6 | Car Telemetry | `m_carTelemetryData` |
| 7 | Car Status | `m_carStatusData` |
| 9 | Lobby Info | `m_lobbyPlayers` |
| 10 | Car Damage | `m_carDamageData` |
| 11 | Session History | (one car per packet, `m_carIdx`) |
| 14 | Time Trial | (none) |
| 16 | Car Telemetry 2 (2026 Season Pack only) | `m_carTelemetry2Data` |

Motion, Car Setups, Final Classification, Tyre Sets, Motion Ex and Lap Positions are **not** forwarded. They're commented out in `index.js`.

The server also sends these once, when the page connects: `drivers_data` (AI driver names), `event_codes`, `weather_data` and `infringements_data`.

## Shared helpers

The overlay can load anything from `public/` by absolute path:

- `/fonts.css`: project fonts (`Formula1 Display`, `Formula1 TV`, `F1TV-2022` with `ss06`/`ss07` stylistic sets, ...)
- `/utils/custom-overlay.js`: manifest defaults, Controller settings and the Visible toggle (see above)
- `/utils/driver-utils.js`: `DriverUtils.getActiveDriverIndex(...)`, which follows the spectated car in multiplayer. It also has driver name lookups (`getDriverLastName`, `getDriverAbbreviation`, ...) and `loadDriverData(formulaType)`.
- `/utils/preload.js`: `AssetPreloader.preloadAll()` preloads CSS images and fonts, so hidden elements don't pop in later.
- `/styles-tauri-overlay.css` + `/utils/overlay-scale.js`: transparent background, plus Desktop Mode scaling and dragging support.
- Images under `/images/...`

## Notes

- Pages without a manifest still work at their URL, but they don't appear in the Controller and are always visible.
- Desktop Mode: custom overlays are listed in the Launcher under **Custom Overlays** (press **Refresh** there after adding one). The Launcher needs `width` and `height` in the manifest to open the window. They work with Save/Load Layout like the built-in overlays.
