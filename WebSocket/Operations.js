import { Serialize } from "../ExitGames.Client.Photon/Protocol16Helper.js";
import { Int, Null, String, Dictionary, Float, Byte } from "../ExitGames.Client.Photon/Protocol16Classes.js";
import MVCommon from "./MVCommon.js";
const { MVEventCodes, MVGameStateType } = MVCommon;
import {
    WorldObjectRPCEvent, UpdatePrototype, UpdateLineOfFire, PickupItemStateChange,
    SetTeam, PostChatMsg, UpdateWorldObject, GameStateChange, PurchaseProduct,
    UpdateWorldObjectRunTimeData, NextLevelGoldReward, UpdateWorldObjectDataPartial,
    SetAvatarAccessorySlot, PendingByteDataBatch, GameSnapshotData, LogicFrame,
    SetupUserPlayMode, SetupUserBuildMode, GetPublishedPlanetProfileData, GetProfileMetaData, Join,
    RequestMaterials, GetSubscriptionPerksData, GetKogamaVat, SetActorReady,
    CollectiblePickedUp,
    PostWinnerReport,
    UpdateGameStat,
    SpawnVehicleWithDriver,
    SpawnVehicleWithDriverOpRes,
    DetachWorldObjectFromVehicle,
    DetachWorldObjectFromVehicleOpRes,
    AttachWorldObjectToSeat,
    AttachWorldObjectToSeatOpRes,
    UnregisterWorldObject,
    LogicObjectFiringStateChange,
    TriggerBoxEnter,
    TriggerBoxExit,
    SetActiveSpawnRole,
    CreateSpawnRoleOpRes,
    CloneWorldObjectTree,
    SetSpawnRoleBody
} from "./Events.js";

import { setWorldData } from "./WorldWorkerBridge.js";
import AccessoriesData from "./Assets/Accessories.js";
import GameSnapShotHelper from "./GameSnapShotHelper.js";
import log from "../JS/Log.js";
import { StreamBuffer } from "./BytePacker.js";

const sleep = (e) => new Promise((resolve) => setTimeout(resolve, e));


let PickupItemStateTimeOut = 1e3;

const MagicNumber = 243;

function GetTimeTick() {
    return Math.floor(performance.now() * 1000);
}
function GetValueFromDictionaryKey(Dict, Key) {
    return Dict.Value.find(l => l.Key.Value == Key).Value;
}
function GetKeyFromValue(object, predicate) {
    if (!object || typeof object !== "object" || typeof predicate !== "function") {
        throw new TypeError("Invalid arguments: object must be an object and predicate must be a function");
    }
    const entry = Object.entries(object).find(([, value]) => predicate(value));
    return entry ? entry[0] : undefined;
}
function DictionaryToObject(dictValue) {
    let obj = {};
    dictValue.forEach(({ Key, Value }) => {
        let value_;
        switch (Value.TypeCode) {
            case 105:
                value_ = [Value.Value, 0];
                break;
            case 102:
                value_ = [Value.Value, 2];
                break;
            case 121: {
                if (Value.TypeOfValues === 105) value_ = [Value.Value.map(l => l.Value), 1];
                else if (Value.TypeOfValues === 102) value_ = [Value.Value.map(l => l.Value), 2];
                else if (Value.TypeOfValues === 111) value_ = [Value.Value.map(l => l.Value), 6];
                else if (Value.TypeOfValues === 108) value_ = [Value.Value.map(l => l.Value), 11];
            }
                break;
            case 111:
                value_ = [Value.Value, 5];
                break;
            case 115:
                value_ = [Value.Value, 7];
                break;
            case 68:
                value_ = DictionaryToObject(Value.Value);
                break;
            case 98:
                value_ = [Value.Value, 9];
                break;
            case 108:
                value_ = [Value.Value, 10];
                break;
        }
        obj[Key.Value] = value_;
    });
    return obj;
}
function getTimestamp() {
    return Math.round(Date.now() / 1e9) * 1e3;
}

class RoundManager {
    static GameStatCounterType = {
        None: 0,
        Kill: 1,
        Flag: 2,
        Collectible: 3,
        Time: 4,
        FlagCaptured: 5,
        OculusKill: 6,
        GameCoin: 7,
        TimeAttackFlag: 8
    }
    State = 2;
    StateStartTime = 0;
    StateDuration = 1e4;
    StateCounterData = [0, 0, 0, 0]
    constructor() { }
}

export class OperationHandler {
    constructor(Socket, ActorNr) {
        this.ActorNr = ActorNr;
        this.Socket = Socket;
        this.Data = { ActorNr };
        this.GameSnapShotManager = new GameSnapShotHelper(window.World);
        this.RoundManager = new RoundManager();
        this.Settings = window.ServerSettings;
        window.GameSnapShotManager = this.GameSnapShotManager;
    }

    SetPlayerCounter() {
        this.view = new StreamBuffer();
        this.view.WriteInt();
        this.view.WriteInt();

        counterList.forEach(counterType => {
            this.view.WriteByte(counterType);
            this.view.WriteInt(session.Teams.Count);

            /*
            foreach(MVTeam sessionTeam in session.Teams.ToList())
            {
                statCountersBP.Write((byte)sessionTeam);

                List < Player > teamPlayerList = session.Players.Where(x => x.Team == sessionTeam).ToList();

                statCountersBP.Write(teamPlayerList.Aggregate(0, (acc, x) => acc + x.StatCounters[counterType]));
                statCountersBP.Write(teamPlayerList.Count);

                foreach(Player teamPlayer in teamPlayerList)
                {
                    statCountersBP.Write(teamPlayer.ActorNumber);
                    statCountersBP.Write(teamPlayer.StatCounters[counterType]);
                }
                    
            }
             */
        })
    }
    HandleClosing() {
        const AvatarID = this.Data.Data?.activeSpawnRole;
        if (AvatarID != null) {
            this.GameSnapShotManager.RemoveWorldObjectFromId(AvatarID);
        }
    }

    UpdateWorldObject(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            PosX = Parameters[24].Value,
            PosY = Parameters[25].Value,
            PosZ = Parameters[26].Value,
            Timestamp = Parameters[35].Value,
            TransformPackageType = Parameters[36].Value,
            ByteRotation = Parameters[157].Value;
        //UpdateWorldObject(this.Socket, this.ActorNr, WorldObjectID, Timestamp, PosX, PosY, PosZ, TransformPackageType, ByteRotation);
    }

    UpdateWorldObjectRunTimeData(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            WorldObjectRunTimeData = Parameters[70].Value;

        const ObjectData = DictionaryToObject(WorldObjectRunTimeData);
        this.GameSnapShotManager.UpdateWorldObject(WorldObjectID, wo => Object.assign(wo?.RuntimeData ?? {}, ObjectData))
        UpdateWorldObjectRunTimeData(this.Socket, this.ActorNr, WorldObjectID, WorldObjectRunTimeData);
    }

    TriggerBoxEnter(Parameters) {
        try {
            let WorldObjectIDs = Parameters[22].Value,
                WorldObjectID = WorldObjectIDs[0],
                WorldObject = this.GameSnapShotManager.GetWorldObjectFromId(WorldObjectID);
            log.debug("TriggerBox", "Enter →", WorldObject);
            switch (WorldObject.WorldObjectType) {
                case "PickupItemSpawner":
                case "PickupCubeGun":
                case "PickupCostume":
                case "PickupMeleeWeapon":
                case "PickupCustomGun": {
                    (async () => {
                        PickupItemStateChange(this.Socket, this.ActorNr, WorldObjectID, 1);
                        PickupItemStateChange(this.Socket, 0, WorldObjectID, 2);
                        await sleep(PickupItemStateTimeOut);
                        PickupItemStateChange(this.Socket, 0, WorldObjectID, 0);
                    })();

                }
                    break;
                case "CollectibleItem": {
                    CollectiblePickedUp(this.Socket, WorldObjectID, this.ActorNr);
                }
                    break;
                case "PressurePlate": {
                    LogicObjectFiringStateChange(this.Socket, getTimestamp(), WorldObjectID, true);
                    log.info("TriggerBoxExit", WorldObjectIDs)
                }
                    break;
                default:
                    log.info("TriggerBoxEnter", WorldObject.WorldObjectType)
                    break;
            }
        } catch (e) { log.error("TriggerBox", e); }
    }
    TriggerBoxExit(Parameters) {
        let WorldObjectIDs = Parameters[22].Value,
            WorldObjectID = WorldObjectIDs[0],
            WorldObject = this.GameSnapShotManager.GetWorldObjectFromId(WorldObjectID);
        switch (WorldObject.WorldObjectType) {
            case "PressurePlate": {
                LogicObjectFiringStateChange(this.Socket, getTimestamp(), WorldObjectID, false)
                //TriggerBoxExit(this.Socket, WorldObjectID, this.ActorNr);
            }
                break;
            default:
                log.info("TriggerBoxExit", WorldObject.WorldObjectType)
                break;
        }
    }

    ReportCaptureFlag(Parameters) {
        UpdateGameStat(
            this.Socket,
            this.ActorNr,
            this.Data.TeamID,
            RoundManager.GameStatCounterType.Flag,
            0, -1, true, false
        );
        PostWinnerReport(this.Socket);
        log.info("ReportCaptureFlag", Parameters)
    }
    SetTeam(Parameters) {
        let TeamID = Parameters[89].Value;
        this.Data.TeamID = TeamID;
        SetTeam(this.Socket, this.ActorNr, TeamID);
    }

    PurchaseProduct() {
        PurchaseProduct(this.Socket);
    }

    SetProfileSettings(Parameters) {
        const Setting = Parameters[41].Value;
        const BuiltInTarget = Parameters[191].Value;
        const Value = Parameters[216].Value;

        const Platforms = ["Standalone", "WebGL", "Touch"];
        const Settings = ["MouseSensitivity", "TargetFrameRate", "TextureQuality", "TextureFilter", "AnistropicFiltering", "AntiAliasing", "LightQuality"]

        this.DefaultSettings[Platforms[BuiltInTarget]][Settings[Setting]] = Value
        window.localStorage.setItem("ProfileSettingsData", JSON.stringify(this.DefaultSettings));

    }

    LevelChanged() { }

    async StartSessionTime() {
        GameStateChange(this.Socket, 0, 1, 0, 2108773297 + 8000);
        await sleep(3e3);
        NextLevelGoldReward(this.Socket, 0, { level: this.Data.Level++, goldReward: 500 });
    }

    Notification() { }

    SetAvatarAccessorySlot(Parameters) {
        const AvatarAccessoryOffset = Parameters[114].Value,
            AvatarID = Parameters[126].Value,
            Scale = Parameters[34].Value,
            StreamingAssetID = Parameters[105].Value,
            AccessoryData = AccessoriesData.accessoryDatas[StreamingAssetID];
        log.info("Accessory", `Slot update — AvatarID:${AvatarID} AssetID:${StreamingAssetID} Scale:${Scale} Offset:${AvatarAccessoryOffset}`);
        try {
            this.GameSnapShotManager.UpdateWorldObject(AvatarID, Avatar => {
                Avatar.Data.BlueprintData[4][AccessoryData.slot] = {
                    "1": [StreamingAssetID, 0],
                    "2": [AccessoryData.slot, 0],
                    "3": [AvatarAccessoryOffset, 2],
                    "4": [AccessoryData.url, 7],
                    "5": [AvatarAccessoryOffset, 2],
                };
            });
            UpdateWorldObjectDataPartial(
                this.Socket,
                0,
                AvatarID,
                [{
                    Key: new String("BlueprintData"),
                    Value: new Dictionary([
                        {
                            Key: new String("4"),
                            Value: new Dictionary([
                                {
                                    Key: new String(JSON.stringify(AccessoryData.slot)),
                                    Value: new Dictionary([
                                        { Key: new String("1"), Value: new Int(StreamingAssetID) },
                                        { Key: new String("2"), Value: new Int(AccessoryData.slot) },
                                        { Key: new String("3"), Value: new Float(AvatarAccessoryOffset) },
                                        { Key: new String("4"), Value: new String(AccessoryData.url) },
                                        { Key: new String("5"), Value: new Float(Scale) }
                                    ])
                                }
                            ])
                        }
                    ])
                }]);
            SetAvatarAccessorySlot(this.Socket);
        } catch (e) { log.error("Accessory", e); }
    }

    RequestAccessoryData() {
        Object.keys(AccessoriesData.accessoryDatas).forEach(l => {
            AccessoriesData.accessoryDatas[l].owns = true;
        });
        PendingByteDataBatch(this.Socket, this.ActorNr, 3,
            new TextEncoder().encode(JSON.stringify(AccessoriesData)));
    }

    Handshake() {
        this.Socket.send(Serialize({
            MagicNumber,
            EgMessageType: "Event",
            Data: {
                Code: MVEventCodes.Handshake,
                Parameters: {
                    "245": new String('GXKLFMNtqgQKFqUvWcUk0Riz'),
                },
            }
        }));
    }

    ClientLog(Parameters) {
        const LogString = Parameters[146] || "",
            StackTrace = Parameters[147] || "";
        log.debug("Unity", LogString, StackTrace);
    }

    UpdatePrototype(Parameters) {
        const WorldInventoryID = Parameters[47].Value,
            WorldInventoryData = Parameters[49].Value;
        let i = this.GameSnapShotManager.UpdatePrototype(WorldInventoryID, WorldInventoryData);
        log.debug("Prototype", "Updated →", this.GameSnapShotManager.Prototypes[i].Data);
        UpdatePrototype(this.Socket, this.ActorNr, WorldInventoryID, WorldInventoryData);
    }

    UpdateLineOfFire(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            CamOriginX = Parameters[74].Value,
            CamOriginY = Parameters[75].Value,
            CamOriginZ = Parameters[76].Value,
            CamDirX = Parameters[77].Value,
            CamDirY = Parameters[78].Value,
            CamDirZ = Parameters[79].Value;
        UpdateLineOfFire(this.Socket, this.ActorNr, WorldObjectID, CamOriginX, CamOriginY, CamOriginZ, CamDirX, CamDirY, CamDirZ);
    }

    async PostChatMsg(Parameters) {
        const Message = Parameters[88],
            GameMsgType = Parameters[87].Value;
        try {
            const MessageString = GetValueFromDictionaryKey(Message, 5).Value;
            if (MessageString.includes("-->")) {
                let MessageArr = (a, m) => [
                    { Key: new Byte(0), Value: new Int(a) },
                    { Key: new Byte(5), Value: new String(m) }
                ];
                try {
                    let cmd = MessageString.slice(3).toLowerCase();
                    let args = cmd.split(" ");
                    if (args[0] == "set") {
                        switch (args[1]) {
                            case "reload-time":
                                PickupItemStateTimeOut = Number(args[2]);
                                PostChatMsg(this.Socket, this.ActorNr, 3, MessageArr(this.ActorNr, "Set reload-time to " + args[2]));
                                break;
                            case "gravity": {
                                let gravity = Number(args[2]);
                                if (gravity < 0) {
                                    PostChatMsg(this.Socket, this.ActorNr, 11, MessageArr(this.ActorNr, "Gravity value must be positive or else game will be crashed."));
                                    return;
                                }
                                let [WorldObject, Exists] = this.GameSnapShotManager.SetGravity(gravity);
                                let Encoded;
                                if (!Exists) Encoded = await setWorldData({ WorldObjects: [WorldObject], Prototypes: [], Links: [], ObjectLinks: [] }, _ => 0);
                                if (!Exists) PendingByteDataBatch(this.Socket, 0, 2, Encoded);
                                UpdateWorldObjectDataPartial(this.Socket, 0, WorldObject.Id, [{ Key: new String("gravity"), Value: new Float(gravity) }]);
                                log.info("Command", "Set gravity to:", gravity);
                                PostChatMsg(this.Socket, this.ActorNr, 3, MessageArr(this.ActorNr, "Set gravity to " + args[2]));
                                break;
                            }
                        }
                    } else {
                        PostChatMsg(this.Socket, this.ActorNr, 11, MessageArr(this.ActorNr, "Unknown command."));
                    }
                } catch (error) {
                    log.error("Command", error);
                    PostChatMsg(this.Socket, this.ActorNr, 11, MessageArr(this.ActorNr, "Error"));
                }
            } else {
                PostChatMsg(this.Socket, this.ActorNr, GameMsgType, Message.Value);
            }
        } catch (e) {
            log.error("PostChatMsg", e);
        }
    }

    WorldObjectRPCOperation(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            WorldObjectRPCData = Parameters[83].Value;
        WorldObjectRPCEvent(this.Socket, this.ActorNr, WorldObjectID, WorldObjectRPCData);
    }

    LogicActivateRequest(Parameters) {
        log.debug("LogicActivateRequest", Parameters);
    }

    Join(Parameters) {
        let Token = Parameters["167"].Value,
            PlanetID = Parameters["86"].Value,
            GameMode = Parameters["116"].Value;
        log.info("Join", `Token:${Token} PlanetID:${PlanetID} GameMode:${GameMode}`);

        let UserName = this.Settings.UserName;
        this.GameMode = GameMode;
        this.Data = {
            ...this.Data,
            UserProfileData: {
                IsAdmin: false,
                UserName,
                Gold: 9999,
                IsTourist: false,
                IsUnderAge: false,
                SubscriptionData: {
                    SubscriptionType: 1,
                    ExpiredSubscriptionType: 0,
                    SubscriptionActivateTime: "3001-01-01T00:00:00",
                    SubscriptionDuration: "20:00:00"
                }
            },
            ProfileID: 1,
            TeamID: 0,
            Level: 45,
            RegionCode: "en_US",
            AvatarStatus: 1,
            ClientBuildTarget: 2,
            IsActorReady: 0,
            ActorNr: this.ActorNr,
            PlayerPlanetData: {
                highScoreGamePoints: 0,
                gamePassTier: 0
            },
        };
        Join(this.Socket, this.Data.ActorNr, this.Data.TeamID, this.Data.UserProfileData);
    }

    SpawnVehicleWithDriver(Parameters) {
        const WorldObjectIDs = Parameters[72];
        const SeatID = Parameters[141].Value;

        const driverWorldObjectId = GetValueFromDictionaryKey(WorldObjectIDs, 0).Value;
        const spawnerWorldObjectId = GetValueFromDictionaryKey(WorldObjectIDs, 1).Value;
        log.info("SpawnVehicleWithDriver", `driver:${driverWorldObjectId} spawner:${spawnerWorldObjectId}`);

        const vehicleId = this.GameSnapShotManager.SpawnVehicle(spawnerWorldObjectId, this.ActorNr);
        if (vehicleId == null) {
            log.warn("SpawnVehicleWithDriver", "SpawnVehicle returned null — no event sent");
            return;
        }

        const driverWO = this.GameSnapShotManager.GetWorldObjectFromId(this.Data.Data.activeSpawnRole);
        driverWO.RuntimeData.seat[0] = SeatID;
        driverWO.RuntimeData.GroupId = vehicleId;


        SpawnVehicleWithDriver(this.Socket, this.ActorNr, spawnerWorldObjectId, vehicleId, driverWorldObjectId, 0, -1, -1, SeatID);
        SpawnVehicleWithDriverOpRes(this.Socket);
    }
    DetachWorldObjectFromVehicle(Parameters) {
        const WorldObjectID = Parameters[22].Value;

        const driverWO = this.GameSnapShotManager.GetWorldObjectFromId(this.Data.Data.activeSpawnRole);
        driverWO.RuntimeData.seat[0] = -1;
        driverWO.RuntimeData.GroupId = this.GameSnapShotManager.RootGroup.Id;

        DetachWorldObjectFromVehicle(this.Socket, WorldObjectID);
        DetachWorldObjectFromVehicleOpRes(this.Socket);

    }
    AttachWorldObjectToSeat(Parameters) {
        const WorldObjectIDs = Parameters[72];
        const SeatID = Parameters[141].Value;

        const vehicleWorldObjectId = GetValueFromDictionaryKey(WorldObjectIDs, 4).Value;

        const driverWO = this.GameSnapShotManager.GetWorldObjectFromId(this.Data.Data.activeSpawnRole);
        driverWO.RuntimeData.seat[0] = SeatID;
        driverWO.RuntimeData.GroupId = vehicleWorldObjectId;


        AttachWorldObjectToSeat(this.Socket, this.ActorNr, vehicleWorldObjectId, driverWO.Id, SeatID);
        AttachWorldObjectToSeatOpRes(this.Socket);

        log.info("AttachWorldObjectToSeat", Parameters)
    }

    UnregisterWorldObject(Parameters) {
        const WorldObjectID = Parameters[22].Value;

        this.GameSnapShotManager.RemoveWorldObjectFromId(WorldObjectID);
        UnregisterWorldObject(this.Socket, WorldObjectID);
        log.info("UnregisterWorldObject", WorldObjectID)
    }
    PostGameMsg(Parameters) {
        log.info("PostGameMsg", Parameters);
    }
    CreateSpawnRole(Parameters) {
        const WorldObjectID = Parameters[22].Value;
        const AvatarSpawnRoleCreator = this.GameSnapShotManager.GetWorldObjectFromId(WorldObjectID);
        const PlayModeAvatar = this.GameSnapShotManager.WorldObjects.find(l => l.WorldObjectType == "PlayModeAvatar" && l.GroupId == AvatarSpawnRoleCreator.Id);


        const clone = this.GameSnapShotManager.CloneWorldObject(PlayModeAvatar.Id, this.GameSnapShotManager.RootGroup.Id);

        // I tried everything vro 🥀 - these classes are pain in the ahh

        CloneWorldObjectTree(this.Socket, this.ActorNr, WorldObjectID, clone.root.Id, -1, -1, true, this.Data.ProfileID);
        //SetActiveSpawnRole(this.Socket, clone.root.Id, this.ActorNr, [0, 0, 0], [0, 0, 0, 1]);
        //CreateSpawnRoleOpRes(this.Socket);

        //let g = this.Data.Data?.activeSpawnRole
        /*SetSpawnRoleBody(this.Socket, {
            deletedProtoBodyWoId: this.Data.Data?.activeSpawnRole,
            deletedBodyWoId: -1,
            spawnRoleCreatorWoId: WorldObjectID
        })*/
        log.info("CreateSpawnRole", Parameters);
    }

    //Useless
    SetMaterial() { }
    SetSayChatBubbleVisible() { }
    IncrementStatRequest() { }


    InitProfileSettings() {
        const LocalProfileSettingsData = window.localStorage.getItem("ProfileSettingsData");
        return LocalProfileSettingsData ? JSON.parse(LocalProfileSettingsData) : {
            Standalone: {
                MouseSensitivity: 50.5,
                TargetFrameRate: 4,
                TextureQuality: 1,
                TextureFilter: 2,
                AnistropicFiltering: 5,
                AntiAliasing: 2,
                LightQuality: 2
            },
            WebGL: {
                MouseSensitivity: 50.5,
                TargetFrameRate: 4,
                TextureQuality: 2,
                TextureFilter: 1,
                AnistropicFiltering: 4,
                AntiAliasing: 1,
                LightQuality: 1
            },
            Touch: {
                MouseSensitivity: 50.5,
                TargetFrameRate: 4,
                TextureQuality: 1,
                TextureFilter: 1,
                AnistropicFiltering: 3,
                AntiAliasing: 0,
                LightQuality: 0
            }
        }
    }
    async Syncronize() {
        this.GameSnapShotManager.ResetWorldObjectSpawnerVehicle();
        let spawnRoleAvatars = [];



        // tried to make build mode work but client too spoiled
        if (this.GameMode === 0) {
            spawnRoleAvatars.push(this.GameSnapShotManager.AddAvatar(this.ActorNr, 0, this.GameMode)[0]);
        }
        spawnRoleAvatars.push(this.GameSnapShotManager.AddAvatar(this.ActorNr, 0, 1)[0]);


        console.log(spawnRoleAvatars, spawnRoleAvatars[0].Id, spawnRoleAvatars.map(l => l.Id))
        this.Data = {
            ...this.Data,
            "Data": {
                "activeSpawnRole": spawnRoleAvatars[0].Id,
                "spawnRoleAvatarIds": spawnRoleAvatars.map(l => l.Id)
            }
        };

        RequestMaterials(this.Socket);
        GetSubscriptionPerksData(this.Socket);
        GetKogamaVat(this.Socket);

        this.DefaultSettings = this.InitProfileSettings();

        GetProfileMetaData(this.Socket, this.DefaultSettings);
        GetPublishedPlanetProfileData(this.Socket);

        if (this.GameMode == 0 || this.GameMode == 1) {
            const SetupFunc = [SetupUserBuildMode, SetupUserPlayMode][this.GameMode];
            SetupFunc(this.Socket, [
                { Id: 0, Enabeled: true },
                { Id: 1, Enabeled: true },
                { Id: 2, Enabeled: true },
                { Id: 3, Enabeled: true },
            ], [this.Data], 0, getTimestamp(), {
                GameStateType: this.RoundManager.State,
                GameStateDuration: this.RoundManager.StateDuration,
                GameStateStartTime: this.RoundManager.StateStartTime,
                GameStatCounterData: this.RoundManager.StateCounterData
            });

            await sleep(1e3);
            let World = this.GameSnapShotManager.GetWorld();
            let BytesArray = await setWorldData(World, p => log.debug("Encode", `${p}%`));
            GameSnapshotData(this.Socket, BytesArray, () => {
                log.success("Sync", "Snapshot sent — game ready.");
                SetActorReady(this.Socket, false, this.Data.ActorNr);
                this.Data.IsActorReady = 1;
                this.SendLogicFrame = 1;
            });
        }
    }
}

export class InternalOperationRequestsHandler {
    constructor(Socket, ActorNr) {
        this.ActorNr = ActorNr;
        this.Socket = Socket;
    }

    get OpHandler() {
        return this._opHandler;
    }
    set OpHandler(v) {
        this._opHandler = v;
    }

    UnregisterWorldObject(Parameters) {
        this.Socket.send(Serialize({
            MagicNumber,
            EgMessageType: "InternalOperationResponse",
            Data: {
                DebugMessage: new Null(),
                ReturnCode: 0,
                OperationCode: 1,
                Parameters: {
                    "1": Parameters[1],
                    "2": new Int(GetTimeTick()),
                },
            }
        }));
        if (this._opHandler?.SendLogicFrame) LogicFrame(this.Socket);
    }
}
