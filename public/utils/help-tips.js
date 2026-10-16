/*
 * Click-to-open help hints ("?" buttons) for the Controller.
 *
 * Markup: a .help-btn followed directly by its .help-card, both inside a
 * position: relative container (an .option-row or a section's <h2>):
 *
 *   <button type="button" class="help-btn" aria-expanded="false" aria-label="Help: …">?</button>
 *   <div class="help-card" hidden>…</div>
 *
 * Click rather than hover, so it works on phones/tablets too. The card floats over the
 * content below instead of pushing it down — in the 2-column layout, a section growing
 * would make the other sections jump between columns. One card open at a time; an
 * outside click or Escape closes it.
 */
(function () {
    let openBtn = null;

    function close() {
        if (!openBtn) return;
        openBtn.setAttribute('aria-expanded', 'false');
        openBtn.nextElementSibling.hidden = true;
        openBtn = null;
    }

    function open(btn) {
        close();
        btn.setAttribute('aria-expanded', 'true');
        btn.nextElementSibling.hidden = false;
        openBtn = btn;
    }

    document.addEventListener('click', (e) => {
        const btn = e.target.closest('.help-btn');
        if (btn) {
            if (btn === openBtn) close();
            else open(btn);
            return;
        }
        if (!e.target.closest('.help-card')) close();
    });

    document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape' || !openBtn) return;
        const btn = openBtn;
        close();
        btn.focus();
    });
})();
