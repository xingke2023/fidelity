package operation_setting

import (
	"os"
	"strconv"

	"github.com/QuantumNous/new-api/setting/config"
)

type MonitorSetting struct {
	AutoTestChannelEnabled bool    `json:"auto_test_channel_enabled"`
	AutoTestChannelMinutes float64 `json:"auto_test_channel_minutes"`

	// 按模型监控（逐个模型测试 + 异常即时邮件告警）
	ModelTestEnabled      bool    `json:"model_test_enabled"`       // 是否开启按模型监控
	ModelTestMinutes      float64 `json:"model_test_minutes"`       // 测试周期（分钟）
	AlertEmail            string  `json:"alert_email"`              // 告警收件邮箱，多个用 ; 分隔；为空则发给 root 用户
	AlertFailureThreshold int     `json:"alert_failure_threshold"`  // 连续失败多少次才告警（防抖）
	AlertResponseSeconds  float64 `json:"alert_response_seconds"`   // 响应时间超过该秒数视为降级（0=不判定）
	AlertCooldownMinutes  int     `json:"alert_cooldown_minutes"`   // 同一模型持续异常的重复提醒间隔（分钟）
	ModelTestPerCycleCap  int     `json:"model_test_per_cycle_cap"` // 每周期最多测试的 (渠道,模型) 数量上限，防止压垮上游
}

// 默认配置
var monitorSetting = MonitorSetting{
	AutoTestChannelEnabled: false,
	AutoTestChannelMinutes: 10,

	ModelTestEnabled:      false,
	ModelTestMinutes:      15,
	AlertEmail:            "",
	AlertFailureThreshold: 2,
	AlertResponseSeconds:  0,
	AlertCooldownMinutes:  60,
	ModelTestPerCycleCap:  200,
}

func init() {
	// 注册到全局配置管理器
	config.GlobalConfig.Register("monitor_setting", &monitorSetting)
}

func GetMonitorSetting() *MonitorSetting {
	if os.Getenv("CHANNEL_TEST_FREQUENCY") != "" {
		frequency, err := strconv.Atoi(os.Getenv("CHANNEL_TEST_FREQUENCY"))
		if err == nil && frequency > 0 {
			monitorSetting.AutoTestChannelEnabled = true
			monitorSetting.AutoTestChannelMinutes = float64(frequency)
		}
	}
	return &monitorSetting
}
