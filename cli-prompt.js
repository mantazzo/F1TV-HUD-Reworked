// Small terminal question helper shared by recorder.js and player.js (interactive mode).
//
// ask(question, { timeoutSec }) resolves with the trimmed answer, or null when the
// timeout runs out. The countdown stops as soon as any key is pressed, so a slow
// typist is never cut off — the timeout only catches a prompt nobody is looking at.
// Ctrl+C at a question quits (nothing has started yet at that point).

const readline = require('readline');

function ask(question, { timeoutSec = 0 } = {}) {
    return new Promise(resolve => {
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        let timer = null;
        let done = false;

        const onKeypress = () => {
            if (timer) { clearTimeout(timer); timer = null; }
        };

        const finish = (answer) => {
            if (done) return;
            done = true;
            if (timer) clearTimeout(timer);
            process.stdin.off('keypress', onKeypress);
            rl.close();
            resolve(answer);
        };

        rl.on('SIGINT', () => {
            process.stdout.write('\n');
            process.exit(130);
        });

        if (timeoutSec > 0) {
            // readline already turns a terminal's input into 'keypress' events
            process.stdin.on('keypress', onKeypress);
            timer = setTimeout(() => {
                process.stdout.write('  (no answer — using the default)\n');
                finish(null);
            }, timeoutSec * 1000);
        }

        rl.question(question, answer => finish(answer.trim()));
    });
}

// Asks until the answer passes parse(); an empty answer or a timeout gives defaultValue.
// parse returns the parsed value, or undefined to ask again.
async function askValue(question, defaultValue, parse, { timeoutSec = 0 } = {}) {
    for (;;) {
        const answer = await ask(question, { timeoutSec });
        if (answer === null || answer === '') return defaultValue;
        const value = parse(answer);
        if (value !== undefined) return value;
        console.log('  Not a valid answer, please try again.');
    }
}

function parsePort(text) {
    const port = Number(text);
    return Number.isInteger(port) && port >= 1 && port <= 65535 ? port : undefined;
}

function parseYesNo(text) {
    const t = text.toLowerCase();
    if (t === 'y' || t === 'yes') return true;
    if (t === 'n' || t === 'no') return false;
    return undefined;
}

module.exports = { ask, askValue, parsePort, parseYesNo };
