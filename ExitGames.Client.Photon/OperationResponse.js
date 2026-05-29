class OperationResponse {
    constructor(OperationCode, ReturnCode, DebugMessage, Parameters) {
      this.OperationCode = OperationCode;
      this.ReturnCode = ReturnCode;
      this.DebugMessage = DebugMessage;
      this.Parameters = Parameters?Parameters:{};
    }
    toString() {
      return `OperationResponse ${this.OperationCode}: ReturnCode: ${this.ReturnCode}.`;
    }
    toStringFull() {
      const parametersString = Object.entries(this.Parameters).map(([key, value]) => `${key}: ${value}`).join(',\n');
      return `OperationResponse ${this.OperationCode}: ReturnCode: ${this.ReturnCode} (${this.DebugMessage}). Parameters:${parametersString}`;
    }
  }
export default OperationResponse