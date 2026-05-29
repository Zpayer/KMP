import StreamBuffer from './StreamBuffer.js';
import Protocol16 from './Protocol16.js';
import EgMessageType from './EgMessageType.js';

export function GetKeyFromValue(object, value) {
    try {
        return Object.entries(object).filter(([_, __]) => __ == value)[0][0]
    } catch {
        console.error("Couldn't find Key of --Value:" + value);
        return null;
    }
}
export let Deserialize = (data) => {
    try {
        let Protocol = new Protocol16(),
            SB = new StreamBuffer(data),
            Data = {};
        Data.MagicNumber = SB.ReadByte();
        Data.EgMessageType = GetKeyFromValue(EgMessageType, SB.ReadByte());
        if ([2, 6].includes(data[1])) Data.Data = Protocol.DeserializeOperationRequest(SB);
        else if ([3, 7].includes(data[1])) Data.Data = Protocol.DeserializeOperationResponse(SB);
        else if (data[1] == 4) Data.Data = Protocol.DeserializeEventData(SB);
        else Data.Data = data;
        return Data;
    } catch (e) {
        console.error(e);
    }
}

export let Serialize = ({ MagicNumber, Data, EgMessageType: _ }) => {
    let Protocol = new Protocol16(),
        Stream = new StreamBuffer(),
        EgMessageType_ = EgMessageType[_];
    Stream.Write([MagicNumber, EgMessageType_])
    if (4 == EgMessageType_) Protocol.SerializeEventData(Stream, Data)
    else if ([3, 7].includes(EgMessageType_)) Protocol.SerializeOperationResponse(Stream, Data);
    else if ([2, 6].includes(EgMessageType_)) Protocol.SerializeOperationRequest(Stream, Data);
    else Stream.Write([...Data])
    return new Uint8Array([...Stream.buf]);
}



