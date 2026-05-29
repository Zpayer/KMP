class CustomType {
  constructor(type, code, serializeFunction, deserializeFunction) {
      this.Type = type;
      this.Code = code;
      this.SerializeFunction = serializeFunction || null;
      this.DeserializeFunction = deserializeFunction || null;
      this.SerializeStreamFunction = null;
      this.DeserializeStreamFunction = null;
  }

  static createWithStream(type, code, serializeFunction, deserializeFunction) {
      const instance = new CustomType(type, code, null, null);
      instance.SerializeStreamFunction = serializeFunction;
      instance.DeserializeStreamFunction = deserializeFunction;
      return instance;
  }
}
