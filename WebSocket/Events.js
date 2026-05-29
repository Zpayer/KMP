import { Int, Null, String, TArray, Dictionary, Bool, Byte, Float, ByteArray } from "../ExitGames.Client.Photon/Protocol16Classes.js";
import { Serialize, GetKeyFromValue } from "../ExitGames.Client.Photon/Protocol16Helper.js";
import MVCommon from "./MVCommon.js";
const { MVEventCodes, MVOperationCodes, DBQueryKeys } = MVCommon;

import Materials from "./Assets/Materials.js";
//import TextLog from "./Log/text.js";
//const sleep = (e) => new Promise((resolve) => setTimeout(resolve, e));

const MagicNumber = 243;




export function Join(Socket, ActorNr, TeamID, UserProfileData) {
    let ThemesEnabled = 1;
    let Parameters = {
        14: new Int(0), //PlanetOwnershipType 0 -> not owner
        16: new Byte(4), //Region
        82: new Bool(1), //IsGamePublished
        89: new Int(TeamID), //TeamID
        104: new String(window.location.href + "/WebSocket/Assets/"),// /kogama_assets/ https://www.kogstatic.com/kogama_assets/v96/kogama_assets_u5_webgl/
        168: new Int(-12572), //ClientSettingFlags
        170: new Int(0), //GameType
        174: new String(window.location.href),//APIUrl - https://api-www.kgoma.com/v1/api/
        177: new String("UwYEtrSfoxNXUFISeIJgjoUKMmXtDRQo3wCjjb3+z0GsR6wN14GH2fFxJ1f6cYPcief5U8W4yhVkfwHHeu2LD+IBY96woi1d4VLln23eeSg="), //Format
        181: new Int(4), //MarketPlaceLevel
        182: new Dictionary([ //Prices
            { Key: new String("GameCoinBoost"), Value: new TArray([new Int(60)], 105) },
            { Key: new String("AvatarMarketplace"), Value: new TArray([new Int(275)], 105) },
            { Key: new String("ModelMarketplace"), Value: new TArray([new Int(40)], 105) }
        ], 0, 0),
        184: new Int(3), //PublishLevel 3 -> published
        186: new String("/kogama_assets/"),//AssetBundleRootUrlDefault
        212: new Bool(ThemesEnabled), //ThemesEnabled
        215: new Int(300), //PostGameInterstitialIntervalInSeconds
        224: new String(JSON.stringify(UserProfileData)),
        225: new String("https://kogama.com/profile/{0}/can_consent/"),//AdConsentEndpointURL
        226: new String("https://kogama.com/"),//KogamaMainpageURL
        228: new Int(0), //TouristPromotionCreyFrequencyPercent
        229: new String("https://www.playcrey.com/campaign/kogama?utm_source=Kogama&utm_medium=Second-Phase"),//TouristPromotionCreyURL
        230: new Bool(1), //TouristPromotionCreyRedirectUser
        231: new Bool(0), //ElitePromotionEnabled
        232: new Int(240), //ElitePromotionInterval
        233: new Int(255), //ReviveEnabledFlags
        234: new Int(20), //AdTimeoutAsSuccessDelayAndroid
        235: new Int(20), //AdTimeoutAsSuccessDelayWebGL
        236: new Bool(1), //AdTimeoutAsSuccessAndroid
        237: new Bool(1), //AdTimeoutAsSuccessWebGL
        238: new Int(30), //InterstitialTimeoutAfterRewardedAdWebGL
        239: new Int(30), //InterstitialTimeoutAfterRewardedAdAndroid
        240: new Bool(0), //CustomTouristPromotionRedirectToURL
        241: new String("https://google.com"),//CustomTouristPromotionURL
        242: new String("Promotion/Promotion_01.png"),//CustomTouristPromotionAssetURL
        243: new Int(0), //CustomTouristPromotionFrequencyPercent
        254: new Int(ActorNr),
    };
    Socket.send(Serialize({
        MagicNumber: 243,
        EgMessageType: "OperationResponse",
        Data: {
            DebugMessage: new Null(),
            ReturnCode: 0,
            OperationCode: MVOperationCodes.Join,
            Parameters,
        }
    }));
}
export function SetAvatarAccessorySlot(Socket) {
    Socket.send(Serialize({
        MagicNumber: 243,
        EgMessageType: "OperationResponse",
        Data: {
            DebugMessage: new Null(),
            ReturnCode: 0,
            OperationCode: MVOperationCodes.SetAvatarAccessorySlot,
            Parameters: {},
        }
    }));
}
export function PurchaseProduct(Socket) {
    Socket.send(Serialize({
        MagicNumber: 243,
        EgMessageType: "OperationResponse",
        Data: {
            DebugMessage: new Null(),
            ReturnCode: 0,
            OperationCode: MVOperationCodes.PurchaseProduct,
            Parameters: {},
        }
    }));
}
export function RequestMaterials(Socket) {
    try {
        let h = {
            "MaterialID": (_) => new Int(_),
            "MaterialName": (_) => new String(_),
            "MaterialDescription": (_) => new String(_),
            "MaterialPath": (_) => new String(_),
            "MaterialSound": (_) => new Int(_),
            "AvatarModifierPackageType": (_) => new Int(_),
            "MaterialAnimatorTypeName": (_) => new String(_),
            "MaterialUnlockPrice": (_) => new Int(_),
            "MaterialPhysicalProperties": (_) => {
                //console.log(_.map(x=>new Float(x)))
                //no 
                return new TArray(_.map(x => new Float(x)), 102)
            },
            "MaterialUnlocked": (_) => new Bool(_),
        }
        let Val = [];
        Object.values(Materials).forEach(val => {
            let Key = new Byte(val.MaterialID);
            let Values = [];
            Object.entries(val).forEach(([key, value]) => {
                let Key = new Byte(DBQueryKeys[key]);
                let Value = h[key](value);
                Values.push({ Key, Value });
            });
            Val.push({ Key, Value: new Dictionary(Values) });
            //console.log(Values);
        });
        let packet = {
            MagicNumber,
            EgMessageType: "Event",
            Data: {
                Code: MVEventCodes.RequestMaterials,
                Parameters: {
                    "93": new Dictionary(Val),
                },
            }
        }
        let data = Serialize(packet)
        Socket.send(data);
    } catch (e) {
        console.error(e);
    }
}
export function UpdateWorldObject(Socket, ActorNr, WorldObjectID, Timestamp, PosX, PosY, PosZ, TransformPackageType, ByteRotation) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.UpdateWorldObject,
            Parameters: {
                "254": new Int(ActorNr),
                "35": new Int(Timestamp),
                "22": new Int(WorldObjectID),
                "24": new Float(PosX),
                "25": new Float(PosY),
                "26": new Float(PosZ),
                "36": new Byte(TransformPackageType),
                "157": new ByteArray(ByteRotation)
            },
        }
    }));
}
export function GetSubscriptionPerksData(Socket) {
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.GetSubscriptionPerksData,
            Parameters: {
                "245": new Int(50),
            },
        }
    })
    Socket.send(data);
}
export function GetKogamaVat(Socket) {
    let vat = { "regularUserVat": 0.9, "subscribedUserVat": 0.3 }
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.GetKogamaVat,
            Parameters: {
                "245": new String(JSON.stringify(vat)),
            },
        }
    })
    Socket.send(data);
}
export function GetProfileMetaData(Socket) {
    let dat = {
        "FirstTimeState": {
            "ByteArray": "AIACAwAAAEAALgwAAAAAAOgWZn9g"
        },
        "ProfileHighlightState": {
            "slotSeenIdMap": {
                "1": 356,
                "2": 357,
                "3": 358,
                "4": 359
            }
        },
        "ProfileSettingsState": {
            "ProfileSettingsData": {
                "Standalone": {
                    "MouseSensitivity": 50.5,
                    "TargetFrameRate": 4,
                    "TextureQuality": 1,
                    "TextureFilter": 2,
                    "AnistropicFiltering": 5,
                    "AntiAliasing": 2,
                    "LightQuality": 2
                },
                "WebGL": {
                    "MouseSensitivity": 50.5,
                    "TargetFrameRate": 4,
                    "TextureQuality": 1,
                    "TextureFilter": 1,
                    "AnistropicFiltering": 4,
                    "AntiAliasing": 1,
                    "LightQuality": 1
                },
                "Touch": {
                    "MouseSensitivity": 50.5,
                    "TargetFrameRate": 4,
                    "TextureQuality": 1,
                    "TextureFilter": 1,
                    "AnistropicFiltering": 3,
                    "AntiAliasing": 0,
                    "LightQuality": 0
                }
            }
        }
    }
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.GetProfileMetaData,
            Parameters: {
                "245": new String("{}"),
                "207": new String(JSON.stringify(dat)),
                "208": new Bool(true),
                "196": new Bool(false),
            },
        }
    })
    Socket.send(data);
}
export function PlayerPlanetData(Socket, ActorNr, Data) {
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.PlayerPlanetData,
            Parameters: {
                "245": new String(JSON.stringify(Data)), /* {
                    "highScoreGamePoints": 0,
                    "rank": 0,
                    "progressionGamePoints": 30,
                    "playtime": "00:00:00",
                    "gamePassTier": 0,
                    "playerPlanetMetaData": {
                        "gamePassTierSeen": 0,
                        "welcomeRewardClaimed": false,
                        "lastDailyWelcomeRewardClaim": "0001-01-01T00:00:00"
                    },
                    "previewGamePassTier": 0
                }*/
                "254": new Int(ActorNr),
            },
        }
    })
    Socket.send(data);
}
export function GetPublishedPlanetProfileData(Socket) {
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.GetPublishedPlanetProfileData,
            Parameters: {
                "245": new String(JSON.stringify({
                    "playerPlanetData": null,
                    "playerTierStateCalculator": null
                })),
            },
        }
    })
    Socket.send(data);
}
export function SetActorReady(Socket, Bool_, ActorNr) {
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.SetActorReady,
            Parameters: {
                254: new Int(ActorNr),
                208: new Bool(Bool_)
            },
        }
    })
    Socket.send(data);
}
export function SetupUserPlayMode(Socket, Teams, UsersList, UserIndex, Timestamp, GameStateSettings) {
    let TeamsDict = new Dictionary();
    let UsersDict = new Dictionary();
    let User = UsersList[UserIndex];
    Teams.forEach((team) => {
        TeamsDict.Value.push({
            Key: new Int(team.Id), Value: new Dictionary([
                { Key: new Byte(0), Value: new Bool(team.Enabeled) },
            ])
        });
    })
    UsersList.forEach((user) => {
        UsersDict.Value.push({
            Key: new Int(user.ActorNr),
            Value: new Dictionary([
                { Key: new Byte(11), Value: new Int(user.ProfileID) },
                { Key: new Byte(68), Value: new Byte(user.AvatarStatus) },
                { Key: new Byte(89), Value: new Int(user.TeamID) },
                { Key: new Byte(154), Value: new String(user.RegionCode) },
                { Key: new Byte(169), Value: new Int(user.Level) },
                { Key: new Byte(188), Value: new Byte(user.ClientBuildTarget) },
                { Key: new Byte(210), Value: new Bool(user.IsActorReady) },
                { Key: new Byte(223), Value: new String(JSON.stringify(user.PlayerPlanetData)) },
                { Key: new Byte(224), Value: new String(JSON.stringify(user.UserProfileData)) },
                { Key: new Byte(245), Value: new String(JSON.stringify(user.Data)) },
            ])
        });
    });
    let { GameStateType, GameStateDuration, GameStateStartTime } = GameStateSettings;
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.SetupUserPlayMode,
            Parameters: {
                "245": new String(JSON.stringify(User.Data)),
                "207": new String(JSON.stringify({ "spawnRolesDefaultTypeWoIDMap": { "DefaultPlayModeSpawnRole": User.Data.activeSpawnRole } })),
                "158": new ByteArray([0, 0, 0, 0]), //GameStatCounterData
                "35": new Int(Timestamp), //Timestamp
                "65": new Int(GameStateType), //GameStateType
                "66": new Int(GameStateDuration), //GameStateDuration
                "67": new Int(GameStateStartTime), //GameStateStartTime
                "191": new Int(User.Data.activeSpawnRole + 1), //Id
                "90": TeamsDict,
                "13": UsersDict,
            },
        }
    })
    Socket.send(data);
}
export async function GameSnapshotData(Socket, Data, callback) {
    for (var i = 0; i < Data.length / 5e3; i++) {
        let arr = Data.slice(i * 5e3, (i + 1) * 5e3);
        let BytesLeft = arr.length >= 5000;
        let data = Serialize({
            MagicNumber,
            EgMessageType: "Event",
            Data: {
                Code: MVEventCodes.GameSnapshotData,
                Parameters: {
                    "245": new ByteArray(arr),
                    "133": new Byte(0),
                    "100": new Bool(BytesLeft)
                },
            }
        })
        Socket.send(data);
        if (!BytesLeft) callback()
    }
}
export function LogicFrame(Socket) {
    let data = Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.LogicFrame,
            Parameters: {},
        }
    })
    Socket.send(data);
}
export function UpdateWorldObjectDataPartial(Socket, ActorNr, WorldObjectID, WorldObjectData) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.UpdateWorldObjectDataPartial,
            Parameters: {
                "18": new Dictionary(WorldObjectData),
                "22": new Int(WorldObjectID), //QueryId
                "254": new Int(ActorNr),
            },
        }
    }));
}

let LastId = 4;
export function PendingByteDataBatch(Socket, ActorNr, QueryType, Data, callback) {
    callback ??= _ => 0
    for (var i = 0; i < Data.length / 5e3; i++) {
        let arr = Data.slice(i * 5e3, (i + 1) * 5e3);
        let BytesLeft = arr.length >= 5000;
        let data = Serialize({
            MagicNumber,
            EgMessageType: "Event",
            Data: {
                Code: MVEventCodes.PendingByteDataBatch,
                Parameters: {
                    "245": new ByteArray(arr),
                    "133": new Byte(QueryType),
                    "100": new Bool(BytesLeft),
                    "99": new Int(LastId), //QueryId
                    "254": new Int(ActorNr),
                },
            }
        })
        Socket.send(data);
        if (!BytesLeft) {
            LastId++;
            callback();
        }
    }
}
export function UpdateWorldObjectRunTimeData(Socket, ActorNr, WorldObjectID, WorldObjectRunTimeData) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.UpdateWorldObjectRunTimeData,
            Parameters: {
                "70": new Dictionary(WorldObjectRunTimeData),
                "22": new Int(WorldObjectID),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function NextLevelGoldReward(Socket, ActorNr, Data) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.NextLevelGoldReward,
            Parameters: {
                "245": new String(JSON.stringify(Data)),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function GameStateChange(Socket, ActorNr, GameStateType, GameStateDuration, GameStateStartTime) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.GameStateChange,
            Parameters: {
                "65": new Int(GameStateType),
                "66": new Int(GameStateDuration),
                "67": new Int(GameStateStartTime),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function PostChatMsg(Socket, ActorNr, GameMsgType, Message) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.PostGameMsgEvent,
            Parameters: {
                "87": new Int(GameMsgType),
                "88": new Dictionary(Message),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function SetTeam(Socket, ActorNr, TeamID) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.SetTeam,
            Parameters: {
                "89": new Int(TeamID),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function PickupItemStateChange(Socket, ActorNr, WorldObjectID, PickupItemState) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.PickupItemStateChange,
            Parameters: {
                "22": new Int(WorldObjectID),
                "71": new Int(PickupItemState),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function UpdateLineOfFire(Socket, ActorNr, WorldObjectID, CamOriginX, CamOriginY, CamOriginZ, CamDirX, CamDirY, CamDirZ) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.UpdateLineOfFire,
            Parameters: {
                "22": new Int(WorldObjectID),
                "74": new Float(CamOriginX),
                "75": new Float(CamOriginY),
                "76": new Float(CamOriginZ),
                "77": new Float(CamDirX),
                "78": new Float(CamDirY),
                "79": new Float(CamDirZ),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function UpdatePrototype(Socket, ActorNr, WorldInventoryID, WorldInventoryData) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.UpdatePrototype,
            Parameters: {
                "47": new Int(WorldInventoryID),
                "49": new ByteArray(WorldInventoryData),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function JoinEvent(Socket, Data) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.Join,
            Parameters: {
                "11": new Int(Data.ProfileID),
                "89": new Int(Data.TeamID),
                "154": new String(Data.RegionCode),
                "188": new Byte(Data.ClientBuildTarget),
                "208": new Bool(Data.IsActorReady),
                "224": new String(JSON.stringify(Data.UserProfileData)),
                "254": new Int(Data.ActorNr),
            },
        }
    }));
}
export function ReplicateSpawnRoleData(Socket, ActorNr, Data) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.ReplicateSpawnRoleData,
            Parameters: {
                "245": new String(JSON.stringify(Data)),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function Leave(Socket, ActorNr) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.Leave,
            Parameters: {
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function WorldObjectRPCEvent(Socket, ActorNr, WorldObjectID, WorldObjectRPCData) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.WorldObjectRPCEvent,
            Parameters: {
                "83": new Dictionary(WorldObjectRPCData),
                "22": new Int(WorldObjectID),
                "254": new Int(ActorNr),
            },
        }
    }));
}
export function LogicObjectFiringStateChange(Socket, Timestamp, WorldObjectID, IsFiring) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.LogicObjectFiringStateChange,
            Parameters: {
                "35": new Int(Timestamp),
                "22": new Int(WorldObjectID),
                "204": new Int(IsFiring),
            },
        }
    }));
}
export function LogicFastForward(Socket, Timestamp) {
    Socket.send(Serialize({
        MagicNumber,
        EgMessageType: "Event",
        Data: {
            Code: MVEventCodes.LogicFastForward,
            Parameters: {
                "35": new Int(Timestamp),
            },
        }
    }));
}
