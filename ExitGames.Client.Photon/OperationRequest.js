class OperationRequest {
    constructor(OperationCode,Parameters) {
      this.OperationCode = OperationCode;
      this.Parameters = Parameters?Parameters:{}; // Using a Map to represent the dictionary
    }
  }
export default OperationRequest;  