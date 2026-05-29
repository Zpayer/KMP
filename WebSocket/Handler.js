
import { Deserialize, GetKeyFromValue } from "../ExitGames.Client.Photon/Protocol16Helper.js";
import { OperationHandler, InternalOperationRequestsHandler } from "./Operations.js";
import MVCommon from "./MVCommon.js";
const { MVOperationCodes } = MVCommon;

let ActorNumber = 0;


function OnClientReady(socket) {
    ActorNumber++;

    let ws = {
        send: socket.sendMessage,
    }

    ws.send(new Uint8Array([243, 1, 0]));
    const OpHandler = new OperationHandler(ws, ActorNumber);
    const InternalOpRHandler = new InternalOperationRequestsHandler(ws, ActorNumber);

    socket.close = () => {
        OpHandler.HandleClosing();
    };
    socket.send = (e) => {
        let { MagicNumber, EgMessageType, Data } = Deserialize(new Uint8Array(e));
        let { Parameters, OperationCode } = Data;
        console.log(Data)
        let OperationName = GetKeyFromValue(MVOperationCodes, OperationCode);

        if (!`UnregisterWorldObject
            Join
            UpdateWorldObject
            UpdateWorldObjectRunTimeData
            UpdateLineOfFire
            UpdatePrototype
            SetSayChatBubbleVisible
            `.includes(OperationName)) console.log(EgMessageType, OperationName, Parameters);

        try {
            if (EgMessageType == "InternalOperationRequest") InternalOpRHandler[OperationName](Parameters);
            else OpHandler[OperationName](Parameters);
        } catch (error) {
            console.log(error)
        }
    };

    console.log("Initialized Fake WebSocket Server.");
}

export default OnClientReady;
