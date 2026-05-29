class EventData {
    constructor() {
        this.Code = 0;
        this.Parameters = {};
        this.SenderKey = 254;
        this.sender = -1;
        this.CustomDataKey = 245;
        this.customData = null;
    }

    getSender() {
        if (this.sender === -1) {
            let obj = this.get(this.SenderKey);
            this.sender = obj !== undefined ? obj : -1;
        }
        return this.sender;
    }

    setSender(value) {
        this.sender = value;
    }

    getCustomData() {
        if (this.customData === null) {
            this.customData = this.get(this.CustomDataKey);
        }
        return this.customData;
    }

    setCustomData(value) {
        this.customData = value;
    }

    get(key) {
        return this.Parameters.hasOwnProperty(key) ? this.Parameters[key] : null;
    }

    set(key, value) {
        this.Parameters[key] = value;
    }

    reset() {
        this.Code = 0;
        this.Parameters = {};
        this.sender = -1;
        this.customData = null;
    }

    toString() {
        return `Event ${this.Code}.`;
    }

    toStringFull() {
        return `Event ${this.Code}: ${JSON.stringify(this.Parameters)}`;
    }
}
export default EventData;