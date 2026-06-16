package service

import (
	"fmt"
	"html"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/setting/operation_setting"
)

// modelHealth 记录单个 (渠道, 模型) 的健康状态机
type modelHealth struct {
	ChannelId   int
	ChannelName string
	Model       string
	Healthy     bool      // 当前已确认的健康状态
	FailCount   int       // 连续失败次数
	LastErr     string    // 最近一次失败原因
	LastMs      int64     // 最近一次响应耗时（毫秒）
	LastAlertAt time.Time // 上次发送异常/提醒邮件的时间
	LastTestAt  time.Time // 上次测试时间
}

var (
	modelHealthMu    sync.Mutex
	modelHealthState = map[string]*modelHealth{} // key: "channelId|model"

	// 本测试周期内累积的事件，FlushModelMonitorAlerts 时聚合成一封邮件
	pendingDown []modelHealth // 新故障 + 持续故障的重复提醒
	pendingUp   []modelHealth // 新恢复
)

func modelHealthKey(channelId int, modelName string) string {
	return fmt.Sprintf("%d|%s", channelId, modelName)
}

// RecordModelTestResult 记录一次按模型测试的结果并驱动状态机。
// ok=true 表示该模型本次测试正常；ok=false 时 reason 为失败/降级原因。
func RecordModelTestResult(channelId int, channelName, modelName string, ok bool, reason string, ms int64) {
	cfg := operation_setting.GetMonitorSetting()
	threshold := cfg.AlertFailureThreshold
	if threshold < 1 {
		threshold = 1
	}
	cooldown := time.Duration(cfg.AlertCooldownMinutes) * time.Minute

	now := time.Now()
	key := modelHealthKey(channelId, modelName)

	modelHealthMu.Lock()
	defer modelHealthMu.Unlock()

	st, exists := modelHealthState[key]
	if !exists {
		// 新模型默认视为健康，避免首次发现失败就立刻误报（需连续失败达到阈值）
		st = &modelHealth{ChannelId: channelId, Model: modelName, Healthy: true}
		modelHealthState[key] = st
	}
	st.ChannelName = channelName
	st.LastTestAt = now
	st.LastMs = ms

	if ok {
		st.LastErr = ""
		wasUnhealthy := !st.Healthy
		st.Healthy = true
		st.FailCount = 0
		if wasUnhealthy {
			// 异常 -> 恢复
			pendingUp = append(pendingUp, *st)
		}
		return
	}

	// 失败分支
	st.LastErr = reason
	st.FailCount++

	if st.Healthy {
		if st.FailCount >= threshold {
			// 正常 -> 异常（新故障）
			st.Healthy = false
			st.LastAlertAt = now
			pendingDown = append(pendingDown, *st)
		}
		return
	}

	// 已处于异常态：达到冷却时间则重复提醒
	if cooldown > 0 && now.Sub(st.LastAlertAt) >= cooldown {
		st.LastAlertAt = now
		pendingDown = append(pendingDown, *st)
	}
}

// FlushModelMonitorAlerts 在一个测试周期结束后调用，将本周期累积的
// 故障/恢复事件聚合成一封邮件发送，避免逐模型轰炸收件箱。
func FlushModelMonitorAlerts() {
	modelHealthMu.Lock()
	down := pendingDown
	up := pendingUp
	pendingDown = nil
	pendingUp = nil
	modelHealthMu.Unlock()

	if len(down) == 0 && len(up) == 0 {
		return
	}

	// 故障在前，按渠道、模型排序，便于阅读
	sort.Slice(down, func(i, j int) bool {
		if down[i].ChannelId != down[j].ChannelId {
			return down[i].ChannelId < down[j].ChannelId
		}
		return down[i].Model < down[j].Model
	})
	sort.Slice(up, func(i, j int) bool {
		if up[i].ChannelId != up[j].ChannelId {
			return up[i].ChannelId < up[j].ChannelId
		}
		return up[i].Model < up[j].Model
	})

	subject := buildMonitorSubject(len(down), len(up))
	body := buildMonitorBody(down, up)

	recipient := strings.TrimSpace(operation_setting.GetMonitorSetting().AlertEmail)
	if recipient == "" {
		// 回退到 root 用户邮箱
		recipient = strings.TrimSpace(model.GetRootUser().ToBaseUser().Email)
	}
	if recipient == "" {
		common.SysLog("[model-monitor] 有告警但未配置 AlertEmail 且 root 用户无邮箱，跳过发送")
		return
	}

	if err := common.SendEmail(subject, recipient, body); err != nil {
		common.SysError(fmt.Sprintf("[model-monitor] 发送告警邮件失败: %s", err.Error()))
		return
	}
	common.SysLog(fmt.Sprintf("[model-monitor] 已发送告警邮件: 故障 %d, 恢复 %d -> %s", len(down), len(up), recipient))
}

func buildMonitorSubject(down, up int) string {
	switch {
	case down > 0 && up > 0:
		return fmt.Sprintf("【%s 监控告警】%d 个模型异常 / %d 个恢复", common.SystemName, down, up)
	case down > 0:
		return fmt.Sprintf("【%s 监控告警】%d 个模型异常", common.SystemName, down)
	default:
		return fmt.Sprintf("【%s 监控恢复】%d 个模型恢复正常", common.SystemName, up)
	}
}

func buildMonitorBody(down, up []modelHealth) string {
	var b strings.Builder
	b.WriteString(`<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;font-size:14px;color:#1f2329;">`)
	b.WriteString(fmt.Sprintf("<p>检测时间：%s</p>", time.Now().Format("2006-01-02 15:04:05")))

	if len(down) > 0 {
		b.WriteString(`<h3 style="color:#d83931;margin:16px 0 8px;">❌ 异常模型</h3>`)
		writeMonitorTable(&b, down, true)
	}
	if len(up) > 0 {
		b.WriteString(`<h3 style="color:#1f9d55;margin:16px 0 8px;">✅ 恢复正常</h3>`)
		writeMonitorTable(&b, up, false)
	}

	b.WriteString(`<p style="color:#8a9099;margin-top:16px;font-size:12px;">本邮件由 ` + html.EscapeString(common.SystemName) + ` 渠道/模型监控自动发送。</p>`)
	b.WriteString(`</div>`)
	return b.String()
}

func writeMonitorTable(b *strings.Builder, rows []modelHealth, withError bool) {
	b.WriteString(`<table style="border-collapse:collapse;width:100%;font-size:13px;">`)
	b.WriteString(`<thead><tr style="background:#f5f6f7;">`)
	for _, h := range []string{"渠道", "模型", "耗时", func() string {
		if withError {
			return "原因"
		}
		return "状态"
	}()} {
		b.WriteString(`<th style="border:1px solid #e5e6eb;padding:6px 10px;text-align:left;">` + h + `</th>`)
	}
	b.WriteString(`</tr></thead><tbody>`)
	for _, r := range rows {
		channel := html.EscapeString(fmt.Sprintf("#%d %s", r.ChannelId, r.ChannelName))
		modelName := html.EscapeString(r.Model)
		dur := fmt.Sprintf("%.2fs", float64(r.LastMs)/1000.0)
		last := html.EscapeString(r.LastErr)
		if !withError {
			last = "已恢复"
		}
		if last == "" {
			last = "-"
		}
		b.WriteString(`<tr>`)
		for _, cell := range []string{channel, modelName, dur, last} {
			b.WriteString(`<td style="border:1px solid #e5e6eb;padding:6px 10px;">` + cell + `</td>`)
		}
		b.WriteString(`</tr>`)
	}
	b.WriteString(`</tbody></table>`)
}
