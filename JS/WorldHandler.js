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
        handler.RemoveAvatars();
        return handler.gameSnapshotHelper.GetWorld();
    }
    static RemapKgmapFile(bytes) {
        const view = new StreamBuffer(bytes);
        const magic = view.ReadUint(false);
        const version = view.ReadUshort(false);
        const metadata = view.ReadString(view.ReadInt(false));

        console.log("Magic:", magic);
        console.log("Version:", version);
        console.log("Metadata:", metadata);

        const batchesCount = view.ReadInt(false);

        const outbytes = [];
        for (let i = 0; i < batchesCount; i++) {
            const batch = view.ReadByteArray(view.ReadInt(false));
            outbytes.push(...batch);
        }

        return outbytes;
    }
    RemoveAvatars() {
        this.world.WorldObjects.filter(l => l.WorldObjectTypeId == 0).forEach(l => {
            this.gameSnapshotHelper.RemoveWorldObjectFromId(l.Id);
        });
    }
}

window.WorldHandler = WorldHandler;