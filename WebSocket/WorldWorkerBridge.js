/**
 * WorldWorkerBridge.js
 * Thin ES-module wrapper around WorldWorker.js.
 * Exposes the same getWorldData / setWorldData signatures as BytePacker.js
 * but runs the heavy work in a Web Worker.
 */

let _worker = null;
let _pending = new Map(); // id → { resolve, reject }
let _nextId  = 0;

function getWorker() {
    if (_worker) return _worker;
    _worker = new Worker(new URL('./WorldWorker.js', import.meta.url));
    _worker.onmessage = ({ data }) => {
        const { id, type, result, error } = data;
        const p = _pending.get(id);
        if (!p) return;
        _pending.delete(id);
        if (error) p.reject(new Error(error));
        else        p.resolve({ type, result });
    };
    _worker.onerror = (e) => {
        // Reject all pending on fatal worker error
        for (const [, p] of _pending) p.reject(new Error(e.message));
        _pending.clear();
        _worker = null; // allow re-creation on next call
    };
    return _worker;
}

function call(type, payload, transfer = []) {
    return new Promise((resolve, reject) => {
        const id = _nextId++;
        _pending.set(id, { resolve, reject });
        getWorker().postMessage({ id, type, payload }, transfer);
    });
}

/**
 * Decode raw world bytes into a world object.
 * @param {Uint8Array|ArrayBuffer} bytes
 * @param {function} [callback]  progress callback (25/50/75/100)
 * @returns {Promise<object>}
 */
export async function getWorldData(bytes, callback) {
    // Transfer the buffer to the worker (zero-copy)
    const ab = bytes instanceof ArrayBuffer
        ? bytes
        : bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

    callback?.(0);
    const { result } = await call('decode', ab, [ab]);
    callback?.(100);
    return result;
}

/**
 * Encode a world object back to bytes.
 * @param {object} Data
 * @param {function} [callback]  progress callback (25/50/75/100)
 * @returns {Promise<Uint8Array>}
 */
export async function setWorldData(Data, callback) {
    callback?.(0);
    const { result } = await call('encode', Data);
    callback?.(100);
    return new Uint8Array(result);
}

// Re-export StreamBuffer from BytePacker for callers that still need it
export { StreamBuffer } from './BytePacker.js';