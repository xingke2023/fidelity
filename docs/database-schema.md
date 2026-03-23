# 数据库结构说明

> 基于 GORM 模型自动建表，支持 SQLite / MySQL / PostgreSQL。
> 时间戳字段均为 int64 Unix 秒级时间戳（除 passkeys/2fa 使用 time.Time）。

---

## 目录

1. [users — 用户表](#1-users--用户表)
2. [tokens — API 令牌表](#2-tokens--api-令牌表)
3. [channels — 渠道表](#3-channels--渠道表)
4. [abilities — 渠道能力表](#4-abilities--渠道能力表)
5. [logs — 调用日志表](#5-logs--调用日志表)
6. [options — 系统配置表](#6-options--系统配置表)
7. [redemptions — 兑换码表](#7-redemptions--兑换码表)
8. [topups — 充值记录表](#8-topups--充值记录表)
9. [tasks — 异步任务表](#9-tasks--异步任务表)
10. [midjourneys — Midjourney 任务表](#10-midjourneys--midjourney-任务表)
11. [subscription_plans — 订阅计划表](#11-subscription_plans--订阅计划表)
12. [subscription_orders — 订阅订单表](#12-subscription_orders--订阅订单表)
13. [user_subscriptions — 用户订阅表](#13-user_subscriptions--用户订阅表)
14. [subscription_pre_consume_records — 订阅预消费记录表](#14-subscription_pre_consume_records--订阅预消费记录表)
15. [passkey_credentials — Passkey 凭证表](#15-passkey_credentials--passkey-凭证表)
16. [two_fas — 双因素认证表](#16-two_fas--双因素认证表)
17. [two_fa_backup_codes — 2FA 备用码表](#17-two_fa_backup_codes--2fa-备用码表)
18. [checkins — 签到表](#18-checkins--签到表)
19. [setups — 系统初始化表](#19-setups--系统初始化表)
20. [custom_oauth_providers — 自定义 OAuth 提供商表](#20-custom_oauth_providers--自定义-oauth-提供商表)
21. [prefill_groups — 预填组表](#21-prefill_groups--预填组表)
22. [quota_data — 配额统计表](#22-quota_data--配额统计表)
23. [user_oauth_bindings — 用户 OAuth 绑定表](#23-user_oauth_bindings--用户-oauth-绑定表)
24. [vendors — 供应商表](#24-vendors--供应商表)

---

## 1. users — 用户表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 用户 ID |
| username | varchar UNIQUE | 用户名，最长 20 字符 |
| password | varchar | bcrypt 加密密码 |
| display_name | varchar INDEX | 显示名称 |
| role | int default=1 | 角色：1=普通用户，10=管理员，100=超级管理员 |
| status | int default=1 | 状态：1=启用，2=禁用 |
| email | varchar INDEX | 邮箱 |
| github_id | varchar INDEX | GitHub OAuth ID |
| discord_id | varchar INDEX | Discord OAuth ID |
| oidc_id | varchar INDEX | OIDC OAuth ID |
| wechat_id | varchar INDEX | 微信 OAuth ID |
| telegram_id | varchar INDEX | Telegram ID |
| linux_do_id | varchar INDEX | Linux.do OAuth ID |
| access_token | char(32) UNIQUE | 系统管理令牌（非 API token） |
| quota | int default=0 | 可用额度 |
| used_quota | int default=0 | 已使用额度 |
| request_count | int default=0 | 请求总次数 |
| group | varchar(64) default='default' | 用户分组 |
| aff_code | varchar(32) UNIQUE | 邀请码（4字符随机） |
| aff_count | int default=0 | 邀请人数 |
| aff_quota | int default=0 | 邀请奖励余额（需手动转入 quota） |
| aff_history_quota | int default=0 | 邀请历史累计奖励 |
| inviter_id | int INDEX | 邀请人用户 ID |
| setting | text | 用户个性化设置（JSON） |
| remark | varchar(255) | 备注 |
| stripe_customer | varchar(64) INDEX | Stripe 客户 ID |
| deleted_at | datetime INDEX | 软删除时间 |

---

## 2. tokens — API 令牌表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 令牌 ID |
| user_id | int INDEX | 所属用户 ID |
| key | char(48) UNIQUE | 令牌密钥（48字符） |
| status | int default=1 | 状态：1=启用，2=禁用，3=过期，4=耗尽 |
| name | varchar INDEX | 令牌名称 |
| created_time | int64 | 创建时间 |
| accessed_time | int64 | 最后访问时间 |
| expired_time | int64 default=-1 | 过期时间，-1=永不过期 |
| remain_quota | int default=0 | 剩余额度 |
| unlimited_quota | bool | 是否无限额度 |
| model_limits_enabled | bool | 是否启用模型限制 |
| model_limits | text | 允许使用的模型列表（JSON） |
| allow_ips | varchar | IP 白名单（CIDR 格式，逗号分隔） |
| used_quota | int default=0 | 已使用额度 |
| group | varchar | 指定使用的渠道分组 |
| cross_group_retry | bool | 是否跨分组重试 |
| deleted_at | datetime INDEX | 软删除时间 |

---

## 3. channels — 渠道表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | 渠道 ID |
| type | int default=0 | 渠道类型（对应各 AI 提供商枚举） |
| key | text | API Key（多 key 用换行分隔） |
| name | varchar INDEX | 渠道名称 |
| status | int default=1 | 状态：1=启用，2=手动禁用，3=自动禁用 |
| weight | uint default=0 | 负载均衡权重 |
| priority | int64 default=0 | 调度优先级（越高越优先） |
| base_url | varchar | 自定义 API Base URL |
| models | text | 支持的模型列表（逗号分隔） |
| model_mapping | text | 模型名称映射（JSON） |
| group | varchar(64) default='default' | 渠道分组 |
| tag | varchar INDEX | 渠道标签 |
| used_quota | int64 default=0 | 累计使用额度 |
| response_time | int | 最近一次测速响应时间（ms） |
| test_time | int64 | 最近测速时间 |
| test_model | varchar | 用于测速的模型名 |
| balance | float64 | 渠道余额（部分提供商支持） |
| balance_updated_time | int64 | 余额更新时间 |
| auto_ban | int default=1 | 是否启用自动封禁 |
| status_code_mapping | varchar(1024) | HTTP 状态码映射（JSON） |
| openai_organization | varchar | OpenAI 组织 ID |
| param_override | text | 请求参数覆盖（JSON） |
| header_override | text | 请求头覆盖（JSON） |
| setting | text | 渠道额外配置（JSON） |
| settings | text | 其他设置（JSON） |
| channel_info | json | 多 Key 管理信息（JSON） |
| other | varchar | 其他信息 |
| other_info | varchar | 补充信息 |
| remark | varchar(255) | 备注 |

---

## 4. abilities — 渠道能力表

> 渠道与模型的映射关系，用于调度时快速查找可用渠道。

| 字段 | 类型 | 说明 |
|------|------|------|
| group | varchar(64) PK | 分组名 |
| model | varchar(255) PK | 模型名 |
| channel_id | int PK INDEX | 渠道 ID |
| enabled | bool | 是否启用 |
| priority | int64 default=0 INDEX | 优先级 |
| weight | uint default=0 INDEX | 权重 |
| tag | varchar INDEX | 标签 |

---

## 5. logs — 调用日志表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int INDEX | 日志 ID |
| user_id | int INDEX | 用户 ID |
| created_at | int64 INDEX | 创建时间 |
| type | int INDEX | 日志类型：0=未知，1=充值，2=消费，3=管理，4=系统，5=错误，6=退款 |
| content | text | 日志内容 |
| username | varchar INDEX | 用户名 |
| token_name | varchar INDEX | 令牌名称 |
| token_id | int INDEX | 令牌 ID |
| model_name | varchar INDEX | 模型名称 |
| channel_id | int INDEX | 渠道 ID |
| quota | int default=0 | 消耗额度 |
| prompt_tokens | int default=0 | 输入 token 数 |
| completion_tokens | int default=0 | 输出 token 数 |
| use_time | int default=0 | 请求耗时（ms） |
| is_stream | bool | 是否流式请求 |
| group | varchar INDEX | 用户分组 |
| ip | varchar INDEX | 客户端 IP |
| request_id | varchar(64) INDEX | 请求唯一 ID |
| other | text | 扩展信息（JSON） |

---

## 6. options — 系统配置表

| 字段 | 类型 | 说明 |
|------|------|------|
| key | varchar PK | 配置项名称 |
| value | text | 配置项值 |

> 存储所有系统运营配置，如注册开关、额度设置、支付配置等，Key-Value 格式。

---

## 7. redemptions — 兑换码表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int | 创建者用户 ID |
| key | char(32) UNIQUE | 兑换码（32字符） |
| status | int default=1 | 状态：1=未使用，2=已禁用，3=已使用 |
| name | varchar INDEX | 兑换码名称/批次 |
| quota | int default=100 | 可兑换额度 |
| created_time | int64 | 创建时间 |
| redeemed_time | int64 | 兑换时间 |
| used_user_id | int | 使用者用户 ID |
| expired_time | int64 | 过期时间 |
| deleted_at | datetime INDEX | 软删除时间 |

---

## 8. topups — 充值记录表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int INDEX | 用户 ID |
| amount | int64 | 充值额度数量 |
| money | float64 | 充值金额 |
| trade_no | varchar(255) UNIQUE | 交易流水号 |
| payment_method | varchar(50) | 支付方式 |
| create_time | int64 | 创建时间 |
| complete_time | int64 | 完成时间 |
| status | varchar | 状态（pending/success/failed） |

---

## 9. tasks — 异步任务表

> 用于 Midjourney、Suno、Kling 等需要异步轮询的任务。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int64 PK | 任务 ID |
| task_id | varchar(191) INDEX | 上游任务 ID |
| platform | varchar(30) INDEX | 平台类型（midjourney/suno 等） |
| user_id | int INDEX | 用户 ID |
| channel_id | int INDEX | 渠道 ID |
| group | varchar(50) | 用户分组 |
| quota | int | 消耗额度 |
| action | varchar(40) INDEX | 操作类型（IMAGINE/UPSCALE 等） |
| status | varchar(20) INDEX | 状态（NOT_START/IN_PROGRESS/SUCCESS/FAILURE） |
| progress | varchar(20) INDEX | 进度（0%-100%） |
| fail_reason | text | 失败原因 |
| submit_time | int64 INDEX | 提交时间 |
| start_time | int64 INDEX | 开始时间 |
| finish_time | int64 INDEX | 完成时间 |
| properties | json | 任务属性（输入、模型名等） |
| private_data | json | 内部数据（key、计费上下文等，不对外暴露） |
| data | json | 上游返回的原始数据 |
| created_at | int64 INDEX | 创建时间 |
| updated_at | int64 | 更新时间 |

---

## 10. midjourneys — Midjourney 任务表

> 旧版 Midjourney 专用表，新版统一使用 tasks 表。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int INDEX | 用户 ID |
| channel_id | int | 渠道 ID |
| mj_id | varchar INDEX | Midjourney 任务 ID |
| action | varchar(40) INDEX | 操作类型 |
| status | varchar(20) INDEX | 任务状态 |
| progress | varchar(30) INDEX | 进度 |
| prompt | text | 原始提示词 |
| prompt_en | text | 英文提示词 |
| description | text | 描述 |
| image_url | text | 结果图片 URL |
| video_url | text | 结果视频 URL |
| video_urls | text | 多视频 URL |
| fail_reason | text | 失败原因 |
| buttons | text | 操作按钮（JSON） |
| properties | text | 任务属性（JSON） |
| quota | int | 消耗额度 |
| submit_time | int64 INDEX | 提交时间 |
| start_time | int64 INDEX | 开始时间 |
| finish_time | int64 INDEX | 完成时间 |

---

## 11. subscription_plans — 订阅计划表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| title | varchar(128) | 计划名称 |
| subtitle | varchar(255) | 副标题 |
| price_amount | decimal(10,6) | 价格金额 |
| currency | varchar(8) default='USD' | 货币单位 |
| duration_unit | varchar(16) default='month' | 周期单位（day/month/year/custom） |
| duration_value | int default=1 | 周期数量 |
| custom_seconds | int64 default=0 | 自定义周期秒数 |
| total_amount | int64 | 订阅期总额度 |
| quota_reset_period | varchar(16) default='never' | 额度重置周期 |
| quota_reset_custom_seconds | int64 | 自定义重置周期秒数 |
| upgrade_group | varchar(64) | 订阅后升级到的用户分组 |
| stripe_price_id | varchar(128) | Stripe 价格 ID |
| creem_product_id | varchar(128) | Creem 产品 ID |
| max_purchase_per_user | int default=0 | 每用户最大购买次数（0=不限） |
| enabled | bool default=true | 是否上架 |
| sort_order | int default=0 | 排序权重 |
| created_at | int64 | 创建时间 |
| updated_at | int64 | 更新时间 |

---

## 12. subscription_orders — 订阅订单表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int INDEX | 用户 ID |
| plan_id | int INDEX | 订阅计划 ID |
| money | float64 | 实付金额 |
| trade_no | varchar(255) UNIQUE | 交易流水号 |
| payment_method | varchar(50) | 支付方式 |
| status | varchar | 状态 |
| provider_payload | text | 支付平台原始回调数据 |
| create_time | int64 | 创建时间 |
| complete_time | int64 | 完成时间 |

---

## 13. user_subscriptions — 用户订阅表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int INDEX | 用户 ID |
| plan_id | int INDEX | 订阅计划 ID |
| status | varchar(32) INDEX | 状态（active/expired/cancelled） |
| amount_total | int64 | 订阅总额度 |
| amount_used | int64 | 已使用额度 |
| start_time | int64 | 订阅开始时间 |
| end_time | int64 INDEX | 订阅结束时间 |
| last_reset_time | int64 | 上次额度重置时间 |
| next_reset_time | int64 INDEX | 下次额度重置时间 |
| upgrade_group | varchar(64) | 订阅期间所在分组 |
| prev_user_group | varchar(64) | 订阅前的原始分组（到期恢复用） |
| source | varchar(32) default='order' | 来源（order/admin 等） |
| created_at | int64 | 创建时间 |
| updated_at | int64 | 更新时间 |

---

## 14. subscription_pre_consume_records — 订阅预消费记录表

> 用于防止并发重复扣费，记录每次请求的预扣情况。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| request_id | varchar(64) UNIQUE | 请求唯一 ID |
| user_id | int INDEX | 用户 ID |
| user_subscription_id | int INDEX | 用户订阅 ID |
| pre_consumed | int64 | 预扣额度 |
| status | varchar(32) INDEX | 状态（pending/confirmed/refunded） |
| created_at | int64 | 创建时间 |
| updated_at | int64 INDEX | 更新时间 |

---

## 15. passkey_credentials — Passkey 凭证表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int UNIQUE | 用户 ID（每用户一条） |
| credential_id | varchar(512) UNIQUE | WebAuthn 凭证 ID |
| public_key | text | 公钥 |
| attestation_type | varchar(255) | 证明类型 |
| aaguid | varchar(512) | 设备 AAGUID |
| sign_count | uint32 | 签名计数器（防重放） |
| clone_warning | bool | 克隆警告标志 |
| user_present | bool | 用户在场标志 |
| user_verified | bool | 用户验证标志 |
| backup_eligible | bool | 可备份标志 |
| backup_state | bool | 备份状态 |
| transports | text | 传输方式列表（JSON） |
| attachment | varchar(32) | 附件类型（platform/cross-platform） |
| last_used_at | datetime | 最后使用时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |
| deleted_at | datetime INDEX | 软删除时间 |

---

## 16. two_fas — 双因素认证表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int UNIQUE | 用户 ID |
| secret | varchar(255) | TOTP 密钥（不对外暴露） |
| is_enabled | bool | 是否已启用 |
| failed_attempts | int default=0 | 连续失败次数 |
| locked_until | datetime | 锁定截止时间 |
| last_used_at | datetime | 最后使用时间 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |
| deleted_at | datetime | 软删除时间 |

---

## 17. two_fa_backup_codes — 2FA 备用码表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int INDEX | 用户 ID |
| code_hash | varchar(255) | 备用码哈希值（不存明文） |
| is_used | bool | 是否已使用 |
| used_at | datetime | 使用时间 |
| created_at | datetime | 创建时间 |
| deleted_at | datetime | 软删除时间 |

---

## 18. checkins — 签到表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int | 用户 ID（与 checkin_date 联合唯一） |
| checkin_date | varchar(10) | 签到日期（格式：2006-01-02） |
| quota_awarded | int | 本次签到奖励额度 |
| created_at | int64 | 签到时间 |

---

## 19. setups — 系统初始化表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uint PK | ID |
| version | varchar(50) | 系统版本号 |
| initialized_at | int64 | 初始化时间 |

> 仅一条记录，标记系统是否已完成初始化。

---

## 20. custom_oauth_providers — 自定义 OAuth 提供商表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| name | varchar(64) | 显示名称 |
| slug | varchar(64) UNIQUE | URL 标识符（如 `my-sso`） |
| icon | varchar(128) | 图标 URL |
| enabled | bool default=false | 是否启用 |
| client_id | varchar(256) | OAuth Client ID |
| client_secret | varchar(512) | OAuth Client Secret（不对外暴露） |
| authorization_endpoint | varchar(512) | 授权端点 URL |
| token_endpoint | varchar(512) | Token 端点 URL |
| user_info_endpoint | varchar(512) | 用户信息端点 URL |
| well_known | varchar(512) | OIDC Well-known 配置 URL |
| scopes | varchar(256) default='openid profile email' | 请求权限范围 |
| user_id_field | varchar(128) default='sub' | 用户 ID 字段名 |
| username_field | varchar(128) default='preferred_username' | 用户名字段名 |
| display_name_field | varchar(128) default='name' | 显示名字段名 |
| email_field | varchar(128) default='email' | 邮箱字段名 |
| auth_style | int default=0 | 认证方式（0=header，1=body） |
| access_policy | text | 访问策略表达式 |
| access_denied_message | varchar(512) | 拒绝访问提示信息 |
| created_at | datetime | 创建时间 |
| updated_at | datetime | 更新时间 |

---

## 21. prefill_groups — 预填组表

> 用于管理模型列表、分组等的预设配置集合。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| name | varchar(64) UNIQUE | 预填组名称 |
| type | varchar(32) INDEX | 类型（model_list 等） |
| items | json | 预填内容（JSON 数组） |
| description | varchar(255) | 描述 |
| created_time | int64 | 创建时间 |
| updated_time | int64 | 更新时间 |
| deleted_at | datetime INDEX | 软删除时间 |

---

## 22. quota_data — 配额统计表

> 按用户+模型聚合的用量统计，用于数据看板。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int INDEX | 用户 ID |
| username | varchar(64) INDEX | 用户名 |
| model_name | varchar(64) INDEX | 模型名称 |
| created_at | int64 INDEX | 统计时间（天级） |
| token_used | int default=0 | 使用 token 数 |
| count | int default=0 | 请求次数 |
| quota | int default=0 | 消耗额度 |

---

## 23. user_oauth_bindings — 用户 OAuth 绑定表

> 用于自定义 OAuth 提供商的用户绑定关系。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| user_id | int | 用户 ID（与 provider_id 联合唯一） |
| provider_id | int | OAuth 提供商 ID（custom_oauth_providers.id） |
| provider_user_id | varchar(256) | 用户在该 OAuth 提供商的 ID（与 provider_id 联合唯一） |
| created_at | datetime | 创建时间 |

---

## 24. vendors — 供应商表

> 渠道的上游 AI 服务商信息（用于前端展示和定价关联）。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int PK | ID |
| name | varchar(128) UNIQUE | 供应商名称 |
| description | text | 描述 |
| icon | varchar(128) | 图标 URL |
| status | int default=1 | 状态：1=启用 |
| created_time | int64 | 创建时间 |
| updated_time | int64 | 更新时间 |
| deleted_at | datetime INDEX | 软删除时间 |

---

## 表关系概览

```
users ──┬──< tokens          (users.id = tokens.user_id)
        ├──< logs            (users.id = logs.user_id)
        ├──< topups          (users.id = topups.user_id)
        ├──< tasks           (users.id = tasks.user_id)
        ├──< checkins        (users.id = checkins.user_id)
        ├──< user_subscriptions (users.id = user_subscriptions.user_id)
        ├──< passkey_credentials (users.id = passkey_credentials.user_id)
        ├──< two_fas         (users.id = two_fas.user_id)
        └──< user_oauth_bindings (users.id = user_oauth_bindings.user_id)

channels ──┬──< abilities    (channels.id = abilities.channel_id)
           ├──< logs         (channels.id = logs.channel_id)
           └──< tasks        (channels.id = tasks.channel_id)

subscription_plans ──< subscription_orders    (plans.id = orders.plan_id)
subscription_plans ──< user_subscriptions     (plans.id = subscriptions.plan_id)

custom_oauth_providers ──< user_oauth_bindings (providers.id = bindings.provider_id)
vendors ── pricing (vendor_id 关联，内存中维护)
```
