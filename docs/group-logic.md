# 分组（Group）逻辑文档

## 1. 分组是什么

分组（group）是 new-api 的核心调度维度。每个**渠道**声明自己支持哪些分组，每个**用户/令牌**绑定到某个分组上。请求到达时，系统按"用户所在分组"去筛选可用渠道。

分组同时影响两件事：

| 维度 | 作用 |
|---|---|
| **渠道筛选** | 决定哪些渠道有资格参与本次随机选取 |
| **计费倍率** | 不同分组对应不同的 `GroupRatio`，决定扣多少额度 |

---

## 2. 三个 group 概念

| 名字 | 来源 | Context Key |
|---|---|---|
| **用户分组** | `users.group` 字段（用户表） | `ContextKeyUserGroup` |
| **令牌分组** | `tokens.group` 字段（令牌表，可空） | `ContextKeyTokenGroup` |
| **使用分组** | 本次请求实际生效的分组 | `ContextKeyUsingGroup` |

### 优先级规则（`middleware/auth.go:345-362`）

```
令牌 group 非空? → usingGroup = 令牌 group  （前提：用户有权访问该分组）
令牌 group 为空? → usingGroup = 用户 group
```

**令牌分组优先于用户分组**。令牌一旦填了 group，用户原本的分组就被屏蔽。

---

## 3. 选渠道的核心算法

`model/channel_cache.go:96` 的 `GetRandomSatisfiedChannel(group, model, retry)`：

1. **倒排索引查询**：`group2model2channels[group][model]` 拿到所有"该分组下支持该模型"的渠道列表。
2. **按 priority 分桶降序**：`retry=0` 取最高优先级桶，失败后 `retry++` 降级到下一桶。
3. **桶内加权随机**：按 `weight` 在桶内做加权随机选取。

倒排索引在 `InitChannelCache` 中构建（`channel_cache.go:41-54`）。每个渠道的 `Group` 字段是逗号分隔的列表（如 `default,vip,svip`），渠道会出现在它声明支持的每一个分组的桶里。

---

## 4. UserUsableGroups（全局可用分组）

后台「运营设置 → 用户可用分组」配置的全局 map：

```json
{
  "default": "默认分组",
  "vip": "VIP 分组",
  "svip": "SVIP 分组"
}
```

它控制：

1. **令牌可填的 group 范围**：`auth.go:349` 校验令牌 group 必须在该 map 内。
2. **`auto` 模式的展开范围**：见下面 auto 分组说明。
3. **前端定价页/用户面板的展示**：用户看到哪些分组。

---

## 5. 分组特殊可用分组（GroupSpecialUsableGroup）

**针对单个用户分组**对全局 `UserUsableGroups` 做 patch，实现"小灶"定制。

### 配置结构

```
map[userGroup]map[entry]description
```

每个 entry 的 key 前缀决定动作（`service/group.go:17-29`）：

| 前缀 | 动作 | 代码行为 |
|---|---|---|
| `+:xxx` | **添加** | 在默认列表上新增 `xxx` |
| `-:xxx` | **移除** | 从默认列表删除 `xxx` |
| `xxx`（无前缀） | **追加** | 等价于 `+:`，直接写入 map |

> 注：「添加」和「追加」在运行时**完全等价**，差异仅在前端 UI 语义。

### 计算流程（`service/group.go:10-37`）

```
1. groupsCopy = copy(UserUsableGroups)            ← 拷贝全局默认
2. 取 GroupSpecialUsableGroup[userGroup] 的规则
3. 按前缀依次执行 +/- 操作
4. 兜底：若 userGroup 不在结果里，强制塞入        ← 保证用户至少能用自己的分组
5. 返回最终 map
```

### 示例

```
全局 UserUsableGroups = {default, vip}

vip 的特殊规则配置：
  "vip" → {
    "+:internal":   "内部专用",
    "-:default":    "屏蔽默认",
    "experimental": "实验分组"
  }

vip 用户最终可用分组 = {vip, internal, experimental}
```

### 影响范围

1. **令牌 group 校验**：上例 vip 用户的令牌不能再填 `default`。
2. **`auto` 展开**：vip 走 auto 时只在 `{vip, internal, experimental}` ∩ `AutoGroups` 里试。
3. **Playground 切组**：playground 请求体里指定的 group 必须在这个列表里（`distributor.go:93`）。
4. **前端展示**：定价页、用户面板看到的可用分组列表。

---

## 6. Auto 分组

`auto` 是一个"虚拟分组"。令牌 group 设为 `auto` 时，请求会**依次尝试多个真实分组**，直到选到可用渠道。

### 配置

后台「运营设置 → 自动分组」配置一个全局 group 名单：

```json
["default", "vip", "svip"]
```

存于 `setting/auto_group.go` 的 `autoGroups` 切片，默认值为 `["default"]`。

### 展开逻辑（`service/group.go:45-54`）

```
GetUserAutoGroup(userGroup):
  全局 AutoGroups ∩ 该用户的 GetUserUsableGroups(userGroup)
```

即：**用户在 auto 模式下能跑的分组 = 全局 auto 名单 ∩ 用户当前可用分组**。

### 调度流程（`service/channel_select.go:83-154`）

```
for i in userAutoGroups:
    在第 i 个 group 内部，按"priority 分桶 + 加权随机"选渠道
    选到 → 命中，标记 ContextKeyAutoGroup = group[i]，结束
    选不到 → 切到 group[i+1]
```

状态用 ctx key 跟踪：

| Key | 含义 |
|---|---|
| `ContextKeyAutoGroupIndex` | 当前在第几个 group |
| `ContextKeyAutoGroupRetryIndex` | 进入当前 group 时的全局 retry 计数 |
| `ContextKeyAutoGroup` | 本次实际选中的 group（用于计费） |

### 失败重试 / 跨组重试

```
priorityRetry = 全局 retry - 进入当前 group 时的 retry
```

即"当前 group 内部已用掉的优先级档数"。

- **同 group 内**：每次失败 `retry++`，降级到下一档优先级。
- **跨 group（CrossGroupRetry）**：令牌字段 `cross_group_retry=true` 时，当前 group 用尽所有优先级仍失败 → 切到下一个 auto group，从最高优先级重试。

```
示例（2 group × 2 priority，RetryTimes=3）：
  retry=0  → groupA priority0
  retry=1  → groupA priority1
  retry=2  → groupA 用尽 → groupB priority0
  retry=3  → groupB priority1
```

### Auto 模式下的计费

`relay/helper/price.go:19-27` 的 `HandleGroupRatio`：检测到 `ContextKeyAutoGroup` 时，**按实际命中的子 group 计算 `GroupRatio`**，而不是按 `auto` 这个虚拟分组。所以同样填 `auto` 的两个请求，命中 vip 还是 svip 扣的额度可能不同。

---

## 7. 计费策略

分组**不仅影响渠道筛选，还直接参与价格计算**。一次请求的最终扣费公式（简化版）：

```
quota = ModelRatio × GroupRatio × (PromptTokens + CompletionTokens × CompletionRatio) × QuotaPerUnit
```

或对固定价格模型：

```
quota = ModelPrice × GroupRatio × QuotaPerUnit
```

`GroupRatio` 就是分组参与计费的关键乘数。

### 7.1 GroupRatio 的三层来源

`relay/helper/price.go:20-46` 的 `HandleGroupRatio` 按以下优先级决定 `GroupRatio`：

```
1. 若 ctx 里有 auto_group → 把 UsingGroup 改写成实际命中的子 group
2. 查 GroupGroupRatio[userGroup][usingGroup]
   ├─ 命中 → 用这个值，标记 HasSpecialRatio=true（用户专属倍率）
   └─ 未命中 → 查全局 GroupRatio[usingGroup]
3. 全部未命中 → 默认 1.0
```

### 7.2 三种 ratio 配置

| 配置 | 数据结构 | 含义 |
|---|---|---|
| **GroupRatio** | `map[group]float64` | 全局分组倍率，所有用户共享 |
| **GroupGroupRatio** | `map[userGroup]map[usingGroup]float64` | **用户分组 × 使用分组**的二维特殊倍率，覆盖全局值 |
| **ModelRatio / ModelPrice** | `map[model]float64` | 模型自身倍率/固定价，与分组正交 |

示例配置：

```json
GroupRatio = {
  "default": 1.0,
  "vip":     0.8,
  "svip":    0.5
}

GroupGroupRatio = {
  "vip": {                      // 当 userGroup=vip 时
    "svip": 0.6                 // 访问 svip 分组按 0.6 倍计费（覆盖全局的 0.5）
  }
}
```

### 7.3 Auto 分组的计费

`HandleGroupRatio` 检测到 `ctx["auto_group"]`（在选渠道阶段由 `channel_select.go` 设置）后，会把 `relayInfo.UsingGroup` 改写为**实际命中的子 group**。

这意味着：

- 令牌填 `auto`，本次命中 vip → 按 vip 的 `GroupRatio` 扣
- 同样填 `auto`，下一次命中 svip → 按 svip 的 `GroupRatio` 扣
- **不存在"auto 倍率"**，永远按真实落地的分组算

### 7.4 计费流程（`service/text_quota.go:142-149`）

```
dGroupRatio = decimal(GroupRatio)
dModelRatio = decimal(ModelRatio)
ratio       = dModelRatio × dGroupRatio
quota       = (promptTokens + completionTokens × completionRatio) × ratio × QuotaPerUnit
```

所有额度计算用 `decimal` 包做精确小数运算，避免浮点误差。

### 7.5 日志与审计

`service/log_info_generate.go:258-260` 在日志的 `other` 字段里同时记录：

| 字段 | 含义 |
|---|---|
| `group_ratio` | 最终用于计费的 `GroupRatio` |
| `user_group_ratio` | 若命中 `GroupGroupRatio` 特殊倍率，记录原始用户专属倍率 |

通过日志可以审计："为什么这个用户这一单扣得比平时多/少"。

### 7.6 一句话

> 最终倍率 = **GroupGroupRatio\[userGroup\]\[usingGroup\] 优先**，缺失则退化到 **GroupRatio\[usingGroup\]**；
> auto 模式按**真实命中的子 group**计费，而不是按 "auto"；
> 倍率再乘以模型倍率与 token 数得到最终扣费。

---

## 8. 完整请求示例

**场景**：vip 用户，令牌 group=`auto`，开了 `cross_group_retry`，请求 `claude-sonnet-4-6`。

```
1. auth 中间件：
   usingGroup = "auto"（令牌 group 优先）

2. distributor 中间件：
   GetUserAutoGroup("vip") = AutoGroups ∩ GetUserUsableGroups("vip")
                          = ["default","vip","svip"] ∩ {vip, internal}（受 GroupSpecialUsableGroup 影响）
                          = ["vip"]

3. CacheGetRandomSatisfiedChannel：
   只在 vip 池里按 priority + weight 随机选 claude-sonnet-4-6 渠道
   选不到 → 因为 auto 展开后只剩 vip 一个 group，cross_group_retry 也无处可去 → 失败

4. 若 vip 选中渠道但请求失败：
   retry++ → 降级到下一档优先级
   priorities 用尽 + cross_group_retry=true + 还有其他 auto group → 切下一个 group
   priorities 用尽 + 无其他 group → 返回错误

5. 成功后：
   按命中的实际 group（vip）计算 GroupRatio，扣额度
   RecordChannelAffinity 记录亲和缓存（如启用）
```

---

## 9. 关键源码位置速查

| 关注点 | 文件 |
|---|---|
| 令牌/用户/使用分组的解析 | `middleware/auth.go:345-362` |
| 选渠道入口 | `middleware/distributor.go:130-156` |
| 加权随机算法 | `model/channel_cache.go:96-191` |
| 倒排索引构建 | `model/channel_cache.go:24-65` |
| auto 分组调度 | `service/channel_select.go:83-154` |
| UserUsableGroups + 特殊可用分组 | `service/group.go:10-37` |
| auto 分组配置 | `setting/auto_group.go` |
| 特殊可用分组数据结构 | `setting/ratio_setting/group_ratio.go:28-38` |
| auto 模式计费切换 | `relay/helper/price.go:19-46` |
| 计费主流程 | `service/text_quota.go:130-260` |
| GroupRatio / GroupGroupRatio 数据结构 | `setting/ratio_setting/group_ratio.go` |

---

## 10. 一句话总结

> **令牌分组 > 用户分组**，决定 `usingGroup` →
> `usingGroup` 在**渠道倒排索引**里筛出候选 →
> 桶内**优先级 + 加权随机** →
> **`auto`** 会先展开为 `AutoGroups ∩ UserUsableGroups(经特殊规则 patch 后)` 再逐 group 试 →
> 命中的 group 同时**决定计费倍率**。
