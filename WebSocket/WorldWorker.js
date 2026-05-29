/**
 * WorldWorker.js — Web Worker for world encode/decode
 * Logic is copied verbatim from BytePacker.js — no rewrites.
 * The only changes: no import/export, no async/await (not needed off-thread).
 */

// ─── Inline WorldObjectCode (can't import in a classic worker) ────────────────
const WorldObjectCode = {
    "PlayModeAvatar":0,"CubeModel":1,"PointLight":2,"TriggerBox":3,"Mover":4,
    "Path":5,"PathNode":6,"SpawnPoint":7,"CubeModelPrototypeTerrain":8,"Group":9,
    "Action":10,"BlueprintActivator":11,"ParticleEmitter":12,"SoundEmitter":13,
    "BlueprintFire":14,"BlueprintSmoke":15,"BlueprintExplosion":16,"Flag":17,
    "TestLogicCube":18,"Battery":19,"ToggleBox":20,"Negate":21,"And":22,
    "Explosives":23,"TextMsg":24,"Fire":25,"Smoke":26,"TimeTrigger":27,
    "Teleporter":28,"Goal":29,"PickupItemHealthPack":30,"PickupItemCenterGun":31,
    "CubeModelTerrainFineGrained":32,"PressurePlate":33,"PickupItemImpulseGun":34,
    "PickupItemBazookaGun":35,"PickupItemRailGun":36,"PickupItemSpawner":37,
    "Skybox":38,"SpawnPointRed":39,"SpawnPointGreen":40,"SpawnPointYellow":41,
    "SpawnPointBlue":42,"ModelToggle":43,"WaterPlane":44,"Blueprint":45,
    "PulseBox":46,"RandomBox":47,"SentryGun":48,"CollectibleItem":49,
    "MovingPlatformNode":50,"WaterPlanePreset":51,"LightPreset":52,"Ghost":53,
    "PickupCubeGun":54,"CheckPoint":55,"HoverCraft":56,"WorldObjectSpawnerVehicle":57,
    "MonoPlane":58,"JetPack":59,"RoundCube":60,"AdvancedGhost":61,"HamsterWheel":62,
    "KillLimit":63,"OculusKillLimit":64,"CountingCube":65,"VehicleEnergy":118,
    "WorldObjectSpawnerVehicleEnergy":119,"Jakob6":120,"Jakob7":121,"Jakob8":122,
    "Jakob9":123,"Jakob10":124,"Jakob11":125,"Jakob12":126,"Jakob13":127,
    "Jakob14":128,"Jakob15":129,"GamePoint":130,"GamePassProgressionDataObject":131,
    "Christian3":132,"BuildModeAvatar":133,"AvatarSpawnRoleCreator":134,
    "GameOptionsDataObject":135,"ModelTransparency":136,"Christian8":137,
    "Christian9":138,"Christian10":139,"Christian11":140,"Christian12":141,
    "Christian13":142,"Christian14":143,"Christian15":144,"CameraSettings":145,
    "GravityCube":146,"GameCoin":148,"GameCoinChest":149,"Theme":150,"Door":151,
    "BlueprintDoor":152,"PickupMeleeWeapon":153,"BlueprintMeleeWeapon":154,
    "PickupCostume":155,"BlueprintCostume":156,"PickupCustomGun":157,
    "BlueprintCustomGun":158,"Caspar15":159,"ShrinkGun":160,"TeamEditor":161,
    "TriggerCube":162,"Thomas4":163,"CollectTheItemCollectableInstance":164,
    "ShootableButton":165,"UseLever":166,"CollectTheItemDropOff":167,
    "CollectTheItemCollectable":168,"CollectTheItem":169,"WindTurbine":170,
    "GlobalSoundEmitter":171,"Mathias3":172,"Mathias4":173,"Mathias5":174,
    "Mathias6":175,"Mathias7":176,"Mathias8":177,"Mathias9":178,"Mathias10":179,
    "TimeAttackFlag":180,"GamePointChest":181,"Marcus3":182,"Marcus4":183,
    "Marcus5":184,"Marcus6":185,"Marcus7":186,"Marcus8":187,"Marcus9":188,
    "Marcus10":189
};

const WorldObjectTypes = Object.fromEntries(Object.entries(WorldObjectCode).map(a => a.reverse()));

// ─── Use() — exact copy from BytePacker.js ───────────────────────────────────
function Use() {
    const types = {
        i64: [BigInt64Array, 8],
        i32: [Int32Array, 4],
        i16: [Int16Array, 2],
        i8:  [Int8Array, 1],
        u64: [BigUint64Array, 8],
        u32: [Uint32Array, 4],
        u16: [Uint16Array, 2],
        u8:  [Uint8Array, 1],
        f64: [Float64Array, 8],
        f32: [Float32Array, 4],
        ui16:[Uint16Array, 2],
    };
    if (arguments[0] == "set") return new Uint8Array(arguments[2] ? new types[arguments[1]][0]([arguments[2]]).buffer : new Uint8Array(types[arguments[1]][1])).reverse();
    if (arguments[0] == "get") return new types[arguments[1]][0](arguments[2] ? new Uint8Array(arguments[2]).reverse().buffer : 0)[0];
}

// ─── StreamBuffer — exact copy from BytePacker.js ────────────────────────────
class StreamBuffer {
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
    ReadInt() {
        let arr = this.Read(4);
        return Use("get", "i32", arr);
    }
    ReadShort() {
        let arr = this.Read(2);
        return Use("get", "i16", arr);
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
    }
    WriteByte(byte) {
        this.array.push(byte);
        this.index++;
    }
    Write(array) {
        for (let i = 0; i < array.length; i++) this.array.push(array[i]);
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
        this.WriteInt(array.length);
        this.Write(array);
        this.index += array.length;
    }
    WriteCompressedUInt32(num) {
        while (num >= 128) {
            this.WriteByte((num | 128) & 0xFF);
            num >>= 7;
        }
        this.WriteByte(num & 0xFF);
    }
}

// ─── Decode — exact logic from BytePacker.js (async removed, not needed) ─────
const getCube = (buf, isPosAnArray = true, Type) => {
    let c = {};
    let x = buf.ReadShort(), y = buf.ReadShort(), z = buf.ReadShort();
    c = Object.assign(c, isPosAnArray ? { pos: [x, y, z] } : { x, y, z });
    if (Type) {
        c.flags = buf.ReadByte();
        if ((c.flags & 1) == 0) c.corners   = [...buf.ReadByteArray(8)];
        if ((c.flags & 2) == 0) c.materials = [...buf.ReadByteArray(6)];
        else c.material = buf.ReadByte();
    }
    return c;
};

const getWorldCubes = buf0 => {
    let buf = new StreamBuffer(buf0.ReadByteArray());
    let chunk = [];
    let num = buf.ReadInt();
    for (let i = 0; i < num; i++) {
        let cube = Object.assign(getCube(buf, false, 1), { inRow: false });
        chunk.push(cube);
        for (let i2 = 1; i2 < (cube.flags >> 2); i2++) {
            let clone = Object.assign({}, cube, { inRow: true });
            clone.x += i2;
            chunk.push(clone);
        }
    }
    return chunk;
};

const getWorldPrototypes = buf => {
    let chunk = [], count = buf.ReadInt();
    for (let i = 0; i < count; i++) {
        let Id = buf.ReadInt();
        let Scale = buf.ReadFloat();
        let AuthorProfileId = buf.ReadInt();
        let Data = getWorldCubes(buf);
        chunk.push({ Id, Scale, AuthorProfileId, Data });
    }
    return chunk;
};

const getWorldObjectData = buf => {
    let data = {};
    let num = buf.ReadInt();
    if (num > 1e3) throw "Params Can Never Reach 1e3 in length";
    for (let i2 = 0; i2 < num; i2++) {
        const key  = buf.ReadString(buf.ReadCompressedUInt32());
        const type = buf.ReadByte();
        let value = 0;
        let len2  = 0;
        switch (type) {
            case 0:  value = buf.ReadInt();   break;
            case 1:
                value = []; len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) value.push(buf.ReadInt());
                break;
            case 2:  value = buf.ReadFloat(); break;
            case 3:
                value = []; len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) value.push(buf.ReadFloat());
                break;
            case 5:  value = buf.ReadBool();  break;
            case 6:
                value = []; len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) value.push(buf.ReadBool());
                break;
            case 7:  value = buf.ReadString(buf.ReadCompressedUInt32()); break;
            case 8:  value = getWorldObjectData(buf); break;
            case 9:  value = buf.ReadByte();  break;
            case 10: value = buf.ReadLong();  break;
            case 11:
                value = []; len2 = buf.ReadInt();
                for (let i = 0; i < len2; i++) value.push(buf.ReadLong());
                break;
        }
        data[key] = type == 8 ? value : [value, type];
    }
    return data;
};

const getWorldObjects = buf => {
    let chunk = [], count = buf.ReadInt();
    for (let i = 0; i < count; i++) {
        let Id = buf.ReadInt();
        let GroupId = buf.ReadInt();
        let ItemId = buf.ReadInt();
        let WorldObjectType = buf.ReadInt();
        let WorldObjectTypeId = WorldObjectType;
        WorldObjectType = WorldObjectTypes[WorldObjectTypeId] || WorldObjectTypeId;
        let Position = { X: buf.ReadFloat(), Y: buf.ReadFloat(), Z: buf.ReadFloat() };
        let Rotation = { X: buf.ReadFloat(), Y: buf.ReadFloat(), Z: buf.ReadFloat(), W: buf.ReadFloat() };
        let Scale    = { X: buf.ReadFloat(), Y: buf.ReadFloat(), Z: buf.ReadFloat() };
        let Data     = getWorldObjectData(buf);
        let OwnerShipFlag = buf.ReadByte();
        let PreviewOwnerProfileId = null;
        let OwnerActorNumber = null;
        if ((OwnerShipFlag & 1) != 0) OwnerActorNumber      = buf.ReadInt();
        if ((OwnerShipFlag & 2) != 0) PreviewOwnerProfileId = buf.ReadInt();
        let RuntimeData = getWorldObjectData(buf);
        chunk.push({ Id, GroupId, ItemId, WorldObjectType, WorldObjectTypeId,
                     Position, Rotation, Scale, Data, OwnerShipFlag,
                     OwnerActorNumber, PreviewOwnerProfileId, RuntimeData });
    }
    return chunk;
};

const getLinks = buf => {
    let chunk = [], count = buf.ReadInt();
    for (let i = 0; i < count; i++) {
        let Id = buf.ReadInt();
        let LinkToID = buf.ReadInt();
        let LinkFromID = buf.ReadInt();
        chunk.push({ Id, LinkToID, LinkFromID });
    }
    return chunk;
};

// ─── Encode — exact logic from BytePacker.js (async removed) ─────────────────
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
};

const setWorldCubes = (buf, Data) => {
    let dataStream = new StreamBuffer();
    const CubesInRow = Data.filter(cube => !cube.inRow);
    dataStream.WriteInt(CubesInRow.length);
    for (let cube of CubesInRow) setCube(dataStream, cube, true);
    buf.WriteByteArray(dataStream.array);
};

const setWorldPrototypes = (buf, Data) => {
    buf.WriteInt(Data.length);
    for (let { Id, Scale, AuthorProfileId, Data: _ } of Data) {
        buf.WriteInt(Id);
        buf.WriteFloat(Scale);
        buf.WriteInt(AuthorProfileId);
        setWorldCubes(buf, _);
    }
};

const setWorldObjectData = (buf, Data) => {
    const entries = Object.entries(Data);
    buf.WriteInt(entries.length);
    for (let entry of entries) {
        let type  = null;
        let value = null;
        let key   = entry[0];
        if (entry[1].length == undefined) (type = 8,          value = entry[1])
        if (entry[1].length != undefined) (type = entry[1][1], value = entry[1][0])
        buf.WriteCompressedUInt32(key.length);
        buf.WriteString(key, 0);
        buf.WriteByte(type);
        switch (type) {
            case 0:  buf.WriteInt(value);   break;
            case 1: case 4: {
                buf.WriteInt(Object.keys(value).length);
                for (let i = 0; i < Object.keys(value).length; i++) {
                    buf.WriteInt(Object.keys(value)[i]);
                }
                break;
            }
            case 2:  buf.WriteFloat(value); break;
            case 3: {
                buf.WriteInt(value.length);
                for (let i = 0; i < value.length; i++) buf.WriteFloat(value[i]);
                break;
            }
            case 5:  buf.WriteBool(value);  break;
            case 6: {
                buf.WriteInt(value.length);
                for (let i = 0; i < value.length; i++) buf.WriteBool(value[i]);
                break;
            }
            case 7: {
                buf.WriteCompressedUInt32(value.length);
                buf.WriteString(value, 0);
                break;
            }
            case 8:  setWorldObjectData(buf, value); break;
            case 9:  buf.WriteByte(value);  break;
            case 10: buf.WriteLong(value);  break;
            case 11: {
                buf.WriteInt(value.length);
                for (let i = 0; i < value.length; i++) buf.WriteLong(value[i]);
                break;
            }
            default:
                throw new Error("Unknown Type: " + type + " || " + JSON.stringify(value));
        }
    }
};

const setWorldObjects = (buf, Data) => {
    buf.WriteInt(Data.length);
    for (let { OwnerActorNumber, RuntimeData, PreviewOwnerProfileId, Id, GroupId, ItemId,
               WorldObjectTypeId, Data: _d,
               Position: { X, Y, Z },
               Rotation: { X: X1, Y: Y1, Z: Z1, W },
               Scale:    { X: SX, Y: SY, Z: SZ } } of Data) {
        buf.WriteInt(Id);
        buf.WriteInt(GroupId);
        buf.WriteInt(ItemId);
        buf.WriteInt(WorldObjectTypeId);
        buf.WriteFloat(X);  buf.WriteFloat(Y);  buf.WriteFloat(Z);
        buf.WriteFloat(X1); buf.WriteFloat(Y1); buf.WriteFloat(Z1); buf.WriteFloat(W);
        buf.WriteFloat(SX); buf.WriteFloat(SY); buf.WriteFloat(SZ);
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
};

const setLinks = (buf, Data) => {
    buf.WriteInt(Data.length);
    for (let { Id, LinkFromID, LinkToID } of Data) {
        buf.WriteInt(Id);
        buf.WriteInt(LinkFromID);
        buf.WriteInt(LinkToID);
    }
};

// ─── Entry points ─────────────────────────────────────────────────────────────
function workerGetWorldData(bytes) {
    const buf = new StreamBuffer(bytes);
    const chunk = {};
    chunk.Prototypes   = getWorldPrototypes(buf);
    chunk.WorldObjects = getWorldObjects(buf);
    chunk.Links        = getLinks(buf);
    chunk.ObjectLinks  = getLinks(buf);
    return chunk;
}

function workerSetWorldData(Data) {
    const buf = new StreamBuffer();
    setWorldPrototypes(buf, Data.Prototypes);
    setWorldObjects(buf, Data.WorldObjects);
    setLinks(buf, Data.Links);
    setLinks(buf, Data.ObjectLinks);
    buf.WriteInt(0); // RunTimeData placeholder
    return new Uint8Array(buf.array);
}

// ─── Worker message handler ───────────────────────────────────────────────────
self.onmessage = function ({ data }) {
    const { id, type, payload } = data;
    try {
        if (type === 'decode') {
            const bytes  = payload instanceof ArrayBuffer ? [...new Uint8Array(payload)] : payload;
            const result = workerGetWorldData(bytes);
            self.postMessage({ id, type: 'decode', result });

        } else if (type === 'encode') {
            const bytes = workerSetWorldData(payload);
            const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
            self.postMessage({ id, type: 'encode', result: ab }, [ab]);

        } else {
            self.postMessage({ id, error: 'Unknown type: ' + type });
        }
    } catch (err) {
        self.postMessage({ id, error: err.message || String(err) });
    }
};
