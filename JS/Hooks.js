

let socket = window.socket = {
    readyState: WebSocket.OPEN,
    send: ReceiveFromClient,
    close: (e) => console.log("client wanna close ws" + e),
    _onmessage: null,
    sendMessage: function (data) {
        console.log(data)
        if (data instanceof Uint8Array) socket._onmessage({ data: data.buffer })
        else if (data instanceof ArrayBuffer) socket._onmessage({ data })
    },
};


WebSocket = function () { return socket }


const logger = document.querySelector("#log");

const log = console.log;
console.log = function (...args) {
    try {
        if (logger.isConnected) {
            let elem = document.createElement("div");
            args.forEach(l => {
                if (typeof l == "string") elem.textContent += l;
                else if (typeof l == "object") elem.textContent += JSON.stringify(l, null, 2);
                else elem.textContent += l;
                elem.textContent += " ";
            })
            logger.appendChild(elem);
            logger.scrollTop = logger.scrollHeight;
        }
    } catch { }
    log(...args);
}

import OnClientReady from "../WebSocket/Handler.js"


function InitializeClientSpoofer() {
    console.log("Started Spoofing.", socket)
    OnClientReady(socket);
}

function ReceiveFromClient(data) {
    console.log(data)
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

