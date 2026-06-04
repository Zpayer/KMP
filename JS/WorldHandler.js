import GameSnapShotHelper from "../WebSocket/GameSnapShotHelper.js";
import { getWorldData, StreamBuffer } from "../WebSocket/WorldWorkerBridge.js";



class WorldHandler {
    constructor(world) {
        this.world = world;
        this.gameSnapshotHelper = new GameSnapShotHelper(this.world);
    }
    static async DecodeWorld(bytes) {
        // bytes can be Uint8Array or plain array — bridge handles both
        const raw = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
        const world = await getWorldData(raw, (e) => console.log("[" + e + "] Planet Decoding..."));
        const handler = new WorldHandler(world);
        handler.CleanupWorld();
        return handler.gameSnapshotHelper.GetWorld();
    }
    static RemapKgmapFile(bytes) {
        const view = new StreamBuffer(bytes);

        const magic = view.ReadUint(false);
        const version = view.ReadUshort(false);

        let metadata;
        if (version == 6) metadata = view.ReadString(view.ReadInt(false));

        console.log("Magic:", magic, "Version:", version, "Metadata:", metadata);

        const batchesCount = view.ReadInt(false);

        const batches = [];
        let totalLength = 0;
        for (let i = 0; i < batchesCount; i++) {
            const batch = view.ReadByteArray(view.ReadInt(false));
            batches.push(batch);
            totalLength += batch.length;
        }

        const out = new Uint8Array(totalLength);
        let offset = 0;
        for (const batch of batches) {
            out.set(batch, offset);
            offset += batch.length;
        }

        return out;
    }
    CleanupWorld() {
        window.WorldBefore = structuredClone(this.world);

        this.world.WorldObjects.filter(l =>
            (l.WorldObjectTypeId == 0 && l.GroupId == this.gameSnapshotHelper.RootGroup.Id) ||
            (l.WorldObjectTypeId == 133 && l.GroupId == this.gameSnapshotHelper.RootGroup.Id) ||
            ((l.WorldObjectType == "HoverCraft" | l.WorldObjectType == "JetPack") && l.GroupId == this.gameSnapshotHelper.RootGroup.Id)

        ).forEach(l => {
            this.gameSnapshotHelper.RemoveWorldObjectFromId(l.Id);
        });
        /*
        this.world.WorldObjects.filter(l => l.WorldObjectType == "UseLever").forEach(l => {
            try {
                l.RuntimeData.a[0] = true;
            } catch (e) { console.log(e,l) }
        });
        */
    }
}

window.WorldHandler = WorldHandler;