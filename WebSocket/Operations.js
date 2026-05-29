import { Serialize } from "../ExitGames.Client.Photon/Protocol16Helper.js";
import { Int, Null, String, Dictionary, Float, Byte } from "../ExitGames.Client.Photon/Protocol16Classes.js";
import MVCommon from "./MVCommon.js";
const { MVEventCodes, WorldObjectCode } = MVCommon;
import { WorldObjectRPCEvent, UpdatePrototype, UpdateLineOfFire, PickupItemStateChange, SetTeam, PostChatMsg, UpdateWorldObject, GameStateChange, PurchaseProduct, UpdateWorldObjectRunTimeData, NextLevelGoldReward, UpdateWorldObjectDataPartial, SetAvatarAccessorySlot, PendingByteDataBatch, GameSnapshotData, LogicFrame, SetupUserPlayMode, GetPublishedPlanetProfileData, GetProfileMetaData, Join, RequestMaterials, GetSubscriptionPerksData, GetKogamaVat, SetActorReady, Leave, JoinEvent, ReplicateSpawnRoleData } from "./Events.js";

import { setWorldData, getWorldData, StreamBuffer } from "./WorldWorkerBridge.js";
import AccessoriesData from "./Assets/Accessories.js";
import GameSnapShotHelper from "./GameSnapShotHelper.js";





//const path = require('path');
//const fs = require('fs');

const sleep = (e) => new Promise((resolve) => setTimeout(resolve, e));

let TimeStamp = 0;
let PickupItemStateTimeOut = 1e3;
let PlayersList = [];



setInterval(l => TimeStamp += 1e3, 999)

const MagicNumber = 243;
function GetTimeTick() {
    return Math.floor(performance.now() * 1000);
}
function GetValueFromDictionaryKey(Dict, Key) {
    return Dict.Value.find(l => l.Key.Value == Key).Value
}
function GetKeyFromValue(object, predicate) {
    if (!object || typeof object !== "object" || typeof predicate !== "function") {
        throw new TypeError("Invalid arguments: object must be an object and predicate must be a function");
    }
    const entry = Object.entries(object).find(([key, value]) => predicate(value));
    if (!entry) {
        return undefined; // or throw new Error("No matching key found");
    }
    return entry[0];
}

export class OperationHandler {
    static Sockets = {}
    constructor(Socket, SocketInstance) {
        OperationHandler.Sockets[SocketInstance] = { Socket, OperationHandler };
        this.SocketInstance = SocketInstance;
        this.Inctance = OperationHandler.Sockets[SocketInstance];
        this.Inctance.Data = { ActorNr: this.SocketInstance };
        this.Socket = Socket;
        this.GameSnapShotManager = new GameSnapShotHelper(window.World);
    }
    HandleClosing() {
        let AvatarID = this.Inctance.Data.Data.activeSpawnRole;
        this.GameSnapShotManager.RemoveWorldObjectFromId(AvatarID);
        let index = PlayersList.findIndex(l => l.ActorNr == this.Inctance.Data.ActorNr);
        PlayersList.splice(index, 1);
        this.SocketAll(l => {
            Leave(l.Socket, this.Inctance.Data.ActorNr);
        }, this.SocketInstance);
    }
    SocketAll(callback, self = -1) {
        Object.entries(OperationHandler.Sockets).forEach(l => {
            if (l[0] != self) callback(l[1]);
        })
    }

    UpdateWorldObject(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            PosX = Parameters[24].Value,
            PosY = Parameters[25].Value,
            PosZ = Parameters[26].Value,
            Timestamp = Parameters[35].Value,
            TransformPackageType = Parameters[36].Value,
            ByteRotation = Parameters[157].Value
        this.SocketAll(l => {
            UpdateWorldObject(l.Socket, this.Inctance.Data.ActorNr, WorldObjectID, Timestamp, PosX, PosY, PosZ, TransformPackageType, ByteRotation);
        }, this.SocketInstance)
    }
    UpdateWorldObjectRunTimeData(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            WorldObjectRunTimeData = Parameters[70].Value;
        this.SocketAll(l => {
            UpdateWorldObjectRunTimeData(l.Socket, this.Inctance.Data.ActorNr, WorldObjectID, WorldObjectRunTimeData)
        })
    }
    TriggerBoxEnter(Parameters) {
        try {
            let WorldObjectIDs = Parameters[22].Value,
                PlayModeAvatarID = WorldObjectIDs[1],
                WorldObjectID = WorldObjectIDs[0],
                WorldObject = this.GameSnapShotManager.GetWorldObjectFromId(WorldObjectID);
            console.log("TriggerBoxEnter", WorldObject);
            switch (GetKeyFromValue(WorldObjectCode, v => v == WorldObject.WorldObjectTypeId)) {
                case "PickupItemSpawner": case "PickupCubeGun": case "PickupCostume": case "PickupCostume": case "PickupMeleeWeapon": case "PickupCustomGun": {
                    this.SocketAll(async l => {
                        PickupItemStateChange(l.Socket, this.Inctance.Data.ActorNr, WorldObjectID, 1);
                        PickupItemStateChange(l.Socket, 0, WorldObjectID, 2);
                        await sleep(PickupItemStateTimeOut);
                        PickupItemStateChange(l.Socket, 0, WorldObjectID, 0);
                    })
                }
                    break;
                case "PressurePlate": {
                    this.SocketAll(async l => {
                        PickupItemStateChange(l.Socket, this.Inctance.Data.ActorNr, WorldObjectID, 1);
                        PickupItemStateChange(l.Socket, 0, WorldObjectID, 2);
                        await sleep(PickupItemStateTimeOut);
                        PickupItemStateChange(l.Socket, 0, WorldObjectID, 0);
                    })
                }
                    break;
            }
        } catch (e) { console.error(e) }
    }
    SetTeam(Parameters) {
        let TeamID = Parameters[89].Value;
        this.Inctance.Data.TeamID = TeamID;
        this.SocketAll(l => SetTeam(l.Socket, this.Inctance.Data.ActorNr, TeamID))
    }
    PurchaseProduct(Parameters) {
        console.log("PurchaseProduct")
        PurchaseProduct(this.Socket);
    }
    LevelChanged(Parameters) {
        let Level = Parameters[169].Value;

    }
    async StartSessionTime() {
        GameStateChange(this.Socket, 0, 1, 0, 2108773297 + 8000)
        await sleep(3e3);
        NextLevelGoldReward(this.Socket, 0, { level: this.Inctance.Data.Level++, goldReward: 500 })
    }
    Notification(Parameters) {
        //let Level = Parameters[169].Value;

    }
    SetAvatarAccessorySlot(Parameters) {
        const AvatarAccessoryOffset = Parameters[114].Value,
            AvatarID = Parameters[126].Value,
            Scale = Parameters[34].Value,
            StreamingAssetID = Parameters[105].Value,
            AccessoryData = AccessoriesData.accessoryDatas[StreamingAssetID];
        console.log("SetAvatarAccessorySlot", AvatarID, StreamingAssetID, Scale, AvatarAccessoryOffset);
        try {
            this.GameSnapShotManager.UpdateWorldObject(AvatarID, Avatar => {
                Avatar.Data.BlueprintData[4][AccessoryData.slot] = {
                    "1": [StreamingAssetID, 0],
                    "2": [AccessoryData.slot, 0],
                    "3": [AvatarAccessoryOffset, 2],
                    "4": [AccessoryData.url, 7],
                    "5": [AvatarAccessoryOffset, 2],
                }
            })
            this.SocketAll(l => {
                // console.log(l);
                UpdateWorldObjectDataPartial(
                    l.Socket,
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
            })
            SetAvatarAccessorySlot(this.Socket);
        } catch (e) { console.error(e) }
    }
    RequestAccessoryData() {
        Object.keys(AccessoriesData.accessoryDatas).forEach(l => {
            AccessoriesData.accessoryDatas[l].owns = true;
        })
        PendingByteDataBatch(this.Socket, this.SocketInstance, 3,
            new TextEncoder().encode(JSON.stringify(AccessoriesData)),
            _ => 0)
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
            StackTrace = Parameters[147] || "",
            LogType = Parameters[148] || null,
            ExtraSentryData = Parameters[153] || [],
            ClientSentryTags = Parameters[187] || [];

        console.log(LogString, "\n", StackTrace);
    }
    UpdatePrototype(Parameters) {
        const WorldInventoryID = Parameters[47].Value,
            WorldInventoryData = Parameters[49].Value;

        let i = this.GameSnapShotManager.UpdatePrototype(WorldInventoryID, WorldInventoryData);
        console.log("L2", this.GameSnapShotManager.Prototypes[i].Data)

        this.SocketAll(l => {
            UpdatePrototype(l.Socket, this.Inctance.Data.ActorNr, WorldInventoryID, WorldInventoryData);
        }, this.SocketInstance)
    }
    UpdateLineOfFire(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            CamOriginX = Parameters[74].Value,
            CamOriginY = Parameters[75].Value,
            CamOriginZ = Parameters[76].Value,
            CamDirX = Parameters[77].Value,
            CamDirY = Parameters[78].Value,
            CamDirZ = Parameters[79].Value;
        this.SocketAll(l => {
            UpdateLineOfFire(l.Socket, this.Inctance.Data.ActorNr, WorldObjectID, CamOriginX, CamOriginY, CamOriginZ, CamDirX, CamDirY, CamDirZ);
        }, this.SocketInstance)
    }
    async PostChatMsg(Parameters) {
        const LocalActorNr = this.Inctance.Data.ActorNr;
        const Message = Parameters[88],
            GameMsgType = Parameters[87].Value;
        try {
            const MessageString = GetValueFromDictionaryKey(Message, 5).Value;
            if (this.Inctance.Data.UserProfileData.IsAdmin && MessageString.includes("-->")) {
                let MessageArr = (a, m) => [
                    { Key: new Byte(0), Value: new Int(a) },
                    { Key: new Byte(5), Value: new String(m) }
                ]
                try {
                    let cmd = MessageString.slice(3).toLowerCase();
                    let args = cmd.split(" ");
                    if (args[0] == "set") {
                        switch (args[1]) {
                            case "reload-time":
                                PickupItemStateTimeOut = Number(args[2])
                                PostChatMsg(this.Socket, LocalActorNr, 3, MessageArr(LocalActorNr, "Set reload-time to " + args[2]));
                                break;
                            case "gravity":
                                let gravity = Number(args[2]);
                                if (gravity < 0) return PostChatMsg(this.Socket, LocalActorNr, 11, MessageArr(LocalActorNr, "Gravity value must be positive or else game will be crashed."));
                                let [WorldObject, Exicts] = this.GameSnapShotManager.SetGravity(gravity);
                                let Encoded;
                                if (!Exicts) Encoded = await setWorldData({ WorldObjects: [WorldObject], Prototypes: [], Links: [], ObjectLinks: [] }, _ => 0);
                                this.SocketAll(l => {
                                    if (!Exicts) PendingByteDataBatch(l.Socket, 0, 2, Encoded)
                                    UpdateWorldObjectDataPartial(l.Socket, 0, WorldObject.Id, [{ Key: new String("gravity"), Value: new Float(gravity) }]);
                                });
                                console.log("Set world gravity to:", gravity);
                                PostChatMsg(this.Socket, LocalActorNr, 3, MessageArr(LocalActorNr, "Set gravity to " + args[2]));
                                break;
                        }
                    } else {
                        PostChatMsg(this.Socket, LocalActorNr, 11, MessageArr(LocalActorNr, "Unknowen command."));
                    }
                } catch (error) {
                    console.error(error)
                    PostChatMsg(this.Socket, LocalActorNr, 11, MessageArr(LocalActorNr, "Error"));
                }
            } else {
                this.SocketAll(l => PostChatMsg(l.Socket, this.Inctance.Data.ActorNr, GameMsgType, Message.Value))
            }
        } catch (e) {
            console.error(e)
        }

    }
    WorldObjectRPCOperation(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            WorldObjectRPCData = Parameters[83].Value;
        console.log(WorldObjectID)
        this.SocketAll(l => {
            WorldObjectRPCEvent(l.Socket, this.Inctance.Data.ActorNr, WorldObjectID, WorldObjectRPCData);
        })
    }
    LogicActivateRequest(Parameters) {
        const WorldObjectID = Parameters[22].Value,
            IsFiring = Parameters[204].Value;

    }
    Join(Parameters) {
        console.log("JOIN: ",Parameters);
        let Token = Parameters["167"].Value,
            PlanetID = Parameters["86"].Value,
            GameMode = Parameters["116"].Value;

        
        console.log(Token, PlanetID);
        let UserName = "Tourist"
        this.Token = Token;
        this.Inctance.GameMode = GameMode;
        this.Inctance.Data = {
            ...this.Inctance.Data,
            "UserProfileData": {
                "IsAdmin": true,
                "UserName": (Token == "1.ADMIN" ? `<i><b>${UserName}</b></i>` : UserName) + this.SocketInstance,
                "Gold": 9999,
                "IsTourist": false,
                "IsUnderAge": false,
                "SubscriptionData": {
                    "SubscriptionType": 0,
                    "ExpiredSubscriptionType": 0,
                    "SubscriptionActivateTime": "0001-01-01T00:00:00",
                    "SubscriptionDuration": "00:00:00"
                }
            },
            "ProfileID": Number(Token.split('.')[0]) + this.SocketInstance,
            "TeamID": 0,
            "Level": 1,
            "RegionCode": "es_ES",
            "AvatarStatus": 1,
            "ClientBuildTarget": 2,
            "IsActorReady": 0,
            "ActorNr": this.SocketInstance,
            "PlayerPlanetData": {
                "highScoreGamePoints": 0,
                "gamePassTier": 0
            },
        }
        this.SocketAll(l => {
            JoinEvent(l.Socket, this.Inctance.Data);
        }, this.SocketInstance);
        Join(this.Socket, this.Inctance.Data.ActorNr, this.Inctance.Data.TeamID, this.Inctance.Data.UserProfileData);
    }
    async Syncronize() {
        let [PlayModeAvatar, SnapShotData] = this.GameSnapShotManager.AddAvatar(this.SocketInstance, 0 , this.Inctance.GameMode);
        this.Inctance.Data = {
            ...this.Inctance.Data, "Data": {
                "activeSpawnRole": PlayModeAvatar.Id,
                "spawnRoleAvatarIds": [
                    PlayModeAvatar.Id
                ]
            }
        }
        PlayersList.push(this.Inctance.Data);
        console.log(PlayersList);
        RequestMaterials(this.Socket);
        GetSubscriptionPerksData(this.Socket);
        GetKogamaVat(this.Socket);
        GetProfileMetaData(this.Socket);
        GetPublishedPlanetProfileData(this.Socket);
        SetupUserPlayMode(this.Socket, [
            { Id: 0, Enabeled: true },
            { Id: 1, Enabeled: true },
            { Id: 2, Enabeled: true },
            { Id: 3, Enabeled: true },
        ], PlayersList, PlayersList.length - 1, TimeStamp, {
            GameStateType: 2,
            GameStateDuration: 0,
            GameStateStartTime: 0,
        });
        await sleep(1e3);
        let World = this.GameSnapShotManager.GetWorld();

        /*
         const filePath = path.join(__dirname, 'Resources/Planets', 'Planet-A.json');
         fs.mkdirSync(path.dirname(filePath), { recursive: true });
         const buffer = Buffer.from(JSON.stringify(World));
         fs.writeFile(filePath, buffer, _ => { });
         */

        if (PlayersList.length > 1) {
            let Bytes = await setWorldData(SnapShotData);
            this.SocketAll(l => {
                ReplicateSpawnRoleData(l.Socket, this.Inctance.Data.ActorNr, this.Inctance.Data.Data);
                PendingByteDataBatch(l.Socket, this.Inctance.Data.ActorNr, 2, Bytes);
            }, this.SocketInstance);
        }

        let BytesArray = await setWorldData(World, _ => console.log(`Encoded [${_}%]`))
        GameSnapshotData(this.Socket, BytesArray, async _ => {
            console.log("DONE");
            this.SocketAll(l => SetActorReady(l.Socket, false, this.Inctance.Data.ActorNr));
            this.Inctance.Data.IsActorReady = 1;
            this.Inctance.SendLogicFrame = 1;
        });
        /*
        fs.readFile(filePath, (err, data) => {
            if (err) throw err;
            // Convert Buffer to Uint8Array
            const byteArray = new Uint8Array([...new Uint8Array(data), 0, 0, 0, 0]);
            PlanetData
            GameSnapshotData(this.Socket, byteArray, _ => {
                console.log("DONE");
                SetActorReady(this.Socket, false, this.SocketInstance);
                setInterval(_ => LogicFrame(this.Socket), 5e3);

            })
        });
        */
        //GAME SNAPSHOT
    }
}

export class InternalOperationRequestsHandler {
    constructor(Socket, SocketInstance) {
        this.SocketInstance = SocketInstance;
        this.Socket = Socket;
    }
    get Inctance() {
        return OperationHandler.Sockets[this.SocketInstance] || {};
    }
    UnregisterWorldObject(Parameters) {
        //console.log(LastOutQuery);
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
        if (this.Inctance.SendLogicFrame) LogicFrame(this.Socket);
    }
}
