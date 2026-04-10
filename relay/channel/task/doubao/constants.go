package doubao

var ModelList = []string{
	"doubao-seedance-1-0-pro-250528",
	"doubao-seedance-1-0-lite-t2v",
	"doubao-seedance-1-0-lite-i2v",
	"doubao-seedance-1-5-pro-251215",
	"doubao-seedance-2-0-260128",
	"doubao-seedance-2-0-fast-260128",
}

var ChannelName = "doubao-video"

// videoInputRatioMap 视频输入价格比率（含视频输入单价 / 不含视频输入单价）。
// ModelRatio 按"不含视频输入"单价设置，检测到视频输入时乘以此比率切换到对应单价。
// 定价单位：元/百万tokens
//
//	doubao-seedance-2-0-260128:      无视频 ¥46/M，有视频 ¥28/M → ratio = 28/46
//	doubao-seedance-2-0-fast-260128: 无视频 ¥37/M，有视频 ¥22/M → ratio = 22/37
var videoInputRatioMap = map[string]float64{
	"doubao-seedance-2-0-260128":      28.0 / 46.0, // ≈ 0.6087
	"doubao-seedance-2-0-fast-260128": 22.0 / 37.0, // ≈ 0.5946
}

func GetVideoInputRatio(modelName string) (float64, bool) {
	r, ok := videoInputRatioMap[modelName]
	return r, ok
}

// postBillingModels 后扣费模型：提交时不预扣，任务完成后按实际 total_tokens 结算；
// 任务失败时无预扣费，无需退款。
var postBillingModels = map[string]struct{}{
	"doubao-seedance-2-0-260128":      {},
	"doubao-seedance-2-0-fast-260128": {},
}

func isPostBillingModel(modelName string) bool {
	_, ok := postBillingModels[modelName]
	return ok
}
