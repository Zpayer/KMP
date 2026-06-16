import { getWorldInventoryData } from "./BytePacker.js";
import Avatar0 from "./DefaultAvatar.js";
import log from "../JS/Log.js";

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

  CloneLinksToOusideGroup = true;
  CloneObjectLinksToOusideGroup = true;
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
    this.PrototypesNextId = getBiggestId(this.Prototypes) + 1;
    this.WorldObjectsNextId = getBiggestId(this.WorldObjects) + 1;
    this.LinksNextId = this.Links.length ? getBiggestId(this.Links) + 1 : null;
    this.ObjectLinksNextId = this.ObjectLinks.length ? getBiggestId(this.ObjectLinks) + 1 : null;
  }

  GetWorld() {
    return {
      Prototypes: this.Prototypes,
      WorldObjects: this.WorldObjects,
      Links: this.Links,
      ObjectLinks: this.ObjectLinks,
    };
  }

  GetLinks(worldObjectId) {
    [
      this.Links.filter(l => l.LinkToID === worldObjectId),
      this.Links.filter(l => l.LinkFromID === worldObjectId)
    ]

  }

  GetObjectLink(worldObjectId) {
    [
      this.ObjectLinks.filter(l => l.LinkToID === worldObjectId),
      this.ObjectLinks.filter(l => l.LinkFromID === worldObjectId)
    ]
  }
  GetNextPrototypeId() {
    return this.PrototypesNextId++;
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
      log.warn("GameSnapShot", `WorldObject with ID ${WorldObjectID} not found`);
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
      log.warn("Prototype", `ID ${WorldInventoryID} not found`);
      return -1;
    }
    const { action, ...Data } = getWorldInventoryData(WorldInventoryData);
    if (action === 0) {
      const { x, y, z } = Data;
      RemoveByCoords(this.Prototypes[index].Data, x, y, z);
      log.debug("Prototype", `Removed cube at (${x}, ${y}, ${z})`);
    } else {
      this.Prototypes[index].Data.push({ ...Data, inRow: false });
      log.debug("Prototype", `Placed cube at`, Data, `total: ${this.Prototypes[index].Data.length}`);
    }
    return index;
  }

  ChangeWorldObjectPrototypeId(Objects, WorldObject, Prototypes) {
    if (!WorldObject.Data?.protoTypeID || !Array.isArray(WorldObject.Data.protoTypeID)) {
      log.warn("Prototype", `No valid protoTypeID for WorldObject ${WorldObject.Id}`);
      return;
    }

    const orgPrototypeID = WorldObject.Data.protoTypeID[0];
    const newPrototypeID = this.GetNextPrototypeId();

    const objectIndex = Objects.findIndex((obj) => obj === WorldObject);
    if (objectIndex !== -1) {
      Objects[objectIndex].Data.protoTypeID[0] = newPrototypeID;
    } else {
      log.warn("Prototype", `WorldObject ${WorldObject.Id} not found in Objects`);
    }

    const prototype = Prototypes.find((p) => p.Id === orgPrototypeID);
    if (prototype) {
      prototype.Id = newPrototypeID;
    } else {
      log.warn("Prototype", `Prototype with ID ${orgPrototypeID} not found`);
    }
  }

  ChangeWorldObjectId(Objects, Prototypes, WorldObject) {
    // Build an id-remap table so every object can fix its own GroupId
    // after all ids have been reassigned, regardless of nesting depth.
    const allDescendants = this.GetChildren(Objects, WorldObject);

    // Step 1 — collect old→new id mapping for every node in the subtree
    const idMap = new Map(); // oldId → newId
    idMap.set(WorldObject.Id, this.GetNextWorldObjectId());
    for (const child of allDescendants) {
      idMap.set(child.Id, this.GetNextWorldObjectId());
    }

    // Step 2 — apply new ids and fix GroupIds using the map
    WorldObject.Id = idMap.get(WorldObject.Id);

    for (const child of allDescendants) {
      const originalId = child.Id;
      child.Id = idMap.get(originalId);
      // GroupId must point to the parent's NEW id, not the Blueprint's id
      child.GroupId = idMap.get(child.GroupId) ?? child.GroupId;

      // Remap prototype reference for cube-type objects
      if ([1, 8, 32].includes(child.WorldObjectTypeId)) {
        this.ChangeWorldObjectPrototypeId(Objects, child, Prototypes);
      }

      // Keep ChildrenMap in sync on any object that has one
      const childrenMap = child.Data?.BlueprintData?.ChildrenMap;
      if (childrenMap && typeof childrenMap === "object") {
        for (const [key, value] of Object.entries(childrenMap)) {
          if (Array.isArray(value) && value[1] === 0 && idMap.has(value[0])) {
            childrenMap[key] = [idMap.get(value[0]), 0];
          }
        }
      }
    }

    // Also fix ChildrenMap on the root Blueprint itself
    const rootChildrenMap = WorldObject.Data?.BlueprintData?.ChildrenMap;
    if (rootChildrenMap && typeof rootChildrenMap === "object") {
      for (const [key, value] of Object.entries(rootChildrenMap)) {
        if (Array.isArray(value) && value[1] === 0 && idMap.has(value[0])) {
          rootChildrenMap[key] = [idMap.get(value[0]), 0];
        }
      }
    }

    return [WorldObject, ...allDescendants];
  }

  GetWorldObjectFromId(Id) {
    return this.WorldObjects.find((l) => l.Id === Id);
  }
  GetWorldObjectPrototypes(parent) {
    const prototypes = [];
    const children = this.GetChildren(this.WorldObjects, parent);
    for (const child of children) {
      if ([1, 8, 32].includes(child.WorldObjectTypeId)) {
        if (!child.Data?.protoTypeID || !Array.isArray(child.Data.protoTypeID)) {
          log.warn("Prototype", `No valid protoTypeID for WorldObject ${child.Id}`);
          return;
        }
        const prototypeID = child.Data.protoTypeID[0];
        const prototype = this.Prototypes.find((p) => p.Id === prototypeID);
        if (prototype) prototypes.push(prototype)
      }
    }
    return prototypes;
  }
  RemoveWorldObjectFromId(Id) {
    const WorldObject = this.WorldObjects.find((l) => l.Id === Id);
    if (!WorldObject) {
      log.warn("GameSnapShot", `WorldObject with ID ${Id} not found`);
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

  AddAvatar(OwnerActorNumber, Avatar, gameMode = 1) {
    const { Prototypes: RawPrototypes, WorldObjects: RawWorldObjects } = structuredClone(Avatar ?? Avatar0);

    const PlayModeAvatar = gameMode === 1 ? this.PlayModeAvatarData() : this.BuildModeAvatarData();
    PlayModeAvatar.Id = this.GetNextWorldObjectId();
    PlayModeAvatar.OwnerActorNumber = OwnerActorNumber;
    PlayModeAvatar.GroupId = this.RootGroup?.Id ?? -1;

    const WorldObjects = structuredClone(RawWorldObjects);
    const Prototypes = structuredClone(RawPrototypes);

    const Blueprint = WorldObjects.find((obj) => obj.WorldObjectTypeId === 45);
    if (!Blueprint) {
      log.error("AddAvatar", "Blueprint (WorldObjectTypeId 45) not found in avatar data");
    }
    Blueprint.GroupId = PlayModeAvatar.Id;
    Blueprint.OwnerActorNumber = OwnerActorNumber;

    this.ChangeWorldObjectId(WorldObjects, Prototypes, Blueprint);

    // Add the new objects to the world
    this.WorldObjects.push(PlayModeAvatar, ...WorldObjects);
    this.Prototypes.push(...Prototypes);

    log.debug("AddAvatar", `ActorNr:${OwnerActorNumber} AvatarId:${PlayModeAvatar.Id} BlueprintId:${Blueprint.Id}`);

    // Return the updated world state
    const World = {
      Prototypes: [...Prototypes],
      WorldObjects: [PlayModeAvatar, ...WorldObjects],
      Links: [],
      ObjectLinks: [],
    };
    return [PlayModeAvatar, World];
  }

  ResetWorldObjectSpawnerVehicle() {
    this.WorldObjects.filter(l => l.WorldObjectType == "WorldObjectSpawnerVehicle").forEach(l => {
      try { l.RuntimeData.UseTime[0] = 0; } catch { }
    });
  }

  /**
   * Clones a WorldObject and its entire subtree into the world.
   *
   * - All WorldObject IDs and GroupIds are remapped to fresh IDs
   * - Prototypes referenced by cube-type objects are deep-cloned and remapped
   * - Links/ObjectLinks whose BOTH endpoints are inside the cloned subtree
   *   are cloned too (internal wiring stays intact)
   * - Links/ObjectLinks that cross outside the subtree are cloned only if
   *   CloneLinksToOusideGroup / CloneObjectLinksToOusideGroup are true
   *
   * @param {number}  sourceId        Id of the root WorldObject to clone
   * @param {number}  [newGroupId]    GroupId for the clone root (defaults to same group as source)
   * @param {object}  [positionOffset] Optional {X,Y,Z} offset applied to the root clone position
   * @returns {{ root, worldObjects, prototypes, links, objectLinks }}
   *          The cloned objects (already pushed into this.WorldObjects / this.Prototypes / etc.)
   *          Returns null if sourceId is not found.
   */
  CloneWorldObject(sourceId, newGroupId, positionOffset) {
    // ── 1. Find source root ───────────────────────────────────────────────────
    const sourceRoot = this.GetWorldObjectFromId(sourceId);
    if (!sourceRoot) {
      log.warn("Clone", `WorldObject ${sourceId} not found`);
      return null;
    }

    // ── 2. Collect the full subtree (root + all descendants) ─────────────────
    const sourceSubtree = [sourceRoot, ...this.GetChildren(this.WorldObjects, sourceRoot)];
    const sourceIds = new Set(sourceSubtree.map(o => o.Id));

    // ── 3. Deep-clone the subtree objects ────────────────────────────────────
    const clonedObjects = structuredClone(sourceSubtree);

    // ── 4. Clone prototypes referenced by cube-type objects in the subtree ───
    //      Types 1 (CubeModel), 8 (CubeModelPrototypeTerrain), 32 (CubeModelTerrainFineGrained)
    const CUBE_TYPES = new Set([1, 8, 32]);
    const clonedPrototypes = [];
    const protoIdMap = new Map(); // oldProtoId → newProtoId

    for (const obj of clonedObjects) {
      if (!CUBE_TYPES.has(obj.WorldObjectTypeId)) continue;
      const oldProtoId = obj.Data?.protoTypeID?.[0];
      if (oldProtoId == null) continue;

      if (!protoIdMap.has(oldProtoId)) {
        const srcProto = this.Prototypes.find(p => p.Id === oldProtoId);
        if (!srcProto) {
          log.warn("Clone", `Prototype ${oldProtoId} not found for WorldObject ${obj.Id}`);
          continue;
        }
        const clonedProto = structuredClone(srcProto);
        clonedProto.Id = this.GetNextPrototypeId();
        protoIdMap.set(oldProtoId, clonedProto.Id);
        clonedPrototypes.push(clonedProto);
      }

      obj.Data.protoTypeID[0] = protoIdMap.get(oldProtoId);
    }

    // ── 5. Build WorldObject id remap and apply ───────────────────────────────
    const idMap = new Map(); // oldId → newId
    for (const obj of clonedObjects) {
      idMap.set(obj.Id, this.GetNextWorldObjectId());
    }

    for (const obj of clonedObjects) {
      obj.Id = idMap.get(obj.Id);

      // GroupId: if parent is inside the clone, remap it; otherwise use newGroupId
      if (idMap.has(obj.GroupId)) {
        obj.GroupId = idMap.get(obj.GroupId);
      } else {
        // This is the root — point it at the requested group
        obj.GroupId = newGroupId ?? sourceRoot.GroupId;
      }

      // Fix ChildrenMap entries that reference objects inside the clone
      const childrenMap = obj.Data?.BlueprintData?.ChildrenMap;
      if (childrenMap && typeof childrenMap === "object") {
        for (const [key, value] of Object.entries(childrenMap)) {
          if (Array.isArray(value) && value[1] === 0 && idMap.has(value[0])) {
            childrenMap[key] = [idMap.get(value[0]), 0];
          }
        }
      }
    }

    // Apply position offset to the root clone if provided
    const cloneRoot = clonedObjects[0];
    if (positionOffset) {
      cloneRoot.Position = {
        X: cloneRoot.Position.X + (positionOffset.X ?? 0),
        Y: cloneRoot.Position.Y + (positionOffset.Y ?? 0),
        Z: cloneRoot.Position.Z + (positionOffset.Z ?? 0),
      };
    }

    // ── 6. Clone Links ────────────────────────────────────────────────────────
    const clonedLinks = [];
    for (const link of this.Links) {
      const fromInside = sourceIds.has(link.LinkFromID);
      const toInside = sourceIds.has(link.LinkToID);

      if (!fromInside && !toInside) continue; // unrelated
      if ((!fromInside || !toInside) && !this.CloneLinksToOusideGroup) continue; // crosses boundary, opt-out

      const newLink = {
        Id: (this.LinksNextId ?? 0) + clonedLinks.length,
        LinkFromID: idMap.get(link.LinkFromID) ?? link.LinkFromID,
        LinkToID: idMap.get(link.LinkToID) ?? link.LinkToID,
      };
      clonedLinks.push(newLink);
    }
    if (clonedLinks.length) {
      this.LinksNextId = (this.LinksNextId ?? 0) + clonedLinks.length;
    }

    // ── 7. Clone ObjectLinks ──────────────────────────────────────────────────
    const clonedObjectLinks = [];
    for (const link of this.ObjectLinks) {
      const fromInside = sourceIds.has(link.LinkFromID);
      const toInside = sourceIds.has(link.LinkToID);

      if (!fromInside && !toInside) continue;
      if ((!fromInside || !toInside) && !this.CloneObjectLinksToOusideGroup) continue;

      const newLink = {
        Id: (this.ObjectLinksNextId ?? 0) + clonedObjectLinks.length,
        LinkFromID: idMap.get(link.LinkFromID) ?? link.LinkFromID,
        LinkToID: idMap.get(link.LinkToID) ?? link.LinkToID,
      };
      clonedObjectLinks.push(newLink);
    }
    if (clonedObjectLinks.length) {
      this.ObjectLinksNextId = (this.ObjectLinksNextId ?? 0) + clonedObjectLinks.length;
    }

    // ── 8. Commit to world state ──────────────────────────────────────────────
    this.WorldObjects.push(...clonedObjects);
    this.Prototypes.push(...clonedPrototypes);
    this.Links.push(...clonedLinks);
    this.ObjectLinks.push(...clonedObjectLinks);

    log.debug("Clone", `Cloned ${clonedObjects.length} objects, ${clonedPrototypes.length} prototypes, ${clonedLinks.length} links — root: ${sourceId} → ${cloneRoot.Id}`);

    return {
      root: cloneRoot,
      worldObjects: clonedObjects,
      prototypes: clonedPrototypes,
      links: clonedLinks,
      objectLinks: clonedObjectLinks,
    };
  }

  /**
   * Spawns a vehicle from a WorldObjectSpawnerVehicle.
   * Clones the vehicle child (first direct child of the spawner) into the
   * root group with fresh IDs, sets the driver as owner, and returns the
   * new vehicle's ID so the caller can send the SpawnVehicleWithDriver event.
   *
   * @param {number} spawnerWorldObjectId  Id of the WorldObjectSpawnerVehicle
   * @param {number} driverActorNumber     ActorNumber of the player entering
   * @returns {number|null}  New vehicle WorldObject Id, or null on failure
   */
  SpawnVehicle(spawnerWorldObjectId, driverActorNumber) {
    const spawner = this.GetWorldObjectFromId(spawnerWorldObjectId);
    if (!spawner) {
      log.warn("SpawnVehicle", `Spawner ${spawnerWorldObjectId} not found`);
      return null;
    }

    // The vehicle template is the first direct child of the spawner
    const vehicleTemplate = this.WorldObjects.find(o => o.GroupId === spawner.Id);
    if (!vehicleTemplate) {
      log.warn("SpawnVehicle", `No vehicle child found under spawner ${spawnerWorldObjectId}`);
      return null;
    }

    // Clone the vehicle subtree into the root group (detached from spawner)
    const clone = this.CloneWorldObject(
      vehicleTemplate.Id,
      this.RootGroup?.Id ?? -1,
    );
    if (!clone) return null;

    // Mark the spawned vehicle as owned by the driver
    clone.root.OwnerActorNumber = driverActorNumber ?? null;
    clone.root.OwnerShipFlag = driverActorNumber != null ? 1 : 0;

    // Stamp the spawner's UseTime so it can't be re-used immediately
    try { spawner.RuntimeData.UseTime[0] = Date.now(); } catch { }

    log.debug("SpawnVehicle", `Spawner:${spawnerWorldObjectId} → Vehicle:${clone.root.Id}`);
    return clone.root.Id;
  }
}

export default GameSnapShotHelper;