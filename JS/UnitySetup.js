
let UNITY_CLIENT_URLS = {
    //"StandalonePlayer": "//files.kogstatic.com/e0063fbe-23a3-4972-9515-5c0980ad5291/KogamaData?_t=1731590484",
    "StandaloneLauncher2": "//www-gamelauncher.kogstatic.com/www/Launcher.zip?_t=1437643276",
    "StandaloneBootstrap2": "//www-gamelauncher.kogstatic.com/www/KogamaLauncher.msi?_t=1437643420",
    "UnityLoader.js": "//webgl.kogstatic.com/4567eacb-6c16-4a12-b653-e1e471592681/Build/UnityLoader.js",
    "WebGLBuild.json": "//webgl.kogstatic.com/4567eacb-6c16-4a12-b653-e1e471592681/Build/WebGLBuild.json",
    "WebGLBuild.data.unityweb": "//webgl.kogstatic.com/4567eacb-6c16-4a12-b653-e1e471592681/Build/WebGLBuild.data.unityweb",
    "WebGLBuild.asm.code.unityweb": "//webgl.kogstatic.com/4567eacb-6c16-4a12-b653-e1e471592681/Build/WebGLBuild.asm.code.unityweb",
    "WebGLBuild.asm.memory.unityweb": "//webgl.kogstatic.com/4567eacb-6c16-4a12-b653-e1e471592681/Build/WebGLBuild.asm.memory.unityweb",
    "WebGLBuild.asm.framework.unityweb": "//webgl.kogstatic.com/4567eacb-6c16-4a12-b653-e1e471592681/Build/WebGLBuild.asm.framework.unityweb"
}

const builsInfos = {
    "3.1.22.1153": {
        Version: "3.1.22.1153",
        ReleaseName: "2024-11-14Maintenance",
        Branch: "2024-11-14Maintenance",
        Buildtime: "11/14/2024 11:13:56 AM"
    },
    "3.1.36.1153": {
        Version: "3.1.36.1153",
        ReleaseName: "2025-02-26Hotfix",
        Branch: "2025-02-26-hotfix",
        Buildtime: "2/26/2025 12:31:44 PM"
    }
}


const TypeToGameMode = {
    edit: 0,
    play: 1,
    character: 2,
    "local-play": 1
}
const PlatformTypes = {
    WEBGL: "WEBGL",
    WEBGL_V2: "WEBGL_1",
    STANDALONE: "STANDALONE",
    ANDROID: "ANDROID"
};
const EventManager = (function () {
    return {
        all: new Map(),

        /**
         * Registers a listener for a specific event.
         * @param {string} event - The name of the event to listen to.
         * @param {function} callback - The function to call when the event is emitted.
         */
        on(event, callback) {
            if (typeof callback !== "function") {
                throw new TypeError("Callback must be a function.");
            }
            const listeners = this.all.get(event) || [];
            listeners.push(callback);
            this.all.set(event, listeners);
        },

        /**
         * Removes a listener for a specific event.
         * @param {string} event - The name of the event.
         * @param {function} [callback] - The specific listener to remove. If not provided, removes all listeners for the event.
         */
        off(event, callback) {
            const listeners = this.all.get(event);
            if (!listeners) return;

            if (callback) {
                const index = listeners.indexOf(callback);
                if (index !== -1) {
                    listeners.splice(index, 1);
                }
            } else {
                this.all.set(event, []);
            }
        },

        /**
         * Emits an event, calling all its listeners with the provided data.
         * @param {string} event - The name of the event to emit.
         * @param {*} [data] - The data to pass to each listener.
         */
        emit(event, data) {
            const listeners = this.all.get(event);
            if (listeners) {
                [...listeners].forEach((callback) => callback(data));
            }

            // Emit wildcard listeners (`*`), if any
            const wildcardListeners = this.all.get("*");
            if (wildcardListeners) {
                [...wildcardListeners].forEach((callback) => callback(event, data));
            }
        }
    };
})();
function setWebAssemblyFilesURLS(uuid) {
    let str = "//webgl.kogstatic.com/" + uuid + "/Build/";
    let filesName = ["UnityLoader.js", "WebGLBuild.json", "WebGLBuild.data.unityweb", "WebGLBuild.asm.code.unityweb", "WebGLBuild.asm.memory.unityweb", "WebGLBuild.asm.framework.unityweb"];
    filesName.forEach(l => UNITY_CLIENT_URLS[l] = str + l)
}
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
function parseUnityErrorLog(e) {
    if (!e) {
        throw new Error("Missing data from Unity Call");
    }

    let parsedData;
    try {
        parsedData = JSON.parse(e);
    } catch (error) {
        throw new Error("JSON parse error: " + error);
    }

    if (!Object.prototype.hasOwnProperty.call(parsedData, "callbackId")) {
        throw new Error("Missing data callbackId, got " + e);
    }

    return parsedData;
}
function getType(value) {
    getType = (typeof Symbol === "function" && typeof Symbol.iterator === "symbol")
        ? function (value) {
            return typeof value;
        }
        : function (value) {
            return value && typeof Symbol === "function" && value.constructor === Symbol && value !== Symbol.prototype
                ? "symbol"
                : typeof value;
        };
    return getType(value);
}
function isString(value) {
    return "[object String]" === Object.prototype.toString.call(value);
}
function isFunction(value) {
    return "[object Function]" === Object.prototype.toString.call(value);
}
function isObjectOrFunction(value) {
    var type = getType(value);
    return type === "function" || (type === "object" && !!value);
}
function callUnityMethod(t, a, n) {
    console.debug("callUnityMethod invoked with", t, a, n);
    let e = window.UnityGame;
    if (e !== null) {
        // Merge default options with provided options
        n = Object.assign({ type: "json" }, n);

        // Process the `a` parameter if it's provided
        if (a && n.type === "json") {
            a = isObjectOrFunction(a)
                ? Array.isArray(a)
                    ? a.slice() // Clone array
                    : Object.assign({}, a) // Clone object
                : a;

            // Stringify `data` field if it's an object
            if (getType(a.data) === "object" && a.data !== null) {
                a.data = JSON.stringify(a.data);
            }

            // Stringify `error` field if it's an object
            if (getType(a.error) === "object" && a.error !== null) {
                a.error = JSON.stringify(a.error);
            }

            // Convert the entire `a` parameter to a JSON string
            a = JSON.stringify(a);
        }

        // Interact with Unity player
        if (e && typeof e.SendMessage === "undefined") {
            return false;
        }

        try {
            if (a == null) {
                e.SendMessage("BrowserComm", t);
            } else {
                e.SendMessage("BrowserComm", t, a);
            }
        } catch (error) {
            throw error;
        }

        return true;
    }

    var o;
}
function detectBrowserInfo() {
    var browserInfo = (() => {
        let info = {};
        info.nVer = navigator.appVersion;
        info.nAgt = navigator.userAgent;
        info.browserName = navigator.appName;
        info.fullVersion = String(parseFloat(navigator.appVersion));
        info.majorVersion = parseInt(navigator.appVersion, 10);

        let index;
        if ((index = info.nAgt.indexOf("Opera")) !== -1) {
            info.browserName = "Opera";
            info.fullVersion = info.nAgt.substring(index + 6);
            if ((index = info.nAgt.indexOf("Version")) !== -1) {
                info.fullVersion = info.nAgt.substring(index + 8);
            }
        } else if ((index = info.nAgt.indexOf("MSIE")) !== -1) {
            info.browserName = "Microsoft Internet Explorer";
            info.fullVersion = info.nAgt.substring(index + 5);
        } else if ((index = info.nAgt.indexOf("Chrome")) !== -1) {
            info.browserName = "Chrome";
            info.fullVersion = info.nAgt.substring(index + 7);
        } else if ((index = info.nAgt.indexOf("Safari")) !== -1) {
            info.browserName = "Safari";
            info.fullVersion = info.nAgt.substring(index + 7);
            if ((index = info.nAgt.indexOf("Version")) !== -1) {
                info.fullVersion = info.nAgt.substring(index + 8);
            }
        } else if ((index = info.nAgt.indexOf("Firefox")) !== -1) {
            info.browserName = "Firefox";
            info.fullVersion = info.nAgt.substring(index + 8);
        } else {
            let lastSpace = info.nAgt.lastIndexOf(" ") + 1;
            let lastSlash = info.nAgt.lastIndexOf("/");
            if (lastSpace < lastSlash) {
                info.browserName = info.nAgt.substring(lastSpace, lastSlash);
                info.fullVersion = info.nAgt.substring(lastSlash + 1);
                if (info.browserName.toLowerCase() === info.browserName.toUpperCase()) {
                    info.browserName = navigator.appName;
                }
            }
        }

        if ((index = info.fullVersion.indexOf(";")) !== -1) {
            info.fullVersion = info.fullVersion.substring(0, index);
        }
        if ((index = info.fullVersion.indexOf(" ")) !== -1) {
            info.fullVersion = info.fullVersion.substring(0, index);
        }

        info.majorVersion = parseInt(String(info.fullVersion), 10);
        if (isNaN(info.majorVersion)) {
            info.fullVersion = String(parseFloat(navigator.appVersion));
            info.majorVersion = parseInt(navigator.appVersion, 10);
        }

        return info;
    })();

    callUnityMethod("GiveBrowserInfo", `${browserInfo.browserName},${browserInfo.majorVersion}`, { type: "plain" });
}
function isSecureProtocol() {
    return location.protocol === "https:";
};
function GetServerIP(platformType, serverInfo, useSecureConnection) {
    const { ANDROID, STANDALONE, WEBGL, WEBGL_V2 } = PlatformTypes;
    switch (platformType) {
        case ANDROID:
        case STANDALONE:
            return serverInfo.hostName + ":" + serverInfo.udpPort;
        case WEBGL:
        case WEBGL_V2:
            return useSecureConnection
                ? "wss://" + serverInfo.hostName + ":" + serverInfo.wssPort
                : "ws://" + serverInfo.hostName + ":" + serverInfo.wsPort;
        default:
            throw new Error("unsupported plugin type: " + platformType);
    }
}
function GetURL(path) {
    return window.location.protocol + "//" + window.location.host + path;
}
function createUnityPacket(callback) {
    let SPOOF_PATH = "https://kogamapp"
    let gameMode = 1;
    let anyid = "xxxxxxxx.xxxxxxxxxxxx";
    let data_ = {
        "planetName": anyid,
        "newPlanetName": anyid,
        "serverIP": GetServerIP(PlatformTypes.WEBGL, { hostName: anyid, wssPort: 30 }, true),
        "token": anyid,
        "sessionToken": anyid,
        "isSoftLaunch": false,
        "language": "en_US",
        "planetID": 0,
        "profileID": 1,
        "embedded": true,
        "gameMode": gameMode,
        "pingURL": window.location.href + "api/ping.json",
        "disconnectURL": "https://api-www.kgoma.com/disconnectURL",
        "unityPacketURL": "https://api-www.kgoma.com/unityPacketURL",
        "reauthURL": "https://api-www.kgoma.com/reauthURL",
        "gameRewardData": null,
        "gameRewardURL": "https://api-www.kgoma.com/v1/api/reward/game-play/",
        "gameRewardDataURL": window.location.href + "api/game_reward.json",
        "gamePublishedURL": "https://api-www.kgoma.com/v1/api/reward/published/",
        "playerProfileURL": "https://www.kogama.com/profile",
        "eliteUpgradeURL": "https://www.kogama.com/subscription/subscribe/",
        "purchaseGoldURL": "https://www.kogama.com/purchase/",
        "loginURL": "https://www.kogama.com/login/",
        "signupURL": "https://www.kogama.com/register/",
        "idleURL": "https://www.kogama.com/page/disconnected/?reason=idle",
        "disconnectedURL": "https://www.kogama.com/page/disconnected/",
        "region": "eu",
        "referrer": "kogama",
        "detailedStats": false,
        "isIOSDevice": false
    };
    callback({ data: data_ });
};
function SetUnityFunctions(ea) {
    ea.UNITY_gotoPlayerProfile_v2 = function (ProfileID, Settings) {
        window.Data = [ProfileID, Settings];
    }
    ea.UNITY_gamePlayStatus = function () {
    }
    ea.UNITY_showVideoAd = function () { }
    ea.UNITY_sendStatHatValue = function (key, value) {
        EventManager.emit("stat-event-unity-value", { key, value })
    }
    ea.UNITY_sendStatHatCount = function (key, count) {
        EventManager.emit("stat-event-unity-count", { key, count })
    }
    ea.UNITY_showRewardedVideoAd = function () { };
    ea.UNITY_resetAFKtimer = function () {
        // null !== dn && dn.invokeActive()
        EventManager.emit("unity-player:heartbeat");
    }
    ea.UNITY_readyForAd = function () { }
    ea.UNITY_gotoDisconnectedPage = function () {

    }
    ea.UNITY_unityDebugException = function (e) {
        console.debug("unity exception:", e)
    };
    ea.UNITY_unityDebugLog = function (e) {
        console.debug("unity debug log:", e)
    };
    ea.get_browser_version = detectBrowserInfo;
    ea.UNITY_get_browser_version = detectBrowserInfo;
    ea.UNITY_sendLoadStats = function (t) {
        callUnityMethod("ExternalCallback", e = {
            callbackId: parseUnityErrorLog(t).callbackId,
            data: {
                DOMReady: 1,
                PluginInit: 1,
            }
        })
    };
    ea.UNITY_requestVideoAd = function (t) {
        callUnityMethod("ExternalCallback", {
            callbackId: parseUnityErrorLog(t).callbackId,
            data: {
                adAvailable: false,
            }
        })
    }
    ea.UNITY_sendPlayerParams = function (t) {
        var callbackId = parseUnityErrorLog(t).callbackId;
        var g = window.parent.window.InitSettings;
        if (g.token) g.ProfileID = Number(token.split(".")[0]);
        onSendPlayerParams();
        createUnityPacket(function (ef) {
            ef.data = Object.assign(ef.data, g);
            callUnityMethod("ExternalCallback", Object.assign({ callbackId }, ef))
        })
    }
    ea.UNITY_requestDomain = function (t) {
        var callbackId = parseUnityErrorLog(t).callbackId;
        callUnityMethod("ExternalCallback", {
            callbackId,
            data: { domain: "kogama.com" }
        })
    }
    ea.UNITY_requestRewardedVideoAd = ea.UNITY_requestVideoAd;
}
function HookWebSocket(win) {
    win.TEST = [];
    win.WebSocket.prototype._send = win.WebSocket.prototype.send;
    win.WebSocket.prototype.send = function (data) {
        if (this.url.includes('kgoma')) {
            if (!this._onmessage) { }
            data = new Uint8Array(data);
            //data = Console_.WebSocket_.Handle_Client(data)
            win.TEST.push([...data])
            this._send(data);
        }
    }


}
function initializeUnityPlayer(containerId) {

    let container = document.getElementById(containerId);
    if (!container) {
        console.error(`Container with id "${containerId}" not found.`);
        return;
    }

    let iframe = document.createElement("div");
    iframe.innerHTML = `
     <style>
        /****************************************
            ==== RESETS
            ****************************************/
        html,
        body,
        #unity-canvas-container,
        canvas {
            margin: 0;
            padding: 0;
            width: 100%;
            height: 100%;
        }

        ::-moz-selection {
            color: #333;
            text-shadow: none;
        }

        ::selection {
            color: #333;
            text-shadow: none;
        }

        .clear:after {
            visibility: hidden;
            display: block;
            font-size: 0;
            content: " ";
            clear: both;
            height: 0;
        }

        .clear {
            display: inline-table;
            clear: both;
        }

        /* Hides from IE-mac \*/
        * html .clear {
            height: 1%;
        }

        .clear {
            display: block;
        }

        /* End hide from IE-mac */
        /****************************************
            ==== LAYOUT
            ****************************************/
        html,
        body {
            width: 100%;
            height: 100%;
            font-family: Helvetica, Verdana, Arial, sans-serif;
        }

        body {}

        canvas {
            margin: 0 0 0 0;
            position: absolute;
            z-index: 9;
            width: 100%;
            height: 100%;
        }

        body,
        html,
        canvas {
            margin: 0;
            padding: 0;
        }
    </style>
    <div id="unity-canvas-container">
        <canvas id="#canvas"></canvas>
    </div>
    `
    iframe.setAttribute("allowfullscreen", "");
    iframe.setAttribute("width", "100%");
    iframe.setAttribute("height", "100%");
    iframe.setAttribute("title", "unity-player-frame");
    iframe.setAttribute("id", "unity-player-frame");
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");


    const bounds = container.getBoundingClientRect();
    SetUnityFunctions(window);
    initializeWebGLRuntime(window);
    window.webgl.run(UNITY_CLIENT_URLS, bounds.width, bounds.height, {});


    container.appendChild(iframe);
}
function initializeWebGLRuntime(e) {
    function handleGlobalError(e) {
        console.log(e);
    }

    function handleKeyDown(e) {
        if ("keydown" === e.type) {
            switch (e.keyCode) {
                case 37: // Left arrow
                case 38: // Up arrow
                case 39: // Right arrow
                case 40: // Down arrow
                case 8:  // Backspace
                case 9:  // Tab
                case 16: // Shift
                    e.preventDefault();
            }
        }
    }

    function disableContextMenu(e) {
        e.preventDefault();
        return false;
    }

    e.document.addEventListener(
        "DOMContentLoaded",
        function () {
            e.onerror = function () { };
            e.addEventListener("keydown", handleKeyDown, false);
            e.addEventListener("error", handleGlobalError, false);
            document.addEventListener("contextmenu", disableContextMenu, false);
        },
        false
    );

    e.webgl = {
        run: function (t, a, n, o) {
            var r,
                i = this;

            // Merge default options with provided options
            var options = Object.assign(
                {
                    onPostRun: function () { },
                    onError: function () { },
                    onStats: function () { },
                },
                o
            );

            var onPostRun = options.onPostRun;
            var onStats = options.onStats;
            var basePath = t["UnityLoader.js"].split("UnityLoader.js")[0];

            // Call onStats with "preInit"
            onStats("preInit", Date.now());

            // Function to load a script dynamically
            function loadScript(e, scriptUrl, callback) {
                if (typeof scriptUrl === "undefined") {
                    throw new Error("loadScript: cannot load undefined");
                }

                var isLoaded = false;
                var scriptElement = e.document.createElement("script");

                scriptElement.type = "text/javascript";
                scriptElement.src = scriptUrl;
                scriptElement.async = true;
                scriptElement.onload = callback;

                if (typeof callback === "function") {
                    scriptElement.onload = scriptElement.onreadystatechange = function () {
                        if (
                            !isLoaded &&
                            (!this.readyState || this.readyState === "complete")
                        ) {
                            isLoaded = true;
                            callback(scriptUrl);
                        }
                    };
                }

                var firstScript = e.document.getElementsByTagName("script")[0];
                firstScript.parentNode.insertBefore(scriptElement, firstScript);
            }

            // Load the WebGL loader script
            const filePath = "./Game/" + window.InitSettings.Version;
            loadScript(e, filePath + "/WebGLBuild.loader.js", function () {//./JS/WebGLBuild.loader.js
                var canvasElement = e.document.getElementById("#canvas");
                var unityConfig = {
                    dataUrl: filePath + "/WebGLBuild.data.gz",
                    frameworkUrl: filePath + "/WebGLBuild.framework.js",
                    codeUrl: filePath + "/WebGLBuild.wasm.gz",
                    streamingAssetsUrl: "StreamingAssets",
                    companyName: "Multiverse ApS",
                    productName: "KoGaMa",
                    productVersion: "2.30.55",
                };

                // Call onStats with "preRun"
                onStats("preRun", Date.now());

                // Create Unity instance
                e.createUnityInstance(canvasElement, unityConfig, function (e) {
                    console.log(e * 100 + "% - Loaded");
                })
                    .then(function (unityInstance) {
                        r = unityInstance;
                        window.UnityGame = {
                            SendMessage: function (objectName, methodName, value) {
                                r.SendMessage(objectName, methodName, value);
                            },
                            canvas: canvasElement,
                            windowContext: e,
                            game: r,
                            Module: i,
                        };
                        onPostRun(window.UnityGame);
                        onStats("postRun", Date.now());
                    })
                    .catch(function (e) {
                        console.log(e);
                    });
            });
        },
    };
};


window.InitSettings = { Version: "3.1.22.1153" };
let local = window.localStorage.getItem("ServerSettings");
let ServerSettings = window.ServerSettings = local ? JSON.parse(local) : {
    UserName: "Tourist",
}; // ofc fake server


let LaunchedGame = false;

function getFileExtension(name) {
    if (!name || typeof name !== "string") return "";
    const lastDot = name.lastIndexOf(".");
    if (lastDot <= 0) return "";
    return name.slice(lastDot + 1);
}
let onSendPlayerParams = () => null;

document.addEventListener("DOMContentLoaded", () => {

    const $ = (e) => document.querySelector(e);

    const ct = $("#container-topper");
    const uploadBtn = $("#upload-button");
    const cs = $("#control-section");
    const dc = $("#dc");
    const git = $("#git");


    git.addEventListener("click", () => open("//github.com/Zpayer/KMP"));
    dc.addEventListener("click", () => open("//discord.gg/jXFDNdvjZu"));



    const UIHelper = window.UIHelper;


    let container = UIHelper.createElement(cs, "div", {
        style: {
            display: 'none',
            width: '90%',
            maxWidth: '600px',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'flex-start',
            height: '75%',
            gap: '20px'
        }
    }, [
        UIHelper.AddSelect(0, "Game Version", Object.keys(builsInfos), 0, (e) => {
            window.InitSettings.Version = e;
        }),
        UIHelper.AddSelect(0, "Game Mode", ["Build", "Play", "Avatar"], 1, (_, i) => {
            window.InitSettings.gameMode = i;
        }),
        UIHelper.AddTextInput(0, "PLayer Name", ServerSettings.UserName, (e) => {
            ServerSettings.UserName = e;
            window.localStorage.setItem("ServerSettings", JSON.stringify(ServerSettings));
        }),
        UIHelper.AddFileInput(0, "Avatar File", ".kgm, .kgmap", (e) => {
            const file = e[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function (e) {
                const buffer = e.target.result;
                const bytes = new Uint8Array(buffer);
                const fileExtension = getFileExtension(file.name);
                console.log("File extension: ", fileExtension);
                if (fileExtension === "kgm") {
                    ServerSettings.Avatar = await window.WorldHandler.DecodeWorld(bytes);
                } else if (fileExtension === "kgmap") {
                    const decompressedBytes = pako.ungzip(bytes);
                    let converted = window.WorldHandler.RemapKgmapFile(decompressedBytes);
                    ServerSettings.Avatar = await window.WorldHandler.DecodeWorld(converted);
                }
            };

            reader.readAsArrayBuffer(file);
        }),
        UIHelper.createElement(0, "div", {
            text: "PLAY", class: "btn",
            event_click: async () => {
                if (LaunchedGame || !window.World) return;
                LaunchedGame = true;
                console.log("Lanching game...")
                initializeUnityPlayer("iframe-container");
                ct.style.display = "none";
            }
        })
    ]);

    onSendPlayerParams = function () {
        const wrapper = UIHelper.createElement(document.body, "div", {
            id: "loading-gear",
        });
        UIHelper.createElement(wrapper, "div", {
            id: "loading-gear-inner",
            html: UIHelper.svgs.gear,
        });
    }


    uploadBtn.addEventListener("click", function () {
        let u = document.createElement("input");
        u.type = "file";
        u.accept = ".kgm,.kgmap";
        u.click();
        u.onchange = function () {
            const file = u.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async function (e) {
                const buffer = e.target.result;
                const bytes = new Uint8Array(buffer);

                const fileExtension = getFileExtension(file.name);
                console.log("File extension: ", fileExtension);
                if (fileExtension === "kgm") {
                    window.WorldBytes = bytes;
                    window.World = await window.WorldHandler.DecodeWorld(bytes);
                } else if (fileExtension === "kgmap") {
                    const decompressedBytes = pako.ungzip(bytes);
                    window.WorldBytes = decompressedBytes;
                    let converted = window.WorldHandler.RemapKgmapFile(decompressedBytes);
                    window.World = await window.WorldHandler.DecodeWorld(converted);
                }
                uploadBtn.style.display = "none";
                container.style.display = "flex";

            };

            reader.readAsArrayBuffer(file);
        }
    });
});

