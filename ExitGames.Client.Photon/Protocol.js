class Protocol {
    static TypeDict = new Map();
    static CodeDict = new Map();
    static ProtocolDefault = null;
    static memFloatBlock = new Float32Array(1);
    static memDeserialize = new Uint8Array(4);

    static TryRegisterType(type, typeCode, serializeFunction, deserializeFunction) {
        if (this.CodeDict.has(typeCode) || this.TypeDict.has(type)) {
            return false;
        }
        const value = new CustomType(type, typeCode, serializeFunction, deserializeFunction);
        this.CodeDict.set(typeCode, value);
        this.TypeDict.set(type, value);
        return true;
    }

    static Serialize(obj) {
        if (!this.ProtocolDefault) {
            this.ProtocolDefault = new Protocol16();
        }
        return this.ProtocolDefault.Serialize(obj);
    }

    static Deserialize(serializedData) {
        if (!this.ProtocolDefault) {
            this.ProtocolDefault = new Protocol16();
        }
        return this.ProtocolDefault.Deserialize(serializedData);
    }

    static SerializeShort(value, target, targetOffset) {
        target[targetOffset++] = value >> 8;
        target[targetOffset++] = value & 0xFF;
        return targetOffset;
    }

    static SerializeInt(value, target, targetOffset) {
        target[targetOffset++] = (value >> 24) & 0xFF;
        target[targetOffset++] = (value >> 16) & 0xFF;
        target[targetOffset++] = (value >> 8) & 0xFF;
        target[targetOffset++] = value & 0xFF;
        return targetOffset;
    }

    static SerializeFloat(value, target, targetOffset) {
        this.memFloatBlock[0] = value;
        const bytes = new Uint8Array(this.memFloatBlock.buffer);
        if (new DataView(new ArrayBuffer(4)).getFloat32(0, true) !== 1.0) {
            bytes.reverse();
        }
        target.set(bytes, targetOffset);
        return targetOffset + 4;
    }

    static DeserializeInt(source, offset) {
        let value = (source[offset++] << 24) | (source[offset++] << 16) | (source[offset++] << 8) | source[offset++];
        return { value, offset };
    }

    static DeserializeShort(source, offset) {
        let value = (source[offset++] << 8) | source[offset++];
        return { value, offset };
    }

    static DeserializeFloat(source, offset) {
        if (new DataView(new ArrayBuffer(4)).getFloat32(0, true) !== 1.0) {
            this.memDeserialize.set(source.slice(offset, offset + 4).reverse());
        } else {
            this.memDeserialize.set(source.slice(offset, offset + 4));
        }
        let value = new DataView(this.memDeserialize.buffer).getFloat32(0, true);
        return { value, offset: offset + 4 };
    }
}
export default Protocol;