import { Deserialize, GetKeyFromValue } from "../ExitGames.Client.Photon/Protocol16Helper.js";
import { OperationHandler, InternalOperationRequestsHandler } from "./Operations.js";
import MVCommon from "./MVCommon.js";
const { MVOperationCodes } = MVCommon;
import log from "../JS/Log.js";

// Operations that fire every frame — skip verbose logging for these
const SILENT_OPS = new Set([
    "UnregisterWorldObject",
    "Join",
    "UpdateWorldObject",
    "UpdateWorldObjectRunTimeData",
    "UpdateLineOfFire",
    "UpdatePrototype",
    "SetSayChatBubbleVisible",
]);

let ActorNumber = 0;

function OnClientReady(socket) {
    ActorNumber++;

    let ws = { send: socket.sendMessage };

    ws.send(new Uint8Array([243, 1, 0]));

    const OpHandler = new OperationHandler(ws, ActorNumber);
    const InternalOpRHandler = new InternalOperationRequestsHandler(ws, ActorNumber);
    InternalOpRHandler.OpHandler = OpHandler;

    socket.close = () => {
        OpHandler.HandleClosing();
    };

    socket.send = (e) => {
        let { EgMessageType, Data } = Deserialize(new Uint8Array(e));
        let { Parameters, OperationCode } = Data;
        let OperationName = GetKeyFromValue(MVOperationCodes, OperationCode);

        //if (!SILENT_OPS.has(OperationName)) {
        //    log.debug("Handler", `${EgMessageType} → ${OperationName}`, Parameters);
        //}

        try {
            if (EgMessageType == "InternalOperationRequest") InternalOpRHandler[OperationName](Parameters);
            else OpHandler[OperationName](Parameters);
        } catch (error) {
            log.error("Handler", `Failed to handle ${OperationName}:`, error);
        }
    };

    log.success("Handler", "Fake WebSocket server initialized.");
}

export default OnClientReady;
