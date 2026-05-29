
import { Enum, LogError, ReverseObject, UIU as Use } from './CSUtils.js';
import OperationRequest from "./OperationRequest.js";
import OperationResponse from "./OperationResponse.js";
import EventData from "./EventData.js";

class Protocol18 {
	static ProtocolType = "GpBinaryV18";
	static GpType = Enum(`
			// Token: 0x040001F6 RID: 502
			Unknown,
			// Token: 0x040001F7 RID: 503
			Boolean = 2,
			// Token: 0x040001F8 RID: 504
			Byte,
			// Token: 0x040001F9 RID: 505
			Short,
			// Token: 0x040001FA RID: 506
			Float,
			// Token: 0x040001FB RID: 507
			Double,
			// Token: 0x040001FC RID: 508
			String,
			// Token: 0x040001FD RID: 509
			Null,
			// Token: 0x040001FE RID: 510
			CompressedInt,
			// Token: 0x040001FF RID: 511
			CompressedLong,
			// Token: 0x04000200 RID: 512
			Int1,
			// Token: 0x04000201 RID: 513
			Int1_,
			// Token: 0x04000202 RID: 514
			Int2,
			// Token: 0x04000203 RID: 515
			Int2_,
			// Token: 0x04000204 RID: 516
			L1,
			// Token: 0x04000205 RID: 517
			L1_,
			// Token: 0x04000206 RID: 518
			L2,
			// Token: 0x04000207 RID: 519
			L2_,
			// Token: 0x04000208 RID: 520
			Custom,
			// Token: 0x04000209 RID: 521
			CustomTypeSlim = 128,
			// Token: 0x0400020A RID: 522
			Dictionary = 20,
			// Token: 0x0400020B RID: 523
			Hashtable,
			// Token: 0x0400020C RID: 524
			ObjectArray = 23,
			// Token: 0x0400020D RID: 525
			OperationRequest,
			// Token: 0x0400020E RID: 526
			OperationResponse,
			// Token: 0x0400020F RID: 527
			EventData,
			// Token: 0x04000210 RID: 528
			BooleanFalse,
			// Token: 0x04000211 RID: 529
			BooleanTrue,
			// Token: 0x04000212 RID: 530
			ShortZero,
			// Token: 0x04000213 RID: 531
			IntZero,
			// Token: 0x04000214 RID: 532
			LongZero,
			// Token: 0x04000215 RID: 533
			FloatZero,
			// Token: 0x04000216 RID: 534
			DoubleZero,
			// Token: 0x04000217 RID: 535
			ByteZero,
			// Token: 0x04000218 RID: 536
			Array = 64,
			// Token: 0x04000219 RID: 537
			BooleanArray = 66,
			// Token: 0x0400021A RID: 538
			ByteArray,
			// Token: 0x0400021B RID: 539
			ShortArray,
			// Token: 0x0400021C RID: 540
			DoubleArray = 70,
			// Token: 0x0400021D RID: 541
			FloatArray = 69,
			// Token: 0x0400021E RID: 542
			StringArray = 71,
			// Token: 0x0400021F RID: 543
			HashtableArray = 85,
			// Token: 0x04000220 RID: 544
			DictionaryArray = 84,
			// Token: 0x04000221 RID: 545
			CustomTypeArray = 83,
			// Token: 0x04000222 RID: 546
			CompressedIntArray = 73,
			// Token: 0x04000223 RID: 547
			CompressedLongArray
        `);
	isLittleEndian = false;
	ReadBoolean(stream) { return { TypeCode: Protocol18.GpType.Boolean, Value: stream.ReadByte() > 0 } }
	ReadByte(stream) { return { TypeCode: Protocol18.GpType.Byte, Value: stream.ReadByte() } }
	ReadInt16(stream) { return { TypeCode: Protocol18.GpType.Short, Value: Use("get", "i32", stream.Read(4)) } }
	ReadSingle(stream) { return { TypeCode: Protocol18.GpType.Float, Value: Use("get", "f32", stream.Read(4)) } }
	ReadDouble(stream) { return { TypeCode: Protocol18.GpType.Double, Value: Use("get", "f64", stream.Read(8)) } }
	ReadInt1(stream, signNegative) { return { TypeCode: Protocol18.GpType.Int1, Value: stream.ReadByte() * ((-1) ** (!!signNegative)) } }
	ReadInt2(stream, signNegative) { return { TypeCode: Protocol18.GpType.Int2, Value: Use("get", "ui16", stream.Read(2)) * ((-1) ** (!!signNegative)) } }
	DecodeZigZag32(n) { return n >> 1 ^ -(n & 1); }
	DecodeZigZag64(n) { return n >> 1n ^ -(n & 1n); }
	ReadCompressedUInt32(stream) {
		let num = 0;
		let num2 = 0;
		while (num2 != 35) {
			let b = stream.ReadByte();
			num |= (b & 127) << num2;
			if ((b & 128) == 0) return num;
			num2 += 7;
		}
		LogError("Invalid compressed uint encoding.");
	}
	ReadCompressedUInt64(stream) {
		let num = 0n;
		let num2 = 0;

		while (num2 !== 70) {
			let b = BigInt(stream.ReadByte());
			num |= (b & 127n) << BigInt(num2);
			if ((b & 128n) === 0n) return num;
			num2 += 7;
		}
		LogError("Invalid compressed ulong encoding.");
	}
	ReadCompressedInt32(stream) {
		let value = this.ReadCompressedUInt32(stream);
		return { TypeCode: 9, Value: this.DecodeZigZag32(value) };
	}
	ReadCompressedInt64(stream) {
		let value = this.ReadCompressedUInt64(stream);
		return { TypeCode: 10, Value: this.DecodeZigZag64(value) };
	}
	ReadString(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value;
		if (Size == 0) Value = "";
		else Value = new TextDecoder().decode(new Uint8Array(stream.Read(Size)));
		return { TypeCode: 7, Value };
	}
	ReadHashtable(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) {
			let KeyType = stream.ReadByte();
			let Key = this.Read(stream, KeyType);
			let ValueType = stream.ReadByte();
			let Value_ = this.Read(stream, ValueType);
			if (Key.Value != null) Value.push({ Key, Value: Value_ });
		}
		return { TypeCode: 21, Value };
	}
	ReadDictionary(stream) {
		let TKey = stream.ReadByte(),
			TValue = stream.ReadByte(),
			Size = this.ReadCompressedUInt32(stream),
			Value = [];
		for (let i = 0; i < Size; i++) {
			let KeyType = [0, 8].includes(TKey) ? stream.ReadByte() : TKey;
			let Key = this.Read(stream, KeyType);
			let ValueType = [0, 8].includes(TValue) ? stream.ReadByte() : TValue;
			let Value_ = this.Read(stream, ValueType);
			if (Key.Value != null) Value.push({ Key, Value: Value_ });
		}
		return { TypeCode: 20, Value, TypeOfKeys: TKey, TypeOfValues: TValue };
	}
	ReadObjectArray(stream) {
		let Size = this.ReadCompressedUInt32(stream),
			Value = [];
		for (var i = 0; i < Size; i++) Value.push(this.Read(stream))
		return { TypeCode: 23, Value };
	}
	ReadArrayInArray(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let obj = this.Read(stream, this.ReadByte(stream));
		let array = Array.isArray(obj) ? obj : null;
		if (array !== null) {
			let Value = new Array(Size);
			Value[0] = array;
			for (let i = 1; i < Size; i++) {
				array = this.Read(stream);
				Value[i] = array;
			}
			return { TypeCode: 64, Value };
		}
		return { TypeCode: 64, Value: null };
	}
	ReadBooleanArray(stream) {
		let num = this.ReadCompressedUInt32(stream);
		let Value = new Array(num).fill(false);
		let i = Math.floor(num / 8);
		let num2 = 0;

		while (i > 0) {
			let b = stream.ReadByte();
			Value[num2++] = (b & 1) === 1;
			Value[num2++] = (b & 2) === 2;
			Value[num2++] = (b & 4) === 4;
			Value[num2++] = (b & 8) === 8;
			Value[num2++] = (b & 16) === 16;
			Value[num2++] = (b & 32) === 32;
			Value[num2++] = (b & 64) === 64;
			Value[num2++] = (b & 128) === 128;
			i--;
		}

		if (num2 < num) {
			let b2 = stream.ReadByte();
			let num3 = 0;

			while (num2 < num) {
				Value[num2++] = (b2 & Protocol18.boolMasks[num3]) === Protocol18.boolMasks[num3];
				num3++;
			}
		}

		return { TypeCode: 66, Value };
	}
	ReadByteArray = (stream) => ({ TypeCode: 67, Value: stream.Read(this.ReadCompressedUInt32(stream)) });
	ReadInt16Array(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadInt16(stream).Value)
		return { TypeCode: 68, Value };
	}
	ReadSingleArray(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let byteArray = [];
		let Value = [];
		//byteArray = stream.Read(Size * 4);
		for (let i = 0; i < Size; i++) {
			/*
			let offset = i * 4;
			if (this.isLittleEndian) {
				// Swap byte order (big-endian to little-endian)
				[byteArray[offset], byteArray[offset + 3]] = [byteArray[offset + 3], byteArray[offset]];
				[byteArray[offset + 1], byteArray[offset + 2]] = [byteArray[offset + 2], byteArray[offset + 1]];
			}
			*/
			Value.push(this.ReadSingle(stream).Value)
		}

		return { TypeCode: 69, Value };;
	}
	ReadDoubleArray(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadDouble(stream).Value)
		return { TypeCode: 70, Value };
	}
	ReadStringArray(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadString(stream).Value)
		return { TypeCode: 71, Value };
	}
	ReadCompressedInt32Array(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadCompressedInt32(stream).Value)
		return { TypeCode: 72, Value };
	}
	ReadCompressedInt32Array(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadCompressedInt32(stream).Value)
		return { TypeCode: 73, Value };
	}
	ReadCompressedInt64Array(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadCompressedInt64(stream).Value)
		return { TypeCode: 74, Value };
	}
	ReadDictionaryArray(stream) {
		let Value = [];
		let TKey = stream.ReadByte(),
			TValue = stream.ReadByte(),
			Size_ = this.ReadCompressedUInt32(stream);
		for (let i = 0; i < Size_; i++) {
			let Size = this.ReadCompressedUInt32(stream),
				Value__ = [];
			for (let i = 0; i < Size; i++) {
				let KeyType = [0, 8].includes(TKey) ? stream.ReadByte() : TKey;
				let Key = this.Read(stream, KeyType);
				let ValueType = [0, 8].includes(TValue) ? stream.ReadByte() : TValue;
				let Value_ = this.Read(stream, ValueType);
				if (Key.Value != null) Value__.push({ Key, Value: Value_ });
			}
			Value.push(Value__)
		}
		return { TypeCode: 84, Value };
	}
	ReadHashtableArray(stream) {
		let Size = this.ReadCompressedUInt32(stream);
		let Value = [];
		for (let i = 0; i < Size; i++) Value.push(this.ReadHashtable(stream).Value)
		return { TypeCode: 85, Value };
	}
	ReadParameterTable(stream, target = null) {
		let Size = stream.ReadByte(),
			Dictionary = (target != null) ? target : {};
		for (let i = 0; i < Size; i++) {
			let Key = stream.ReadByte(),
				Value = this.Read(stream, stream.ReadByte());
			Dictionary[Key] = Value;
		}
		return Dictionary;
	}
	Read(stream, TypeCode) {
		let result;
		if (TypeCode >= 128 && TypeCode <= 228) result = this.ReadCustomType(stream, TypeCode);
		else switch (TypeCode) {
			case 2:
				return this.ReadBoolean(stream);
			case 3:
				return this.ReadByte(stream);
			case 4:
				return this.ReadInt16(stream);
			case 5:
				return this.ReadSingle(stream);
			case 6:
				return this.ReadDouble(stream);
			case 7:
				return this.ReadString(stream);
			case 9:
				return this.ReadCompressedInt32(stream);
			case 10:
				return this.ReadCompressedInt64(stream);
			case 11:
				return this.ReadInt1(stream, false);
			case 12:
				return { TypeCode: 12, Value: this.ReadInt1(stream, true).Value };
			case 13:
				return this.ReadInt2(stream, false);
			case 14:
				return { TypeCode: 14, Value: this.ReadInt2(stream, true).Value };
			case 15:
				return { TypeCode: 15, Value: this.ReadInt1(stream, false).Value };
			case 16:
				return { TypeCode: 16, Value: this.ReadInt1(stream, true).Value };
			case 17:
				return { TypeCode: 17, Value: this.ReadInt2(stream, false).Value };
			case 18:
				return { TypeCode: 18, Value: this.ReadInt2(stream, true).Value };
			case 19:
				return; // this.ReadCustomType(stream, 0); TODO
			case 20:
				return this.ReadDictionary(stream);
			case 21:
				return this.ReadHashtable(stream);
			case 23:
				return this.ReadObjectArray(stream);
			case 24:
				return this.DeserializeOperationRequest(stream);
			case 25:
				return this.DeserializeOperationResponse(stream);
			case 26:
				return this.DeserializeEventData(stream, null);
			case 27:
				return { TypeCode, Value: false };
			case 28:
				return { TypeCode, Value: true };
			case 29: case 30: case 31: case 33: case 32: case 33: case 34:
				return { TypeCode, Value: 0 };
			case 64:
				return this.ReadArrayInArray(stream);
			case 66:
				return this.ReadBooleanArray(stream);
			case 67:
				return this.ReadByteArray(stream);
			case 68:
				return this.ReadInt16Array(stream);
			case 69:
				return this.ReadSingleArray(stream);
			case 70:
				return this.ReadDoubleArray(stream);
			case 71:
				return this.ReadStringArray(stream);
			case 73:
				return this.ReadCompressedInt32Array(stream);
			case 74:
				return this.ReadCompressedInt64Array(stream);
			case 83:
				return;//this.ReadCustomTypeArray(stream); TODO
			case 84:
				return this.ReadDictionaryArray(stream);
			case 85:
				return this.ReadHashtableArray(stream);
		}
		result = null;
		return result;
	}
	DeserializeOperationRequest(stream) {
		return new OperationRequest(stream.ReadByte(), this.ReadParameterTable(stream, null));
	}
	DeserializeOperationResponse(stream) {
		return new OperationResponse(stream.ReadByte(), this.ReadInt16(stream).Value, this.Read(stream, stream.ReadByte()), this.ReadParameterTable(stream, null));
	}
	DeserializeEventData(stream) {
		let eventData = new EventData();
		eventData.Code = stream.ReadByte();
		eventData.Parameters = this.ReadParameterTable(stream, eventData.Parameters);
		return eventData;
	}
}


export default Protocol18