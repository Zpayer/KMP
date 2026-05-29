
import { Enum, LogError, ReverseObject, UIU as Use } from './CSUtils.js';
import OperationRequest from "./OperationRequest.js";
import OperationResponse from "./OperationResponse.js";
import EventData from "./EventData.js";




class Protocol16 {
	static ProtocolType = "GpBinaryV16";
	static GpType = Enum(`
			// Token: 0x040001E0 RID: 480
			Unknown,
			// Token: 0x040001E1 RID: 481
			Array = 121,
			// Token: 0x040001E2 RID: 482
			Boolean = 111,
			// Token: 0x040001E3 RID: 483
			Byte = 98,
			// Token: 0x040001E4 RID: 484
			ByteArray = 120,
			// Token: 0x040001E5 RID: 485
			ObjectArray = 122,
			// Token: 0x040001E6 RID: 486
			Short = 107,
			// Token: 0x040001E7 RID: 487
			Float = 102,
			// Token: 0x040001E8 RID: 488
			Dictionary = 68,
			// Token: 0x040001E9 RID: 489
			Double = 100,
			// Token: 0x040001EA RID: 490
			Hashtable = 104,
			// Token: 0x040001EB RID: 491
			Integer,
			// Token: 0x040001EC RID: 492
			IntegerArray = 110,
			// Token: 0x040001ED RID: 493
			Long = 108,
			// Token: 0x040001EE RID: 494
			String = 115,
			// Token: 0x040001EF RID: 495
			StringArray = 97,
			// Token: 0x040001F0 RID: 496
			Custom = 99,
			// Token: 0x040001F1 RID: 497
			Null = 42,
			// Token: 0x040001F2 RID: 498
			EventData = 101,
			// Token: 0x040001F3 RID: 499
			OperationRequest = 113,
			// Token: 0x040001F4 RID: 500
			OperationResponse = 112
    `)
	DeserializeFloat(din) { return { TypeCode: 102, Value: Use("get", "f32", din.Read(4)) } }
	DeserializeInteger(din) { return { TypeCode: 105, Value: Use("get", "i32", din.Read(4)) } }
	DeserializeShort(din) { return { TypeCode: 107, Value: Use("get", "i16", din.Read(2)) } }
	DeserializeBoolean(din) { return { TypeCode: 111, Value: din.ReadByte() > 0 } }
	DeserializeByte(din) { return { TypeCode: 98, Value: din.ReadByte() } }
	DeserializeLong(din) { return { TypeCode: 108, Value: Use("get", "i64", din.Read(8)) } }
	DeserializeDouble(din) { return { TypeCode: 100, Value: Use("get", "f64", din.Read(8)) } }
	DeserializeString(din) { return { TypeCode: 115, Value: new TextDecoder().decode(new Uint8Array(din.Read(this.DeserializeShort(din).Value))) } }
	DeserializeByteArray(din, size = -1) { return { TypeCode: 120, Value: din.Read(size == -1 ? this.DeserializeInteger(din).Value : size) } }
	DeserializeIntArray(din, size = -1) {
		let Value = [];
		if (size == -1) size = this.DeserializeInteger(din).Value;
		for (let i = 0; i < size; i++) Value.push(this.DeserializeInteger(din).Value);
		return { TypeCode: 110, Value };
	}
	DeserializeStringArray(din) {
		let { Value: size } = this.DeserializeShort(din),
			Value = [];
		for (let i = 0; i < size; i++) Value.push(this.DeserializeString(din).Value);
		return { TypeCode: 97, Value };
	}
	DeserializeObjectArray(din) {
		let size = this.DeserializeShort(din).Value,
			Value = [];
		for (let i = 0; i < size; i++) {
			let TypeCode = din.ReadByte();
			let Value_ = this.Deserialize(din, TypeCode);
			Value.push(Value_);
		}
		return { TypeCode: 122, Value };
	}
	DeserializeHashTable(din) {
		let { Value: size } = this.DeserializeShort(din);
		let Value = [];
		for (let i = 0; i < size; i++) {
			let KeyType = din.ReadByte();
			let Key = this.Deserialize(din, KeyType);
			let ValueType = din.ReadByte();
			let Value_ = this.Deserialize(din, ValueType);
			if (Key.Value != null) Value.push({ Key, Value: Value_ });
		}
		return { TypeCode: 104, Value };
	}
	DeserializeDictionary(din) {
		let TKey = din.ReadByte(),
			TValue = din.ReadByte(),
			{ Value: size } = this.DeserializeShort(din),
			Value = [];
		for (let i = 0; i < size; i++) {
			let KeyType = [0, 42].includes(TKey) ? din.ReadByte() : TKey;
			let Key = this.Deserialize(din, KeyType);
			let ValueType = [0, 42].includes(TValue) ? din.ReadByte() : TValue;
			let Value_ = this.Deserialize(din, ValueType);
			if (Key.Value != null) Value.push({ Key, Value: Value_ });
		}
		return { TypeCode: 68, Value, TypeOfKeys: TKey, TypeOfValues: TValue };
	}
	DeserializeDictionaryArray(din, size) {
		let Value = [];
		for (let i = 0; i < size; i++)  Value.push(this.DeserializeDictionary(din));
		return { Value };
	}
	DeserializeDictionaryType(reader) {
		TKey = this.GetTypeOfCode(reader.ReadByte());
		TValue = this.GetTypeOfCode(reader.ReadByte());
		return { TKey, TValue };
	}
	DeserializeArray(din) {
		let Size = this.DeserializeShort(din).Value;
		let TValue = din.ReadByte();
		let Value = [];
		if (TValue == Protocol16.GpType.Array) for (let i = 0; i < Size; i++) Value.push(this.DeserializeArray(din).Value);
		else if (TValue == Protocol16.GpType.ByteArray) for (let i = 0; i < Size; i++) Value.push(this.DeserializeByteArray(din).Value);
		else if (TValue == Protocol16.GpType.Byte) Value = this.DeserializeByteArray(din, Size).Value;
		else if (TValue == Protocol16.GpType.Integer) Value = this.DeserializeIntArray(din, Size).Value;
		else if (TValue == Protocol16.GpType.Dictionary) Value = this.DeserializeDictionaryArray(din, Size).Value;
		//else if (TValue == Protocol16.GpType.Custom)  Value.push(this.DeserializeCustom(din).Value); TODO
		else for (let i = 0; i < Size; i++) Value.push(this.Deserialize(din, TValue).Value);
		return { TypeCode: 121, Value, TypeOfValue: TValue };
	}
	/*
	DeserializeCustom( din, customTypeCode) {
				let num = this.DeserializeShort(din).Value;
				let customType;
				let flag = Protocol.CodeDict.get(customTypeCode,customType);
				let result;
				if (flag)
				{
					if (customType.DeserializeStreamFunction == null)
					{
						let array = din.Read(num);
						result = customType.DeserializeFunction(array);
					}
					else
					{
						let position = din.pos;
						let obj = customType.DeserializeStreamFunction(din, num);
						let num2 = din.pos - position;
						if ( num2 != num ) din.pos = position + num;
						result = obj;
					}
				}
				else
				{
					let array2 = din.Read(num);
					result = array2;
				}
				return result;
	}
		 */
	Deserialize(din, TypeCode) {
		if (TypeCode == 0 || TypeCode == 42) return { Value: null, TypeCode };
		else if (TypeCode == 68) return this.DeserializeDictionary(din);
		else switch (TypeCode) {
			case 97:
				return this.DeserializeStringArray(din);
			case 98:
				return this.DeserializeByte(din);
			case 99:
				{
					let customTypeCode = din.ReadByte();
					LogError("TODO", "DeserializeCustom(): " + customTypeCode)
					//return this.DeserializeCustom(din, customTypeCode);
				}
			case 100:
				return this.DeserializeDouble(din);
			case 101:
				return this.DeserializeEventData(din, null);
			case 102:
				return this.DeserializeFloat(din);
			case 104:
				return this.DeserializeHashTable(din);
			case 105:
				return this.DeserializeInteger(din);
			case 107:
				return this.DeserializeShort(din);
			case 108:
				return this.DeserializeLong(din);
			case 110:
				return this.DeserializeIntArray(din, -1);
			case 111:
				return this.DeserializeBoolean(din);
			case 112:
				return this.DeserializeOperationResponse(din);
			case 113:
				return this.DeserializeOperationRequest(din);
			case 115:
				return this.DeserializeString(din);
			case 120:
				return this.DeserializeByteArray(din, -1);
			case 121:
				return this.DeserializeArray(din);
			case 122:
				return this.DeserializeObjectArray(din);
			default:
				LogError("Exception", `Deserialize():TypeCode ${TypeCode}` + " Position: " + din.pos + " Length: " + din.len);
		}
	}
	DeserializeParameterTable(din, target = null) {
		let Size = this.DeserializeShort(din).Value,
			Dictionary = (target != null) ? target : {};
		for (let i = 0; i < Size; i++) {
			let Key = din.ReadByte(),
				Value = this.Deserialize(din, din.ReadByte());
			Dictionary[Key] = Value;
		}
		return Dictionary;
	}
	DeserializeOperationRequest(din) {
		return new OperationRequest(din.ReadByte(), this.DeserializeParameterTable(din, null));
	}
	DeserializeOperationResponse(din) {
		return new OperationResponse(din.ReadByte(), this.DeserializeShort(din).Value, this.Deserialize(din, din.ReadByte()), this.DeserializeParameterTable(din, null));
	}
	DeserializeEventData(din) {
		let eventData = new EventData();
		eventData.Code = din.ReadByte();
		eventData.Parameters = this.DeserializeParameterTable(din, eventData.Parameters);
		return eventData;
	}

	//------------------------------------------Serializer-----------------------------------------
	SerializeFloat(dout, serObject, setType) {
		if (setType) dout.WriteByte(102);
		let Array = Use("set", "f32", serObject.Value);
		dout.Write(Array)
	}
	SerializeInteger(dout, serObject, setType) {
		if (setType) dout.WriteByte(105);
		let Array = Use("set", "i32", serObject.Value);
		dout.Write(Array)
	}
	SerializeShort(dout, serObject, setType) {
		if (setType) dout.WriteByte(107);
		let Array = Use("set", "i16", serObject.Value);
		dout.Write(Array)
	}
	SerializeBoolean(dout, serObject, setType) {
		if (setType) dout.WriteByte(111);
		dout.WriteByte(!!serObject.Value)
	}
	SerializeByte(dout, serObject, setType) {
		if (setType) dout.WriteByte(98);
		dout.WriteByte(serObject.Value)
	}
	SerializeLong(dout, serObject, setType) {
		if (setType) dout.WriteByte(108);
		let Array = Use("set", "i64", serObject.Value);
		dout.Write(Array)
	}
	SerializeDouble(dout, serObject, setType) {
		if (setType) dout.WriteByte(100);
		let Array = Use("set", "f64", serObject.Value);
		dout.Write(Array)
	}
	SerializeString(dout, { Value }, setType) {
		if (setType) dout.WriteByte(115);
		this.SerializeShort(dout, { Value: Value.length }, false);
		dout.Write(new TextEncoder().encode(Value))
	}
	SerializeByteArray(dout, { Value }, setType) {
		if (setType) dout.WriteByte(120);
		this.SerializeInteger(dout, { Value: Value.length }, false);
		dout.Write([...Value])
	}
	SerializeIntArray(dout, { Value }, setType) {
		if (setType) dout.WriteByte(110);
		this.SerializeInteger(dout, { Value: Value.length }, false);
		Value.forEach(value => dout.SerializeInteger(dout, { Value: value }, false));
	}
	SerializeStringArray(dout, { Value }, setType) {
		if (setType) dout.WriteByte(97);
		this.SerializeShort(dout, { Value: Value.length }, false);
		Value.forEach(value => dout.SerializeString(dout, { Value: value }, false));
	}
	SerializeObjectArray(dout, { Value }, setType) {
		if (setType) dout.WriteByte(122);
		this.SerializeShort(dout, { Value: Value.length }, false);
		Value.forEach(_ => this.Serialize(dout, _, true))
	}
	SerializeHashTable(dout, { Value }, setType) {
		if (setType) dout.WriteByte(104);
		this.SerializeShort(dout, { Value: Value.length }, false);
		Value.forEach(({ Key: k, Value: v }) => (this.Serialize(dout, k, true), this.Serialize(dout, v, true)))
	}
	SerializeDictionary(dout, { Value: v, TypeOfKeys: _, TypeOfValues: _$ }, setType) {
		let _1 = ($) => [0, 42].includes($);
		if (setType) dout.WriteByte(68);
		dout.Write([_, _$]);
		this.SerializeShort(dout, { Value: v.length }, false)
		v.forEach(({ Key: k, Value: v$ }) => (this.Serialize(dout, k, _1(_) ? !0 : !1), this.Serialize(dout, v$, _1(_$) ? !0 : !1)))
	}
	SerializeDictionaryArray = (dout, { Value: v }, setType) => v.forEach(_ => this.SerializeDictionary(dout, _, setType));
	SerializeArray(dout, { Value: v, TypeOfValue: _ }, setType) {
		let _2 = [121, 120, 98, 105, 68];
		if (setType) dout.WriteByte(_2[0]);
		this.SerializeShort(dout, { Value: v.length }, !1);
		dout.WriteByte(_);
		v.forEach(Value => (_ == _2[0] ? this.SerializeArray(dout, { Value }, !1) :
			_ == _2[1] ? this.SerializeByteArray(dout, { Value }, !1) :
				_ == _2[2] ? this.SerializeByte(dout, { Value }, !1) :
					_ == _2[3] ? this.SerializeInteger(dout, { Value }, !1) :
						_ == _2[4] ? this.SerializeDictionary(dout, Value, !1) :
							_ == 102 ? this.SerializeFloat(dout, Value, !1) :
								this.Serialize(dout, { Value, TypeCode: _ }, !1)
		))
	}
	SerializeOperationRequest(stream, OperationRequest, setType = false) {
		if (setType) stream.WriteByte(113);
		stream.WriteByte(OperationRequest.OperationCode);
		this.SerializeParameterTable(stream, OperationRequest.Parameters);
	}
	SerializeOperationResponse(stream, OperationResponse, setType = false) {
		if (setType) stream.WriteByte(112);
		stream.WriteByte(OperationResponse.OperationCode);
		this.SerializeShort(stream, { Value: OperationResponse.ReturnCode }, false);
		if (!OperationResponse.DebugMessage.Value) stream.WriteByte(42);
		else this.SerializeString(stream, { Value: OperationResponse.DebugMessage }, false);
		this.SerializeParameterTable(stream, OperationResponse.Parameters);
	}
	SerializeEventData(stream, EventData, setType = false) {
		if (setType) stream.WriteByte(101);
		stream.WriteByte(EventData.Code);
		this.SerializeParameterTable(stream, EventData.Parameters);
	}
	SerializeParameterTable(stream, params) {
		let entries = Object.entries(params);
		this.SerializeShort(stream, { Value: entries.length }, false);
		Object.entries(params).forEach(([k, v]) => {
			stream.WriteByte(k)
			this.Serialize(stream, v, true);
		})
	}
	Serialize(dout, serObject, setType) {
		let TypeCode = serObject.TypeCode;
		if ((TypeCode == 0 || TypeCode == 42) && setType) dout.WriteByte(TypeCode);
		else if (TypeCode == 68) return this.SerializeDictionary(dout, serObject, setType);
		else switch (TypeCode) {
			case 97:
				return this.SerializeStringArray(dout, serObject, setType);
			case 98:
				return this.SerializeByte(dout, serObject, setType);
			case 99:
				{
					//let customTypeCode = din.ReadByte();
					LogError("TODO", "SerializeCustom(): ")
					//return this.DeserializeCustom(din, customTypeCode);
				}
			case 100:
				return this.SerializeDouble(dout, serObject, setType);
			case 101:
				return this.SerializeEventData(dout, serObject, setType);
			case 102:
				return this.SerializeFloat(dout, serObject, setType);
			case 104:
				return this.SerializeHashTable(din);
			case 105:
				return this.SerializeInteger(dout, serObject, setType);
			case 107:
				return this.SerializeShort(dout, serObject, setType);
			case 108:
				return this.SerializeLong(dout, serObject, setType);
			case 110:
				return this.SerializeIntArray(dout, serObject, setType);
			case 111:
				return this.SerializeBoolean(dout, serObject, setType);
			case 112:
				return this.SerializeOperationResponse(dout, serObject, setType);
			case 113:
				return this.SerializeOperationRequest(dout, serObject, setType);
			case 115:
				return this.SerializeString(dout, serObject, setType);
			case 120:
				return this.SerializeByteArray(dout, serObject, setType);
			case 121:
				return this.SerializeArray(dout, serObject, setType);
			case 122:
				return this.SerializeObjectArray(dout, serObject, setType);
			default:
				LogError("Exception", `Deserialize():TypeCode ${TypeCode}` + " Position: " + din.pos + " Length: " + din.len);
		}
	}

	GetTypeOfCode(typeCode) {
		let reversed = ReverseObject(Protocol16.GpType)
		if (!reversed[typeCode]) return LogError("Exception", "Unknown type of code: " + typeCode);
		return reversed[typeCode];
	}
	GetCodeOfType(type) {
		if (Protocol16.GpType[type]) return LogError("Exception", "Unknown code of type: " + type);
		return Protocol16.GpType[type];
	}
}

export default Protocol16;