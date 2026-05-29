import { getWorldInventoryData } from "./BytePacker.js";
import Avatar0 from "./Avatars/Avatar-1.js";

class GameSnapShotHelper {
  PlayModeAvatarData() {
    return {
      Id: -1,
      GroupId: -1,
      ItemId: -1,
      WorldObjectType: "PlayModeAvatar",
      WorldObjectTypeId: 0,
      Position: { X: 0, Y: 0, Z: 0 },
      Rotation: { X: 1, Y: 0, Z: 0, W: 1 },
      Scale: { X: 1, Y: 1, Z: 1 },
      Data: {},
      OwnerShipFlag: 1,
      OwnerActorNumber: -1,
      PreviewOwnerProfileId: null,
      RuntimeData: {
        health: [100, 2],
        maxHealth: [100, 0],
        shield: [0, 2],
        isFiring: [0, 5],
        modifiers: {},
        currentItem: { type: [5, 0] },
        lineOfFire: {},
        invulnerable: [0, 5],
        seat: [-1, 0],
        spawnRoleModeType: [4, 0],
        headRotationYaw: [0, 2],
        headRotationPitch: [0, 2],
        pointRotationYaw: [0, 2],
        pointRotationPitch: [0, 2],
        hasHandEquippableItem: [0, 5],
        size: [1, 2],
        emote: [0, 0],
        animation: { state: ["Idle", 7], timeStamp: [0, 0] },
      },
    };
  }
  BuildModeAvatarData() {
    return {
      Id: -1,
      GroupId: -1,
      ItemId: -1,
      WorldObjectType: "BuildModeAvatar",
      WorldObjectTypeId: 133,
      Position: { X: 0, Y: 0, Z: 0 },
      Rotation: { X: 1, Y: 0, Z: 0, W: 1 },
      Scale: { X: 1, Y: 1, Z: 1 },
      Data: {},
      OwnerShipFlag: 1,
      OwnerActorNumber: -1,
      PreviewOwnerProfileId: null,
      RuntimeData: {
        health: [100, 2],
        maxHealth: [100, 0],
        shield: [0, 2],
        isFiring: [0, 5],
        modifiers: {},
        currentItem: { type: [5, 0] },
        lineOfFire: {},
        invulnerable: [0, 5],
        seat: [-1, 0],
        spawnRoleModeType: [4, 0],
        headRotationYaw: [0, 2],
        headRotationPitch: [0, 2],
        pointRotationYaw: [0, 2],
        pointRotationPitch: [0, 2],
        hasHandEquippableItem: [0, 5],
        size: [1, 2],
        emote: [0, 0],
        animation: { state: ["Idle", 7], timeStamp: [0, 0] },
      },
    };
  }
  constructor(World) {
    const { Prototypes, WorldObjects, Links, ObjectLinks } = structuredClone(World);
    this.Prototypes = Prototypes || [];
    this.WorldObjects = WorldObjects || [];
    this.Links = Links || [];
    this.ObjectLinks = ObjectLinks || [];
    this.RootGroup = WorldObjects.find((l) => l.GroupId === -1) || null;
    const getBiggestId = (objects) => {
      return objects.reduce((max, obj) => (obj.Id >= max ? obj.Id : max), 0);
    };
    this.PrototypesLastId = getBiggestId(this.Prototypes) + 1;
    this.WorldObjectsNextId = getBiggestId(this.WorldObjects) + 1;
  }

  GetWorld() {
    return {
      Prototypes: this.Prototypes,
      WorldObjects: this.WorldObjects,
      Links: this.Links,
      ObjectLinks: this.ObjectLinks,
    };
  }

  GetNextPrototypeId() {
    return this.PrototypesLastId++;
  }

  GetNextWorldObjectId() {
    return this.WorldObjectsNextId++;
  }

  GetChildren(Objects, { Id }) {
    let result = [];
    const children = Objects.filter((obj) => obj.GroupId === Id);
    for (const child of children) {
      result.push(child);
      result = result.concat(this.GetChildren(Objects, child));
    }
    return result;
  }

  SetGravity(gravity) {
    let index = this.WorldObjects.findIndex((l) => l.WorldObjectTypeId === 146);
    if (index > -1) {
      this.WorldObjects[index].Data.gravity = [gravity, 2];
      return [this.WorldObjects[index], 1];
    } else {
      let WorldObject = {
        Id: this.GetNextWorldObjectId(),
        GroupId: this.RootGroup?.Id ?? -1,
        ItemId: 10,
        WorldObjectType: "Gravity",
        WorldObjectTypeId: 146,
        Position: { X: 0, Y: 0, Z: 0 },
        Rotation: { X: 1, Y: 0, Z: 0, W: 1 },
        Scale: { X: 1, Y: 1, Z: 1 },
        Data: { gravity: [gravity, 2] },
        OwnerShipFlag: 0,
        OwnerActorNumber: null,
        PreviewOwnerProfileId: null,
        RuntimeData: {},
      };
      this.WorldObjects.push(WorldObject);
      return [WorldObject, 0];
    }
  }

  UpdateWorldObject(WorldObjectID, func) {
    const worldObject = this.WorldObjects.find((l) => l.Id === WorldObjectID);
    if (worldObject) {
      func(worldObject);
    } else {
      console.warn(`WorldObject with ID ${WorldObjectID} not found`);
    }
  }

  UpdatePrototype(WorldInventoryID, WorldInventoryData) {
    function RemoveByCoords(arr, x, y, z) {
      const index = arr.findIndex(
        ({ x: x1, y: y1, z: z1 }) => x1 === x && y1 === y && z1 === z
      );
      if (index !== -1) arr.splice(index, 1);
    }
    const index = this.Prototypes.findIndex((l) => l.Id === WorldInventoryID);
    if (index === -1) {
      console.warn(`Prototype with ID ${WorldInventoryID} not found`);
      return -1;
    }
    const { action, ...Data } = getWorldInventoryData(WorldInventoryData);
    if (action === 0) {
      const { x, y, z } = Data;
      RemoveByCoords(this.Prototypes[index].Data, x, y, z);
      console.log("Removed Cube ", x, y, z);
    } else {
      this.Prototypes[index].Data.push({ ...Data, inRow: false });
      console.log("L ", this.Prototypes[index].Data.length);
      console.log("Placed Cube ", Data);
    }
    return index;
  }

  ChangeWorldObjectPrototypeId(Objects, WorldObject, Prototypes) {
    if (!WorldObject.Data?.protoTypeID || !Array.isArray(WorldObject.Data.protoTypeID)) {
      console.warn(`No valid protoTypeID for WorldObject ${WorldObject.Id}`);
      return;
    }

    const orgPrototypeID = WorldObject.Data.protoTypeID[0];
    const newPrototypeID = this.GetNextPrototypeId();

    const objectIndex = Objects.findIndex((obj) => obj === WorldObject);
    if (objectIndex !== -1) {
      Objects[objectIndex].Data.protoTypeID[0] = newPrototypeID;
    } else {
      console.warn(`WorldObject ${WorldObject.Id} not found in Objects`);
    }

    const prototype = Prototypes.find((p) => p.Id === orgPrototypeID);
    if (prototype) {
      prototype.Id = newPrototypeID;
    } else {
      console.warn(`Prototype with ID ${orgPrototypeID} not found`);
    }
  }

  ChangeWorldObjectId(Objects, Prototypes, WorldObject) {
    const Children = this.GetChildren(Objects, WorldObject);
    WorldObject.Id = this.GetNextWorldObjectId();

    for (const child of Children) {
      const index = Objects.findIndex((obj) => obj === child);
      if (index === -1) continue;

      const originalId = child.Id;
      child.GroupId = WorldObject.Id;
      child.Id = this.GetNextWorldObjectId();

      if ([1, 8, 32].includes(child.WorldObjectTypeId)) {
        this.ChangeWorldObjectPrototypeId(Objects, child, Prototypes);
      }

      if (
        WorldObject.Data?.BlueprintData?.ChildrenMap &&
        typeof WorldObject.Data.BlueprintData.ChildrenMap === "object"
      ) {
        for (const [key, value] of Object.entries(
          WorldObject.Data.BlueprintData.ChildrenMap
        )) {
          if (Array.isArray(value) && value[0] === originalId && value[1] === 0) {
            WorldObject.Data.BlueprintData.ChildrenMap[key] = [child.Id, 0];
          }
        }
      }
    }
  }

  GetWorldObjectFromId(Id) {
    return this.WorldObjects.find((l) => l.Id === Id);
  }

  RemoveWorldObjectFromId(Id) {
    const WorldObject = this.WorldObjects.find((l) => l.Id === Id);
    if (!WorldObject) {
      console.warn(`WorldObject with ID ${Id} not found`);
      return;
    }
    const Children = this.GetChildren(this.WorldObjects, { Id }) || [];
    [WorldObject, ...Children].forEach((child) => {
      const index = this.WorldObjects.findIndex((l) => l === child);
      if (index === -1) return;

      if (child.WorldObjectTypeId === 1) {
        const ProtoTypeID = child.Data?.protoTypeID?.[0];
        if (ProtoTypeID) {
          const pindex = this.Prototypes.findIndex((l) => l.Id === ProtoTypeID);
          if (pindex !== -1) {
            this.Prototypes.splice(pindex, 1);
          }
        }
      }
      this.WorldObjects.splice(index, 1);
    });
  }

  AddAvatar(OwnerActorNumber, Id = 0, gameMode = 1) {
    // Deep clone the JSON data to avoid reusing the same object references
    const { Prototypes: RawPrototypes, WorldObjects: RawWorldObjects } = JSON.parse(
      JSON.stringify(Avatar0)
    );

    // Create a new PlayModeAvatar
    const PlayModeAvatar = gameMode === 1 ? this.PlayModeAvatarData() : this.BuildModeAvatarData();
    PlayModeAvatar.Id = this.GetNextWorldObjectId();
    PlayModeAvatar.OwnerActorNumber = OwnerActorNumber;
    PlayModeAvatar.GroupId = this.RootGroup?.Id ?? -1;

    // Clone WorldObjects and Prototypes to ensure unique instances
    const WorldObjects = RawWorldObjects.map((obj) => ({ ...obj }));
    const Prototypes = RawPrototypes.map((obj) => ({ ...obj }));

    // Find the Blueprint (WorldObjectTypeId == 45)
    const Blueprint = WorldObjects.find((obj) => obj.WorldObjectTypeId === 45);
    if (!Blueprint) {
      console.error("Blueprint not found for WorldObjectTypeId 45");
    }

    // Update Blueprint properties
    Blueprint.GroupId = PlayModeAvatar.Id;
    Blueprint.OwnerActorNumber = OwnerActorNumber;

    // Update IDs for Blueprint and its children
    this.ChangeWorldObjectId(WorldObjects, Prototypes, Blueprint);

    // Add the new objects to the world
    this.WorldObjects.push(PlayModeAvatar, ...WorldObjects);
    this.Prototypes.push(...Prototypes);

    // Log for debugging
    console.log("PlayModeAvatar:", PlayModeAvatar);
    console.log("Blueprint:", Blueprint);
    console.log(
      "Blueprint ChildrenMap:",
      Blueprint.Data?.BlueprintData?.ChildrenMap || "N/A"
    );

    // Return the updated world state
    const World = {
      Prototypes: [...Prototypes],
      WorldObjects: [PlayModeAvatar, ...WorldObjects],
      Links: [],
      ObjectLinks: [],
    };
    return [PlayModeAvatar, World];
  }
}

export default GameSnapShotHelper;