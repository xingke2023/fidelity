# 用户注册及创建 API 令牌接口文档

## 目录

1. [认证说明](#认证说明)
2. [用户注册](#一用户注册)
3. [用户登录](#二用户登录)
4. [创建 API 令牌](#三创建-api-令牌)
5. [获取令牌明文 Key](#四获取令牌明文-key)
6. [完整操作流程](#完整操作流程)
7. [代码示例](#代码示例)

---

## 认证说明

调用需要登录的接口时，支持两种认证方式：

### 方式一：Session Cookie（登录后自动携带）

调用登录接口后，服务端响应头会携带 `Set-Cookie`，后续请求带上该 Cookie 即可完成认证。适合浏览器环境或支持 Cookie 管理的 HTTP 客户端（如 curl `--cookie-jar`、Python `requests.Session()`）。

### 方式二：Access Token（编程调用推荐）

在请求头中携带用户的 Access Token：

```http
Authorization: Bearer <your-access-token>
```

> Access Token 可在用户设置页面生成，对应接口：`GET /api/user/token`

### 必须携带的请求头

所有需要 `UserAuth` 的接口，除认证外还**必须**携带以下请求头：

```http
New-Api-User: <your-user-id>
```

> 该值为当前登录用户的整数 ID（登录响应中的 `data.id`），必须与认证信息中的用户一致，否则返回 401。

---

## 一、用户注册

### `POST /api/user/register`

无需登录，公开接口。

#### 请求头

```http
Content-Type: application/json
```

#### 请求体

| 字段                | 类型   | 必填     | 说明                                      |
|-------------------|------|--------|-------------------------------------------|
| `username`        | string | ✅ 必填  | 用户名，最长 20 字符                       |
| `password`        | string | ✅ 必填  | 密码，8～20 字符                           |
| `email`           | string | 条件必填 | 开启邮箱验证时必填，最长 50 字符            |
| `verification_code` | string | 条件必填 | 邮箱验证码，开启邮箱验证时必填              |
| `aff_code`        | string | ❌ 可选  | 邀请码（填写邀请人的推广码）               |

#### 请求示例

```json
{
  "username": "testuser",
  "password": "password123",
  "email": "test@example.com",
  "verification_code": "123456",
  "aff_code": "ABCD1234"
}
```

#### 成功响应

```json
{
  "success": true,
  "message": ""
}
```

#### 失败响应示例

```json
{
  "success": false,
  "message": "用户名已存在"
}
```

#### 注意事项

- 系统需开启注册开关（`RegisterEnabled = true`）及密码注册开关（`PasswordRegisterEnabled = true`）
- 若系统开启了默认令牌生成，注册成功后会自动为新用户创建一个初始 API 令牌

---

## 二、用户登录

创建令牌前需先登录获取 Session。

### `POST /api/user/login`

#### 请求头

```http
Content-Type: application/json
```

#### 请求体

| 字段       | 类型   | 必填 | 说明   |
|----------|------|------|--------|
| `username` | string | ✅ | 用户名 |
| `password` | string | ✅ | 密码   |

#### 请求示例

```json
{
  "username": "testuser",
  "password": "password123"
}
```

#### 成功响应

```json
{
  "success": true,
  "message": "",
  "data": {
    "id": 42,
    "username": "testuser",
    "display_name": "testuser",
    "role": 1,
    "status": 1,
    "group": "default"
  }
}
```

> 登录成功后，响应头会携带 `Set-Cookie`，后续请求自动使用该 Cookie 即可完成认证。
> 记录返回的 `data.id`，后续请求需在 `New-Api-User` 请求头中填写该值。

#### 开启 2FA 时的响应

```json
{
  "success": true,
  "message": "请输入两步验证码",
  "data": {
    "require_2fa": true
  }
}
```

> 需继续调用 `POST /api/user/login/2fa` 完成验证。

---

## 三、创建 API 令牌

### `POST /api/token/`

**认证：** 需要登录（Session Cookie 或 Access Token + `New-Api-User` 请求头）

#### 请求头

```http
Content-Type: application/json
Cookie: <登录后的 session cookie>
New-Api-User: <your-user-id>
```

或使用 Access Token：

```http
Content-Type: application/json
Authorization: Bearer <your-access-token>
New-Api-User: <your-user-id>
```

#### 请求体

| 字段                  | 类型    | 必填     | 说明                                              |
|---------------------|-------|--------|---------------------------------------------------|
| `name`              | string | ✅ 必填  | 令牌名称，最长 50 字符                              |
| `expired_time`      | int64  | ❌ 可选  | 过期时间（Unix 秒级时间戳），`-1` 表示永不过期       |
| `unlimited_quota`   | bool   | ❌ 可选  | 是否无限额度，默认 `false`                          |
| `remain_quota`      | int    | 条件必填 | 剩余额度（`unlimited_quota=false` 时必须 >= 0）     |
| `model_limits_enabled` | bool | ❌ 可选 | 是否开启模型限制，默认 `false`                     |
| `model_limits`      | string | ❌ 可选  | 允许使用的模型列表                                  |
| `allow_ips`         | string | ❌ 可选  | IP 白名单（多个 IP 换行分隔）                       |
| `group`             | string | ❌ 可选  | 所属分组，填 `"auto"` 启用自动分组                  |
| `cross_group_retry` | bool   | ❌ 可选  | 跨分组重试（仅 `auto` 分组有效）                    |

#### 请求示例（无限额度，永不过期）

```json
{
  "name": "我的 API Key",
  "expired_time": -1,
  "unlimited_quota": true,
  "model_limits_enabled": false,
  "group": "default"
}
```

#### 请求示例（限定额度和有效期）

```json
{
  "name": "限额令牌",
  "expired_time": 1780000000,
  "unlimited_quota": false,
  "remain_quota": 100000,
  "model_limits_enabled": true,
  "model_limits": "gpt-4o,gpt-3.5-turbo",
  "group": "default"
}
```

#### 成功响应

```json
{
  "success": true,
  "message": ""
}
```

> ⚠️ 创建成功后**响应中不包含令牌 Key**，需通过下方接口单独获取。

#### 失败响应示例

```json
{
  "success": false,
  "message": "已达到最大令牌数量限制 (10)"
}
```

---

## 四、获取令牌明文 Key

### 步骤一：查询令牌列表，获取 ID

#### `GET /api/token/`

**认证：** 需要登录

```http
GET /api/token/
Cookie: <session>
New-Api-User: <user-id>
```

**响应示例：**

```json
{
  "success": true,
  "message": "",
  "data": {
    "items": [
      {
        "id": 7,
        "name": "我的 API Key",
        "key": "sk-xxxx**********xxxx",
        "status": 1,
        "expired_time": -1,
        "unlimited_quota": true,
        "remain_quota": 0
      }
    ],
    "total": 1
  }
}
```

> 列表中的 `key` 字段已脱敏，需通过下方接口获取明文。

---

### 步骤二：获取指定令牌的明文 Key

#### `POST /api/token/:id/key`

**认证：** 需要登录
**中间件：** 限流 + 禁止缓存

```http
POST /api/token/7/key
Cookie: <session>
New-Api-User: <user-id>
```

无需请求体。

**成功响应：**

```json
{
  "success": true,
  "message": "",
  "data": {
    "key": "sk-abcdefghijklmnopqrstuvwxyz123456789012345678"
  }
}
```

---

### 批量获取多个令牌 Key

#### `POST /api/token/batch/keys`

**认证：** 需要登录
**限制：** 每次最多 100 个

**请求体：**

```json
{
  "ids": [1, 2, 3]
}
```

**成功响应：**

```json
{
  "success": true,
  "message": "",
  "data": {
    "keys": {
      "1": "sk-aaa...",
      "2": "sk-bbb...",
      "3": "sk-ccc..."
    }
  }
}
```

---

## 完整操作流程

```
1. 注册账号
   POST /api/user/register
   └─ 返回 success: true

2. 登录获取 Session
   POST /api/user/login
   └─ 返回 data.id（用户 ID）及 Set-Cookie

3. 创建 API 令牌
   POST /api/token/
   Headers: Cookie + New-Api-User: <user-id>
   └─ 返回 success: true

4. 获取令牌列表，拿到令牌 ID
   GET /api/token/
   Headers: Cookie + New-Api-User: <user-id>
   └─ 返回令牌列表（key 已脱敏）

5. 获取明文 Key
   POST /api/token/:id/key
   Headers: Cookie + New-Api-User: <user-id>
   └─ 返回完整 sk-xxx Key
```

---

## 代码示例

以下示例演示从注册到获取 API Key 的完整流程，均使用 **Session Cookie 认证方式**。

### Python（使用 requests.Session 自动管理 Cookie）

```python
import requests

BASE_URL = "http://your-server:3000"

# 使用 Session 自动管理 Cookie
s = requests.Session()

# ── 1. 注册 ──────────────────────────────────────────
resp = s.post(f"{BASE_URL}/api/user/register", json={
    "username": "testuser",
    "password": "password123"
})
print("注册:", resp.json())

# ── 2. 登录，获取 Session Cookie 和用户 ID ──────────
resp = s.post(f"{BASE_URL}/api/user/login", json={
    "username": "testuser",
    "password": "password123"
})
data = resp.json()
print("登录:", data)
user_id = data["data"]["id"]   # 记录用户 ID，后续请求必须携带

# 所有需要认证的请求都加上此 Header
s.headers.update({"New-Api-User": str(user_id)})

# ── 3. 创建令牌 ────────────────────────────────────
resp = s.post(f"{BASE_URL}/api/token/", json={
    "name": "我的 API Key",
    "expired_time": -1,
    "unlimited_quota": True
})
print("创建令牌:", resp.json())

# ── 4. 获取令牌列表，拿到 token ID ────────────────
resp = s.get(f"{BASE_URL}/api/token/")
tokens = resp.json()["data"]["items"]
token_id = tokens[0]["id"]
print("令牌列表:", tokens)

# ── 5. 获取明文 Key ────────────────────────────────
resp = s.post(f"{BASE_URL}/api/token/{token_id}/key")
api_key = resp.json()["data"]["key"]
print("API Key:", api_key)
```

---

### curl（手动管理 Cookie 文件）

```bash
BASE_URL="http://your-server:3000"
COOKIE_FILE="/tmp/new-api-cookies.txt"

# ── 1. 注册 ──────────────────────────────────────────
curl -s -X POST "$BASE_URL/api/user/register" \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"password123"}'

# ── 2. 登录，保存 Cookie 到文件 ──────────────────────
LOGIN_RESP=$(curl -s -X POST "$BASE_URL/api/user/login" \
  -H "Content-Type: application/json" \
  -c "$COOKIE_FILE" \
  -d '{"username":"testuser","password":"password123"}')

echo "登录响应: $LOGIN_RESP"

# 提取用户 ID（需要安装 jq）
USER_ID=$(echo "$LOGIN_RESP" | jq -r '.data.id')
echo "用户 ID: $USER_ID"

# ── 3. 创建令牌 ────────────────────────────────────
curl -s -X POST "$BASE_URL/api/token/" \
  -H "Content-Type: application/json" \
  -H "New-Api-User: $USER_ID" \
  -b "$COOKIE_FILE" \
  -d '{"name":"我的 API Key","expired_time":-1,"unlimited_quota":true}'

# ── 4. 获取令牌列表，拿到 token ID ────────────────
LIST_RESP=$(curl -s "$BASE_URL/api/token/" \
  -H "New-Api-User: $USER_ID" \
  -b "$COOKIE_FILE")

echo "令牌列表: $LIST_RESP"
TOKEN_ID=$(echo "$LIST_RESP" | jq -r '.data.items[0].id')
echo "令牌 ID: $TOKEN_ID"

# ── 5. 获取明文 Key ────────────────────────────────
curl -s -X POST "$BASE_URL/api/token/$TOKEN_ID/key" \
  -H "New-Api-User: $USER_ID" \
  -b "$COOKIE_FILE"
```

---

### JavaScript / Node.js（使用 axios + tough-cookie）

```javascript
const axios = require("axios");
const { wrapper } = require("axios-cookiejar-support");
const { CookieJar } = require("tough-cookie");

const BASE_URL = "http://your-server:3000";

// 创建带 Cookie 管理的 axios 实例
const jar = new CookieJar();
const client = wrapper(axios.create({ baseURL: BASE_URL, jar }));

async function main() {
  // ── 1. 注册 ──────────────────────────────────────
  await client.post("/api/user/register", {
    username: "testuser",
    password: "password123",
  });
  console.log("注册成功");

  // ── 2. 登录，Cookie 自动保存到 jar ───────────────
  const loginResp = await client.post("/api/user/login", {
    username: "testuser",
    password: "password123",
  });
  const userId = loginResp.data.data.id;
  console.log("用户 ID:", userId);

  // 设置后续请求必须携带的 Header
  client.defaults.headers.common["New-Api-User"] = String(userId);

  // ── 3. 创建令牌 ───────────────────────────────────
  await client.post("/api/token/", {
    name: "我的 API Key",
    expired_time: -1,
    unlimited_quota: true,
  });
  console.log("令牌创建成功");

  // ── 4. 获取令牌列表 ───────────────────────────────
  const listResp = await client.get("/api/token/");
  const tokenId = listResp.data.data.items[0].id;
  console.log("令牌 ID:", tokenId);

  // ── 5. 获取明文 Key ───────────────────────────────
  const keyResp = await client.post(`/api/token/${tokenId}/key`);
  console.log("API Key:", keyResp.data.data.key);
}

main().catch(console.error);
```

> 安装依赖：`npm install axios axios-cookiejar-support tough-cookie`

```json
{
  "success": false,
  "message": "错误描述"
}
```

| HTTP 状态码 | 说明                     |
|-----------|--------------------------|
| `200`     | 所有业务响应均返回 200，通过 `success` 字段区分成功与否 |
| `401`     | 未认证（未登录或 Token 无效）  |
