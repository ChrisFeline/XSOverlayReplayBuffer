const fs = require('node:fs/promises');
const {join, basename, dirname} = require('path');

const template = [
    '<!--MOD_START-->',
    '<script src="https://cdn.jsdelivr.net/npm/obs-websocket-js"></script>',
    '<script type="module" src="/ui/Shared/js/obs.js"></script>',
    '<!--MOD_END-->'
].join('\n');

(async function init() {
    // Read obs websocket settings so it's easier for the user to setup
    let globalSettings = await getObsStudioGlobalSettings();
    if (!globalSettings.OBSWebSocket) return await fail("No OBSWebSocket settings have been found under the current profile.\n - Make sure you have opened OBS Studio and it's updated to recent releases.");

    const defaultPort = 4455;
    let settings = {
        port: globalSettings.OBSWebSocket.ServerPort || defaultPort,
        password: globalSettings.OBSWebSocket.ServerPassword
    }

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

    const scriptOrigin = join(dirname(__filename), 'obs.js');
    const scriptPath = basePath + "/Shared/js/obs.js";

    console.log("Copying: " + basename(scriptPath));
    await fs.copyFile(scriptOrigin, scriptPath);
    console.log("Writing: " + basename(settingsPath));
    await fs.writeFile(settingsPath, settingsJson);

    let html = await fs.readFile(htmlPath, "utf8");
    const pattern = /<!--MOD_START-->[\s\S]*<!--MOD_END-->/;

    if (pattern.test(html)) {
        html = html.replace(pattern, template);
    } else {
        // If it works it works
        html = html.replace('</head>', template + '\n</head>');
    }

    console.log("Writing: " + basename(htmlPath));
    await fs.writeFile(htmlPath, html, "utf8");

    console.log();
    console.log("Files have been replaced, you can now open XSOverlay.");
    console.log();
    console.log("Press any key to continue...");
    await keypress();

    process.exit();
})();

async function fail(msg) {
    console.log("Operation Failed: " + msg);
}

async function getObsStudioGlobalSettings() {
    let path = join(process.env.APPDATA, 'obs-studio', 'global.ini');

    let settings = await fs.readFile(path, 'utf8');
    let lines = settings.split(/[\r\n]+/).map(v => v.trim());

    const headerPattern = /^\[([\w-]+)\]$/;
    const keyValPattern = /^([\w-.]+)=(.+)$/;
    const numberPattern = /^\d+(?:.\d+)?$/;

    let object = { "DEFAULT": {} };
    let header = 'DEFAULT', match;
    for (let v of lines) {
        if (v.length === 0) continue;

        // Check header match
        if ((match = v.match(headerPattern))) {
            header = match[1];
            if (!Object.hasOwnProperty(header))
                object[header] = {};
            continue;
        }
        
        // Check containing values
        if ((match = v.match(keyValPattern))) {
            let key = match[1];
            let val = match[2];
            
            if (val === 'false' || val === 'true')
                val = val === 'true';

            if (numberPattern.test(val)) val = +val;

            object[header][key] = val;
        }
    }

    return object;
}

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