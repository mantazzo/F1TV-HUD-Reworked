/*
 * Helper for custom (user-made) overlays in views/custom/ — see views/custom/README.md.
 *
 * Reads the page's own manifest (<script type="application/json" id="overlay-manifest">),
 * listens for the Controller's settings, and hands the overlay its current settings with
 * the manifest defaults filled in. Also handles the Visible toggle:
 *   - by default the whole page is hidden/shown (no animation)
 *   - pass onVisibility to do it yourself (e.g. a fade via a CSS class)
 *
 *   CustomOverlay.init(socket, {
 *       onSettings: (settings) => { ... },   // called on load and on every Controller change
 *       onVisibility: (visible) => { ... }   // optional
 *   });
 */
const CustomOverlay = {
    id: null,
    manifest: null,
    settings: {},

    // /custom/name, /custom/name.html, /custom/name/ and /custom/name/index.html -> "name"
    _idFromPath(pathname) {
        const rest = pathname.replace(/^\/custom\//, '').replace(/\/index\.html$/i, '').replace(/\/$/, '');
        return decodeURIComponent(rest.split('/')[0].replace(/\.html$/i, ''));
    },

    _readManifest() {
        const el = document.getElementById('overlay-manifest');
        if (!el) {
            console.warn('[CustomOverlay] No #overlay-manifest found — the Controller will not list this overlay');
            return { controls: [] };
        }
        try {
            return JSON.parse(el.textContent);
        } catch (err) {
            console.error('[CustomOverlay] Invalid manifest JSON:', err);
            return { controls: [] };
        }
    },

    _defaults() {
        const defaults = { visible: true };
        for (const control of this.manifest.controls || []) {
            if (!control || typeof control.id !== 'string' || control.id === 'visible') continue;
            if (control.type === 'toggle') {
                defaults[control.id] = control.default === true;
            } else {
                // Same rule as the server: a default that isn't one of the options falls back to the first
                const options = Array.isArray(control.options) ? control.options : [];
                defaults[control.id] = options.some(o => o?.value === control.default) ? control.default : options[0]?.value;
            }
        }
        return defaults;
    },

    _applyDefaultVisibility(visible) {
        // Hide the content but keep <body> itself, so Desktop Mode reposition outlines still show
        document.body.classList.toggle('custom-overlay-hidden', !visible);
    },

    init(socket, { onSettings, onVisibility } = {}) {
        this.id = this._idFromPath(window.location.pathname);
        this.manifest = this._readManifest();
        this.settings = this._defaults();

        if (!onVisibility) {
            const style = document.createElement('style');
            style.textContent = 'body.custom-overlay-hidden > * { visibility: hidden !important; }';
            document.head.appendChild(style);
        }

        let lastVisible = null;
        const apply = () => {
            if (this.settings.visible !== lastVisible) {
                lastVisible = this.settings.visible;
                if (onVisibility) onVisibility(lastVisible);
                else this._applyDefaultVisibility(lastVisible);
            }
            if (onSettings) onSettings({ ...this.settings });
        };

        socket.on('custom_overlay_config', (config) => {
            this.settings = { ...this._defaults(), ...(config?.[this.id] || {}) };
            apply();
        });

        // Apply defaults straight away, before the server's first config arrives
        apply();
    }
};
