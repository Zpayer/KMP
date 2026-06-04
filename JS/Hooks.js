import log from "./Log.js";


let socket = window.socket = {
    readyState: WebSocket.OPEN,
    send: ReceiveFromClient,
    close: (e) => log.warn("Socket", "Client requested close:", e),
    _onmessage: null,
    sendMessage: function (data) {
        //log.debug("Socket", "sendMessage →", data);
        if (data instanceof Uint8Array) socket._onmessage({ data: data.buffer });
        else if (data instanceof ArrayBuffer) socket._onmessage({ data });
    },
};

WebSocket = function () { return socket; };

const oFetch = fetch; // used this cause api url was in client.
fetch = function (url, init) {
    //xp_level/init_data
    if (url.includes("xp_level/init_data")) {
        url = url.replace("xp_level/init_data/","api/xp_level.json");
    }
    return oFetch.call(this, url, init);
}



import OnClientReady from "../WebSocket/Handler.js";


function InitializeClientSpoofer() {
    log.info("Spoofer", "Started spoofing.", socket);
    OnClientReady(socket);
}

function ReceiveFromClient(data) {
    log.debug("Client→Server", data);
}

Object.defineProperty(socket, "onmessage", {
    get() {
        return socket._onmessage;
    },
    set(v) {
        socket._onmessage = v;
        InitializeClientSpoofer();
    }
});
