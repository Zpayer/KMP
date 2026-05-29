import {Enum} from './CSUtils.js';
export default Enum(`
		// Token: 0x04000018 RID: 24
		Connect = 1024,
		// Token: 0x04000019 RID: 25
		Disconnect,
		// Token: 0x0400001A RID: 26
		Exception,
		// Token: 0x0400001B RID: 27
		ExceptionOnConnect = 1023,
		// Token: 0x0400001C RID: 28
		SecurityExceptionOnConnect = 1022,
		// Token: 0x0400001D RID: 29
		SendError = 1030,
		// Token: 0x0400001E RID: 30
		ExceptionOnReceive = 1039,
		// Token: 0x0400001F RID: 31
		TimeoutDisconnect,
		// Token: 0x04000020 RID: 32
		DisconnectByServerTimeout,
		// Token: 0x04000021 RID: 33
		DisconnectByServerUserLimit,
		// Token: 0x04000022 RID: 34
		DisconnectByServerLogic,
		// Token: 0x04000023 RID: 35
		DisconnectByServerReasonUnknown,
		// Token: 0x04000024 RID: 36
		EncryptionEstablished = 1048,
		// Token: 0x04000025 RID: 37
		EncryptionFailedToEstablish
    `)