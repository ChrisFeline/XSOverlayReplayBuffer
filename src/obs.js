export const obs = new OBSWebSocket();

import { root, Socket, XSOServerMessage, OverlayVariableInformation, ConnectToServer, DecodeMessage, SetGlobalThemeVariables, CurrentTheme, Commands } from './common.js';
import * as SettingsElements from './settingsElements.js';

const Parameters = {
    WebSocketUrl: undefined,
    WebSocketPass: undefined,
    get IsConnected () { return obs.socket !== undefined },

    Container: null,
    WidthOriginal: null,
    WidthRect: null,
    WidthTarget: 230,

    TrackContainer: null,
    TrackWidthOriginal: null,
    TrackWidthTarget: null,
    
    IsShown: true,
    Elements: [],
    /**
     * @param {Boolean} value 
     */
    Show(value) {
        this.IsShown = value;
        this.Elements.forEach(element => element.style.display = value ? 'inherit' : 'none');
        this.Container.style.width = (value ? this.WidthTarget : this.WidthOriginal) + 'px';
        this.TrackContainer.style.width = (value ? this.TrackWidthTarget : this.TrackWidthOriginal) + 'px';
    }
}

const InitializeToolbar_Proxy = window.InitializeToolbar;

window.InitializeToolbar = async function(bar) {
    InitializeToolbar_Proxy(bar);

    await InitializeElements();

    console.log("Fetching OBS Settings.");
    let settings = await fetch("/ui/settings.obs.json").then(r => r.json()).catch(console.error) || {};

    Parameters.WebSocketUrl = "ws://localhost:" + (settings.port || 4455);
    Parameters.WebSocketPass = settings.password;
    console.log("Connecting to OBS: " + Parameters.WebSocketUrl);

    await CheckOBSConnection();
}

async function CheckOBSConnection() {
    if (!Parameters.IsConnected) {
        try {
            let connection = await obs.connect(Parameters.WebSocketUrl, Parameters.WebSocketPass);
            console.log("Connected to OBS!", connection, obs);
            return true;
        } catch (error) {
            return false;
        }
    }

    return true;
}

function SendCommand(command, jsonData, rawData) {
    XSOServerMessage.target = "xsoverlay";
    XSOServerMessage.command = command;
    XSOServerMessage.jsonData = jsonData;
    XSOServerMessage.rawData = rawData;
    Socket.CurrentSocket.send(JSON.stringify(XSOServerMessage));
}

async function InitializeElements() {
    // Embed OBS button hehe
    /**
     * @type {HTMLDivElement}
     */
    const controlsContainer = document.querySelector('.media-widget-controls');

    const firstButton = controlsContainer.querySelector('button');
    let rect = firstButton.getBoundingClientRect();
    let btn_width = rect.width;
    
    rect = controlsContainer.getBoundingClientRect();
    Parameters.Container = controlsContainer;
    Parameters.WidthOriginal = rect.width;
    Parameters.WidthTarget = rect.width + btn_width;

    Parameters.TrackContainer = document.querySelector('.media-widget-info-container');
    rect = Parameters.TrackContainer.getBoundingClientRect();
    Parameters.TrackWidthOriginal = rect.width;
    Parameters.TrackWidthTarget = rect.width - (Parameters.WidthTarget - Parameters.WidthOriginal);

    // Create divisor
    let div0 = SettingsElements.InstantiateUiElement(controlsContainer, SettingsElements.UITypes.div, ['toolbar-divider', 'theme-font-contrast']);
    div0.style.height = '100%';
    div0.style.width = '2px';
    const saveElement = SettingsElements.InstantiateUiElement(controlsContainer, SettingsElements.UITypes.button, ['media-widget-button', 'button-image-container']);
    SettingsElements.InstantiateUiElement(saveElement, SettingsElements.UITypes.div, ['bi-download', 'theme-font-contrast']);

    saveElement.addEventListener("mouseenter", function (e) {
        if (!tooltipTimeout) SendCommand(Commands.ShowTooltip, "Save", true);
    });

    saveElement.addEventListener("mouseleave", function (e) {
        SendCommand(Commands.ShowTooltip, null, false);
    });

    let tooltipTimeout;
    saveElement.addEventListener("click", async function (e) {
        setTimeout(function () { saveElement.blur(); }, 150); //deselect button

        console.log("Saving Replay Buffer");
        const connected = await CheckOBSConnection();
        const {outputActive} = await obs.call('GetReplayBufferStatus');

        if (outputActive && connected)  {
            SendCommand(Commands.ShowTooltip, "AccentColorG", true);
            await obs.call('SaveReplayBuffer');
            console.log("Replay Buffer Saved");
        } else {
            console.log("Replay Buffer not active.", connected);
            SendCommand(Commands.ShowTooltip, "AccentColorR", true);
        }

        if (tooltipTimeout) clearTimeout(tooltipTimeout);
        tooltipTimeout = setTimeout(() => {
            tooltipTimeout = undefined;
            SendCommand(Commands.ShowTooltip, null, false);
        }, 1000);

        e.preventDefault;
    });

    Parameters.Elements.push(div0);
    Parameters.Elements.push(saveElement);

    Parameters.Show(true);
}