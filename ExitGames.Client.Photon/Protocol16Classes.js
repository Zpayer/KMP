import OperationResponse from "./OperationResponse.js";
import EventData from "./EventData.js";

export class Int {
    constructor(value) {
        this.Value = value;
        this.TypeCode = 105
        return Object.assign({},this);
    }
}
export class Null {
    constructor() {
        this.Value = null;
        this.TypeCode = 42
        return Object.assign({},this);
    }
}
export class String {
    constructor(value) {
        this.Value = value;
        this.TypeCode = 115;
        return Object.assign({},this);
    }
}
export class Byte {
    constructor(value) {
        this.Value = value;
        this.TypeCode = 98;
        return Object.assign({},this);
    }
}
export class Bool {
    constructor(value) {
        this.Value = value;
        this.TypeCode = 111;
        return Object.assign({},this);
    }
}
export class Float {
    constructor(value) {
        this.Value = value;
        this.TypeCode = 102;
        return Object.assign({},this);
    }
}
export class Dictionary {
    constructor(value=[],TypeOfKeys=0,TypeOfValues=0) {
        this.Value = value;
        this.TypeCode = 68;
        this.TypeOfKeys = TypeOfKeys;
        this.TypeOfValues = TypeOfValues;
        return Object.assign({},this);
    }

}
export class TArray {
    constructor(value,TypeOfValue) {
        this.Value = value;
        this.TypeCode = 121;
        this.TypeOfValue = TypeOfValue;
        return Object.assign({},this);
    }
}
export class ByteArray {
    constructor(value) {
        this.Value = value;
        this.TypeCode = 120;
        return Object.assign({},this);
    }
}