/*
 * Desktop (Tauri) overlay controls: rescaling and reposition-mode.
 *
 * These overlays are fixed-pixel layouts, so rescaling for different screen sizes
 * is done with a single CSS transform on <body> rather than touching each overlay's
 * own layout — composes correctly with any transform an overlay already applies
 * internally (e.g. live-speed's own scale()).
 *
 * The overlay's id is derived from the URL path (e.g. /weather -> "weather"),
 * matching the ids used in the launcher's OVERLAYS list — no per-file config needed.
 *
 * Initial scale comes from a ?scale= URL param (set by the launcher when it opens
 * the window), along with ?width=&height= — the overlay's *native* pixel size.
 * Those pin <body> to its native footprint regardless of the window's actual
 * current size, overriding the 100%-of-viewport sizing in styles-tauri-overlay.css
 * (needed there so undecorated windows have a drag region at all — see that file).
 * Without this, body's own overflow:hidden would clip content down to the window's
 * size *before* the transform ever runs, instead of scaling the full native content.
 *
 * ?title= supplies the pretty display name (e.g. "Pit Timer") used as the label in
 * reposition mode. ?reposition=1 activates reposition mode from the moment the
 * window opens — see styles-tauri-overlay.css for the placeholder border it shows.
 *
 * Live changes while the window is already open (scale, reposition mode) arrive
 * over a dedicated socket.io connection, kept separate from each overlay's own
 * telemetry socket. Nothing here is persisted to disk.
 */
(function () {
    const overlayId = window.location.pathname.replace(/^\//, '');

    function applyScale(scale) {
        if (typeof scale !== 'number' || !(scale > 0)) return;
        document.body.style.transform = `scale(${scale})`;
        document.body.style.transformOrigin = 'top left';
    }

    function setRepositionMode(active) {
        document.body.classList.toggle('reposition-mode', !!active);
    }

    // This script is loaded from <head>, before <body> exists — defer body access.
    function init() {
        const params = new URLSearchParams(window.location.search);

        const baseWidth = parseFloat(params.get('width'));
        const baseHeight = parseFloat(params.get('height'));
        if (!Number.isNaN(baseWidth) && !Number.isNaN(baseHeight)) {
            document.body.style.width = `${baseWidth}px`;
            document.body.style.height = `${baseHeight}px`;
        }

        const title = params.get('title');
        if (title) document.body.dataset.overlayLabel = title;

        const initialScale = parseFloat(params.get('scale'));
        if (!Number.isNaN(initialScale)) {
            applyScale(initialScale);
        }

        if (params.get('reposition') === '1') {
            setRepositionMode(true);
        }

        if (window.io) {
            const scaleSocket = window.io();
            scaleSocket.on('set_scale', (data) => {
                if (data && data.overlay === overlayId) {
                    applyScale(data.scale);
                }
            });
            scaleSocket.on('set_reposition_mode', (data) => {
                if (data && data.overlay === overlayId) {
                    setRepositionMode(data.active);
                }
            });
        }
    }

    if (document.body) {
        init();
    } else {
        document.addEventListener('DOMContentLoaded', init);
    }
})();
