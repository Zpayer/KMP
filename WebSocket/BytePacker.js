import MVCommon from "./MVCommon.js";
const { WorldObjectCode } = MVCommon;
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));


function Use() {
    let types = {
        i64: [BigInt64Array, 8],
        i32: [Int32Array, 4],
        i16: [Int16Array, 2],
        i8: [Int8Array, 1],
        u64: [BigUint64Array, 8],
        u32: [Uint32Array, 4],
        u16: [Uint16Array, 2],
        u8: [Uint8Array, 1],
        f64: [Float64Array, 8],
        f32: [Float32Array, 4],
        ui16: [Uint16Array, 2],
    }
    if (arguments[0] == "set") return new Uint8Array(arguments[2] ? new types[arguments[1]][0]([arguments[2]]).buffer : new Uint8Array(types[arguments[1]][1])).reverse();
    if (arguments[0] == "get") return new types[arguments[1]][0](arguments[2] ? new Uint8Array(arguments[2]).reverse().buffer : 0)[0];

}

const RuntimeEventType = {
    "Undefined": 0,
    "FineGrainedSingleCubeAdd": 1,
    "FineGrainedSingleCubeRemove": 2,
    "Bazooka": 3,
    "AvatarImpact25": 4,
    "FineGrainedSingleCubeRemovedAddedFineGrainedCube": 5,
    "VehicleImpact25": 6,
    "AvatarImpact50": 7,
    "AvatarImpact75": 8,
    "VehicleImpact50": 9,
    "VehicleImpact75": 10,
    "SwordTerrainDestroy": 15,
    "ImpulseGunImpact": 16
}
const WorldObjectTypes = Object.fromEntries(Object.entries(WorldObjectCode).map(a => a.reverse()));
export class StreamBuffer {
    constructor(array = []) {
        this.index = 0;
        this.array = [...array];
    }
    ReadByte() {
        return this.array[this.index++];
    }
    Read(count) {
        let arr = this.array.slice(this.index, this.index + count);
        this.index += count;
        return arr;
    }
    ReadInt(le = true) {
        let arr = this.Read(4);
        if (!le) arr = arr.reverse();
        return Use("get", "i32", arr);
    }
    ReadUint(le = true) {
        let arr = this.Read(4);
        if (!le) arr = arr.reverse();
        return Use("get", "u32", arr);
    }
    ReadShort() {
        let arr = this.Read(2);
        return Use("get", "i16", arr);
    }
    ReadUshort(le = true) {
        let arr = this.Read(2);
                if (!le) arr = arr.reverse();
        return Use("get", "u16", arr);
    }
    ReadFloat() {
        let arr = this.Read(4);
        return Use("get", "f32", arr);
    }
    ReadBool() {
        return !!this.ReadByte();
    }
    ReadString(size = -1) {
        size = size + 1 ? size : this.ReadShort();
        return new TextDecoder().decode(new Uint8Array(this.Read(size)));
    }
    ReadLong() {
        let arr = this.Read(8);
        return Use("get", "i64", arr);
    }
    ReadByteArray(size = -1) {
        size = size + 1 ? size : this.ReadInt();
        return this.Read(size);
    }
    ReadCompressedUInt32() {
        let num = 0;
        let num2 = 0;
        while (num2 != 35) {
            let b = this.ReadByte();
            num |= (b & 127) << num2;
            if ((b & 128) == 0) { return num; }
            num2 += 7;
        }
    };
    WriteByte(byte) {
        this.array.push(byte);
        this.index++;
    }
    Write(array) {
        this.array.push(...array);
        this.index += array.length;
    }
    WriteInt(int) {
        this.Write(Use("set", "i32", int));
        this.index += 4;
    }
    WriteShort(int) {
        this.Write(Use("set", "i16", int));
        this.index += 2;
    }
    WriteFloat(float) {
        this.Write(Use("set", "f32", float));
        this.index += 4;
    }
    WriteBool(bool) {
        this.WriteByte(bool ? 1 : 0);
        this.index++;
    }
    WriteString(string, s = true) {
        s ? this.WriteShort(string.length) : null;
        this.Write([...string].map(l => l.charCodeAt(0)));
        this.index += string.length;
    }
    WriteLong(long) {
        this.Write(Use("set", "i64", long));
        this.index += 8;
    }
    WriteByteArray(array) {
        this.WriteInt(array.length)
        this.Write(array);
        this.index += array.length;
    }
    WriteCompressedUInt32(num) {
        while (num >= 128) {
            this.WriteByte((num | 128) & 0xFF);
            num >>= 7;
        }
        this.WriteByte(num & 0xFF);
    };
}
const getRunTimeData = (buf, isPosAnArray = true) => {
    let i = Object.fromEntries(Object.entries(MVCommon.RuntimeEventType).map(e => e.reverse())),
        typekey = buf.ReadByte(),
        material = -1,
        objectType = "Undefined",
        type = i[typekey] || "Undefined";
    if ([1, 2, 5].includes(typekey)) {
        objectType = "SingleCube";
        if (typekey == 1) material = buf.ReadByte();
    } else objectType = "Explosion";
    let x = buf.ReadShort(),
        y = buf.ReadShort(),
        z = buf.ReadShort();

    return Object.assign({ objectType, type }, material >= 0 ? { material } : {}, isPosAnArray ? { pos: [x, y, z] } : { x, y, z })
}
const getCube = (buf, isPosAnArray = true, Type) => {
    let c = {};
    //c.action = new Byte().read(buf);
    let x = buf.ReadShort(),
        y = buf.ReadShort(),
        z = buf.ReadShort();
    c = Object.assign(c, isPosAnArray ? { pos: [x, y, z] } : { x, y, z });
    if (Type) {
        c.flags = buf.ReadByte();
        if ((c.flags & 1) == 0) c.corners = [...buf.ReadByteArray(8)];
        if ((c.flags & 2) == 0) c.materials = [...buf.ReadByteArray(6)];
        else c.material = buf.ReadByte();
    }
    return c;
}
const getWorldCubes = buf0 => {
    let buf = new StreamBuffer(buf0.ReadByteArray());
    let chunk = [];
    let num = buf.ReadInt();
    console.log("Cubes:", num)
    for (let i = 0; i < num; i++) {
        let cube = Object.assign(getCube(buf, false, 1), { inRow: false });
        chunk.push(cube);
        //console.log(cube)
        for (let i2 = 1; i2 < (cube.flags >> 2); i2++) {
            let clone = Object.assign({}, cube, { inRow: true });
            clone.x += i2;
            chunk.push(clone);
        }
    }
    return chunk;
};
const getWorldPrototypes = async buf => {
    let chunk = [], count = buf.ReadInt();
    console.log("Prototypes:", count)
    for (let i = 0; i < count; i++) {
        if (i % 99 == 0) await sleep(100);
        let Id = buf.ReadInt();
        let Scale = buf.ReadFloat();
        let AuthorProfileId = buf.ReadInt();
        let Data = getWorldCubes(buf)
        chunk.push({ Id, Scale, AuthorProfileId, Data });
    }
    return chunk;
};
const getWorldObjectData = buf => {
    let data = {};
    let num = buf.ReadInt();
    if (num > 1e3) throw "Params Can Never Reach 1e3 in length";
    for (let i2 = 0; i2 < num; i2++) {
        const key = buf.ReadString(buf.ReadCompressedUInt32());
        const type = buf.ReadByte();
        //DictPackerDataTypes[key]=TypeGameSnapShot[type]
        let value = 0;
        let len2 = 0;
        switch (type) {
            case 0:
                value = buf.ReadInt();
                break;
            case 1://int array
                value = [];
                len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) {
                    value.push(buf.ReadInt());
                }
                break;
            case 2:
                value = buf.ReadFloat();
                break;
            case 3:
                value = [];
                len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) {
                    value.push(buf.ReadFloat());
                }
                break;
            case 5:
                value = buf.ReadBool();
                break;
            case 6:
                value = [];
                len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) {
                    value.push(buf.ReadBool());
                }
                break;
            case 7:
                value = buf.ReadString(buf.ReadCompressedUInt32())
                break;
            case 8:
                value = getWorldObjectData(buf)
                break;
            case 9:
                value = buf.ReadByte();
                break;
            case 10:
                value = buf.ReadLong();
                break;
            case 11:
                value = [];
                len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) value.push(buf.ReadLong());
                break;
        }
        data[key] = type == 8 ? value : [value, type];
    }
    return data;
};
const getWorldObjects = async buf => {

    let chunk = [],
        count = buf.ReadInt();
    console.log("Objects:", count)
    for (let i = 0; i < count; i++) {
        if (i % 99 == 0) await sleep(1);
        let Id = buf.ReadInt();
        let GroupId = buf.ReadInt();
        let ItemId = buf.ReadInt();
        let WorldObjectType = buf.ReadInt();
        let WorldObjectTypeId = WorldObjectType
        WorldObjectType = WorldObjectTypes[WorldObjectTypeId] || WorldObjectTypeId;
        let Position = { X: buf.ReadFloat(), Y: buf.ReadFloat(), Z: buf.ReadFloat() };
        let Rotation = { X: buf.ReadFloat(), Y: buf.ReadFloat(), Z: buf.ReadFloat(), W: buf.ReadFloat() };
        let Scale = { X: buf.ReadFloat(), Y: buf.ReadFloat(), Z: buf.ReadFloat() };
        let Data = getWorldObjectData(buf);
        let OwnerShipFlag = buf.ReadByte();
        let PreviewOwnerProfileId = null;
        let OwnerActorNumber = null;
        if ((OwnerShipFlag & 1) != 0) OwnerActorNumber = buf.ReadInt();
        if ((OwnerShipFlag & 2) != 0) PreviewOwnerProfileId = buf.ReadInt();
        let RuntimeData = getWorldObjectData(buf);
        chunk.push({
            Id,
            GroupId,
            ItemId,
            WorldObjectType,
            WorldObjectTypeId,
            Position,
            Rotation,
            Scale,
            Data,
            OwnerShipFlag,
            OwnerActorNumber,
            PreviewOwnerProfileId,
            RuntimeData
        });
    }
    return chunk;
};
const getLinks = async buf => {
    let chunk = [],
        count = buf.ReadInt();
    console.log("Links:", count)
    for (let i = 0; i < count; i++) {
        if (i % 99 == 0) await sleep(1);
        let Id = buf.ReadInt();
        let LinkToID = buf.ReadInt();
        let LinkFromID = buf.ReadInt();
        chunk.push({ Id, LinkToID, LinkFromID });
    }
    return chunk;
};
const getWorldRunTimeData = buf => {
    let chunk = [];
    let num = buf.ReadInt();
    for (let i = 0; i < num; i++) chunk.push(getRunTimeData(buf, false));
    return chunk;
};

const setCube = (buf, c, Type) => {
    buf.WriteShort(c.pos ? c.pos[0] : c.x);
    buf.WriteShort(c.pos ? c.pos[1] : c.y);
    buf.WriteShort(c.pos ? c.pos[2] : c.z);
    buf.WriteByte(c.flags);
    if (Type) {
        if ((c.flags & 1) == 0) buf.Write(c.corners);
        if ((c.flags & 2) == 0) buf.Write(c.materials);
        else buf.WriteByte(c.material);
    }
}
const setWorldCubes = (buf, Data) => {
    let dataStream = new StreamBuffer();
    const CubesInRow = Data.filter(cube => !cube.inRow);
    dataStream.WriteInt(CubesInRow.length);
    for (let cube of CubesInRow) {
        setCube(dataStream, cube, true);
    }
    buf.WriteByteArray(dataStream.array);
}
const setWorldPrototypes = async (buf, Data) => {
    buf.WriteInt(Data.length)
    for (let { Id, Scale, AuthorProfileId, Data: _ } of Data) {
        buf.WriteInt(Id);
        buf.WriteFloat(Scale);
        buf.WriteInt(AuthorProfileId);
        setWorldCubes(buf, _);
    }
    return buf;
}
const setWorldObjectData = (buf, Data) => {
    const entries = Object.entries(Data);
    buf.WriteInt(entries.length);
    for (let entry of entries) {
        let type = null;
        let value = null;
        let key = entry[0];
        if (entry[1].length == undefined) (type = 8, value = entry[1])
        if (entry[1].length != undefined) (type = entry[1][1], value = entry[1][0])
        buf.WriteCompressedUInt32(key.length);
        buf.WriteString(key, 0);
        buf.WriteByte(type);
        switch (type) {
            case 0: {
                buf.WriteInt(value);
            }
                break;
            case 1: case 4: {
                buf.WriteInt(Object.keys(value).length);
                for (let i = 0; i < Object.keys(value).length; i++) {
                    buf.WriteInt(Object.keys(value)[i]);
                }
            }
                break;
            case 2: {
                buf.WriteFloat(value);
            }
                break;
            case 3: {
                buf.WriteInt(value.length);
                for (let i = 0; i < value.length; i++) buf.WriteFloat(value[i]);
            }
                break;
            case 5: {
                buf.WriteBool(value)
            }
                break;
            case 6: {
                buf.WriteInt(value.length);
                for (let i = 0; i < value.length; i++) buf.WriteBool(value[i])
            }
                break;
            case 7: {
                buf.WriteCompressedUInt32(value.length);
                buf.WriteString(value, 0);
            }
                break;
            case 8: {
                setWorldObjectData(buf, value);
            }
                break;
            case 9: {
                buf.WriteByte(value)
            }
                break;
            case 10: {
                buf.WriteLong(value);
            }
                break;
            case 11: {
                buf.WriteInt(value.length);
                for (let i = 0; i < value.length; i++) buf.WriteLong(value[i]);

            }
                break;
            default:
                throw new Error("Unknown Type: " + type + " || " + JSON.stringify(value))
        }
    }
}
const setWorldObjects = async (buf, Data) => {
    buf.WriteInt(Data.length)

    for (let { OwnerActorNumber, RuntimeData, PreviewOwnerProfileId, Id, GroupId, ItemId, WorldObjectTypeId, Data: _d, Position: { X, Y, Z }, Rotation: { X: X1, Y: Y1, Z: Z1, W }, Scale: { X: SX, Y: SY, Z: SZ } } of Data) {
        buf.WriteInt(Id);
        buf.WriteInt(GroupId);
        buf.WriteInt(ItemId);
        buf.WriteInt(WorldObjectTypeId);

        buf.WriteFloat(X);
        buf.WriteFloat(Y);
        buf.WriteFloat(Z);

        buf.WriteFloat(X1);
        buf.WriteFloat(Y1);
        buf.WriteFloat(Z1);
        buf.WriteFloat(W);

        buf.WriteFloat(SX);
        buf.WriteFloat(SY);
        buf.WriteFloat(SZ);

        setWorldObjectData(buf, _d);
        let flag = 0;
        if (OwnerActorNumber != null && PreviewOwnerProfileId == null) flag = 1;
        if (OwnerActorNumber == null && PreviewOwnerProfileId != null) flag = 2;
        if (OwnerActorNumber != null && PreviewOwnerProfileId != null) flag = 3;
        buf.WriteByte(flag);

        if ((flag & 1) != 0) buf.WriteInt(OwnerActorNumber);
        if ((flag & 2) != 0) buf.WriteInt(PreviewOwnerProfileId);

        setWorldObjectData(buf, RuntimeData);
    }
    return buf
}
const setLinks = async (buf, Data) => {
    buf.WriteInt(Data.length)
    for (let { Id, LinkFromID, LinkToID } of Data) {
        buf.WriteInt(Id)
        buf.WriteInt(LinkFromID)
        buf.WriteInt(LinkToID)
    }
    return buf
}
const setWorldRuntimeEvents = async (buf, Data) => {
    buf.WriteInt(Data.length)
    return buf
}

export const getWorldData = async (buf, callback) => {
    let chunk = {};
    chunk.Prototypes = await getWorldPrototypes(buf);
    callback(25)
    chunk.WorldObjects = await getWorldObjects(buf);
    callback(50)
    chunk.Links = await getLinks(buf);
    callback(75)
    chunk.ObjectLinks = await getLinks(buf);
    callback(100)
    //chunk.RunTimeData = await getWorldRunTimeData(buf);
    return chunk;
};
export const setWorldData = async (Data, callback) => {
    callback ??= _ => 0;
    let buf = new StreamBuffer();
    await setWorldPrototypes(buf, Data.Prototypes);
    callback(25);
    await setWorldObjects(buf, Data.WorldObjects);
    callback(50);
    await setLinks(buf, Data.Links);
    callback(75);
    await setLinks(buf, Data.ObjectLinks);
    buf.WriteInt(0); //RunTimeData
    callback(100);
    return new Uint8Array(buf.array);
};

//______________________


export const getWorldInventoryData = (e) => {
    let buf = new StreamBuffer(e),
        action = buf.ReadByte(),
        c = getCube(buf, false, action);
    c.action = action;
    return c;
}
export const setWorldInventoryData = (c) => {
    let buf = new StreamBuffer();
    buf.Write(c.action);
    setCube(buf, c, c.action);
    return buf.array;
}
