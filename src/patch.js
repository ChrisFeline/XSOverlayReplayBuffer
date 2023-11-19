const fs = require('node:fs/promises');
const path = require('path');

const template = [
    '<!--MOD_START-->',
    '<script src="https://cdn.jsdelivr.net/npm/obs-websocket-js"></script>',
    '<script type="module" src="/ui/Shared/js/obs.js"></script>',
    '<!--MOD_END-->'
].join('\n');

const readline = require('node:readline/promises');
const { stdin: input, stdout: output } = require('node:process');

const rl = readline.createInterface({ input, output });

(async function init() {
    const defaultPort = 4455;
    const settings = {
        port: defaultPort,
        password: undefined
    }

    console.log(process.argv);
    console.log();

    settings.port = +process.argv[process.argv.indexOf('--port') + 1];
    if (isNaN(settings.port)) settings.port = defaultPort;
    settings.password = (process.argv[process.argv.indexOf('--pass') + 1] || '').trim();

    console.clear();
    separator();
    console.log("These following settings for OBS WebSocket will be used.");
    console.log("  Port: " + (settings.port === defaultPort ? defaultPort + " (Default)" : settings.port));
    console.log("  Pass: " + settings.password || '');
    separator(true);

    const settingsJson = JSON.stringify(settings);

    const basePath = "../../Plugins/UserInterface";
    const settingsPath = basePath + "/settings.obs.json";
    const htmlPath = basePath + "/GlobalToolbar.html";

    const scriptOrigin = path.join(path.dirname(__filename), 'obs.js');
    const scriptPath = basePath + "/Shared/js/obs.js";

    console.log("Writing files...");
    await fs.writeFile(settingsPath, settingsJson);
    await fs.copyFile(scriptOrigin, scriptPath);

    let html = await fs.readFile(htmlPath, "utf8");
    const pattern = /<!--MOD_START-->[\s\S]*<!--MOD_END-->/;

    if (pattern.test(html)) {
        html = html.replace(pattern, template);
    } else {
        // If it works it works
        html = html.replace('</head>', template + '\n</head>');
    }

    await fs.writeFile(htmlPath, html, "utf8");

    console.log("Files have been written, you can now open XSOverlay.");
    console.log();
    console.log("Press any key to continue...");
    await keypress();
    rl.close();

    process.exit();
})();

function separator(space) {
    console.log("==================================");
    if (space) console.log();
}

const keypress = async () => {
    process.stdin.setRawMode(true)
    return new Promise(resolve => process.stdin.once('data', () => {
      process.stdin.setRawMode(false)
      resolve()
    }))
}