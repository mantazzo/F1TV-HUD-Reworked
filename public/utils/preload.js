/*
 * Asset preloading for overlays.
 *
 * Browsers only fetch a CSS background image, and only download a font face, once an
 * element that uses it is actually rendered. Overlay parts that start hidden (flag
 * banners, popups, MFD pages, labels) therefore fetch/decode their assets the first
 * time they're shown — the image pops in mid-animation, or text briefly shows in a
 * fallback font (and textFit may measure the wrong font).
 *
 * preloadAll() avoids that by scanning the page itself:
 *   - every url(...) image in its stylesheets is fetched and decoded up front
 *   - every font family the stylesheets use gets all of its @font-face faces loaded
 *   - every fixed '/images/...' path in its inline scripts is fetched and decoded too
 *     (after DOMContentLoaded, once those scripts are parsed)
 * No per-overlay asset lists to maintain; extra images can still be passed in.
 *
 * Call it from <head>, AFTER the stylesheet <link>s (scripts wait for preceding
 * stylesheets, so the rules are readable), and before any document.fonts.ready use —
 * fonts.ready then also waits for the preloaded faces.
 */
const AssetPreloader = {
    // Keeps decoded images referenced so the browser doesn't drop them from memory
    _images: [],

    // All style rules of same-origin stylesheets, including ones nested in @media/@supports
    _styleRules() {
        const rules = [];
        const walk = (list, base) => {
            for (const rule of list) {
                if (rule.cssRules) walk(rule.cssRules, base);
                if (rule.style) rules.push({ rule, base });
            }
        };
        for (const sheet of document.styleSheets) {
            let list;
            try { list = sheet.cssRules; } catch (e) { continue; } // cross-origin sheet
            walk(list, sheet.href || location.href);
        }
        return rules;
    },

    // Image URLs from url(...) in style rules (@font-face sources excluded)
    _cssImageUrls(rules) {
        const urls = new Set();
        for (const { rule, base } of rules) {
            if (rule instanceof CSSFontFaceRule) continue;
            for (const m of rule.cssText.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) {
                if (m[1].startsWith('data:')) continue;
                if (/\.(png|jpe?g|gif|webp|svg|avif)(\?|#|$)/i.test(m[1])) urls.add(new URL(m[1], base).href);
            }
        }
        return [...urls];
    },

    // Fixed image paths written as string literals in the page's inline scripts
    // (e.g. speedometer's per-design gauge images). Paths built at runtime with ${...}
    // (team logos, number designs) don't match and are left to load on demand.
    _scriptImageUrls() {
        const urls = new Set();
        for (const script of document.scripts) {
            if (script.src) continue;
            for (const m of script.textContent.matchAll(/(['"`])(\/images\/[^'"`$\n]+?\.(?:png|jpe?g|gif|webp|svg|avif))\1/gi)) {
                urls.add(new URL(m[2], location.href).href);
            }
        }
        return [...urls];
    },

    // Font families used by style rules (fonts.css's own @font-face rules excluded).
    // var(--x) references are resolved against custom properties defined in any rule
    // (e.g. lap-timer's --font-timing), since font-family often comes through them.
    _cssFontFamilies(rules) {
        const customProps = {};
        for (const { rule } of rules) {
            for (const prop of rule.style) {
                if (prop.startsWith('--')) (customProps[prop] ||= []).push(rule.style.getPropertyValue(prop));
            }
        }
        const resolve = (value, depth = 0) => depth > 5 ? [value] :
            value.includes('var(')
                ? (customProps[value.match(/var\(\s*(--[\w-]+)/)?.[1]] || []).flatMap(v => resolve(v, depth + 1))
                : [value];

        const families = new Set();
        for (const { rule } of rules) {
            if (rule instanceof CSSFontFaceRule) continue;
            const value = rule.style.getPropertyValue('font-family');
            if (!value) continue;
            for (const resolved of resolve(value)) {
                for (const f of resolved.split(',')) families.add(f.trim().replace(/^["']|["']$/g, ''));
            }
        }
        return families;
    },

    preloadImages(urls) {
        return Promise.all(urls.map(url => {
            const img = new Image();
            img.src = url;
            this._images.push(img);
            return img.decode().catch(() => console.warn(`[AssetPreloader] Image failed: ${url}`));
        }));
    },

    preloadFonts(families) {
        const faces = [...document.fonts].filter(face => families.has(face.family.replace(/^["']|["']$/g, '')));
        return Promise.all(faces.map(face =>
            face.load().catch(() => console.warn(`[AssetPreloader] Font failed: ${face.family} ${face.weight} ${face.style}`))
        )).then(() => faces.length);
    },

    /**
     * Preload every image and font face the page's stylesheets reference.
     * @param {Object} [options]
     * @param {string[]} [options.extraImages] - Image URLs set from JS (not visible to the CSS scan)
     * @returns {Promise<void>} Resolves when everything has loaded (failures are logged, not thrown)
     */
    preloadAll({ extraImages = [] } = {}) {
        const start = performance.now();
        const rules = this._styleRules();
        const cssImages = [...new Set([...this._cssImageUrls(rules), ...extraImages.map(u => new URL(u, location.href).href)])];
        const families = this._cssFontFamilies(rules);

        // CSS images + fonts start immediately; script literals need the body's inline
        // scripts, which aren't parsed yet when this runs from <head>.
        const domReady = document.readyState === 'loading'
            ? new Promise(resolve => document.addEventListener('DOMContentLoaded', resolve, { once: true }))
            : Promise.resolve();
        const scriptImages = domReady.then(() => {
            const urls = this._scriptImageUrls().filter(u => !cssImages.includes(u));
            return this.preloadImages(urls).then(() => urls.length);
        });

        return Promise.all([this.preloadImages(cssImages), this.preloadFonts(families), scriptImages])
            .then(([, faceCount, scriptCount]) => {
                console.log(`[AssetPreloader] ${cssImages.length} CSS + ${scriptCount} script images, ${faceCount} font faces preloaded in ${Math.round(performance.now() - start)}ms`);
            });
    }
};
