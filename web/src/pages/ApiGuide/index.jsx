/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Typography,
  Tabs,
  TabPane,
  Tag,
  Toast,
  Card,
  Space,
  Badge,
  Input,
} from '@douyinfe/semi-ui';
import { Copy, Check, ExternalLink, Key, Zap, Code2, AlertCircle, Layers, Terminal, Video } from 'lucide-react';
import { getServerAddress } from '../../helpers/token';
import { Link } from 'react-router-dom';

const { Title, Text, Paragraph } = Typography;

// Code block with copy button
function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [code]);

  return (
    <div className='relative group rounded-lg overflow-hidden' style={{ background: 'var(--semi-color-fill-0)', border: '1px solid var(--semi-color-border)' }}>
      <div className='flex items-center justify-between px-4 py-2' style={{ background: 'var(--semi-color-fill-1)', borderBottom: '1px solid var(--semi-color-border)' }}>
        <Text type='tertiary' size='small' className='font-mono'>{lang}</Text>
        <button
          onClick={handleCopy}
          className='flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors'
          style={{ color: 'var(--semi-color-text-2)', cursor: 'pointer', background: 'transparent', border: 'none' }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--semi-color-text-0)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--semi-color-text-2)'}
        >
          {copied
            ? <><Check size={13} /><span>已复制</span></>
            : <><Copy size={13} /><span>复制</span></>
          }
        </button>
      </div>
      <pre className='overflow-x-auto p-4 m-0 text-sm leading-relaxed font-mono' style={{ color: 'var(--semi-color-text-0)' }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

// Section title with icon
function SectionTitle({ icon: Icon, title, description }) {
  return (
    <div className='mb-6'>
      <div className='flex items-center gap-2 mb-2'>
        <Icon size={18} color='var(--semi-color-primary)' />
        <Title heading={4} style={{ margin: 0 }}>{title}</Title>
      </div>
      {description && <Text type='tertiary'>{description}</Text>}
    </div>
  );
}

// Step number badge
function StepBadge({ num }) {
  return (
    <span
      className='inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold flex-shrink-0'
      style={{ background: 'var(--semi-color-primary)', color: '#fff' }}
    >
      {num}
    </span>
  );
}

// Interactive OpenClaw config block with editable provider name
function OpenClawConfigBlock({ clawConfig }) {
  const { t } = useTranslation();
  const [providerName, setProviderName] = useState('my-api');
  return (
    <div className='space-y-2'>
      <div className='flex items-center gap-3'>
        <Text type='tertiary' size='small'>{t('provider 标识符：')}</Text>
        <Input
          size='small'
          value={providerName}
          onChange={setProviderName}
          placeholder='my-api'
          style={{ width: 160, fontFamily: 'monospace' }}
        />
      </div>
      <CodeBlock lang='json' code={clawConfig(providerName || 'your-provider-name')} />
    </div>
  );
}

export default function ApiGuide() {
  const { t } = useTranslation();
  const baseUrl = getServerAddress();

  // ─── Code snippets ─────────────────────────────────────────────────

  const curlChat = `curl ${baseUrl}/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "gpt-4o-mini",
    "messages": [
      {"role": "user", "content": "你好，请介绍一下自己"}
    ]
  }'`;

  const pythonChat = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${baseUrl}/v1"
)

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[
        {"role": "user", "content": "你好，请介绍一下自己"}
    ]
)

print(response.choices[0].message.content)`;

  const jsChat = `import OpenAI from "openai";

const client = new OpenAI({
  apiKey: "YOUR_API_KEY",
  baseURL: "${baseUrl}/v1",
  dangerouslyAllowBrowser: true, // 仅用于演示，生产环境请在服务端调用
});

const response = await client.chat.completions.create({
  model: "gpt-4o-mini",
  messages: [{ role: "user", content: "你好，请介绍一下自己" }],
});

console.log(response.choices[0].message.content);`;

  const streamPython = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${baseUrl}/v1"
)

stream = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=[{"role": "user", "content": "用 100 字介绍宇宙大爆炸"}],
    stream=True,
)

for chunk in stream:
    if chunk.choices[0].delta.content is not None:
        print(chunk.choices[0].delta.content, end="", flush=True)`;

  const curlEmbed = `curl ${baseUrl}/v1/embeddings \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "text-embedding-3-small",
    "input": "The quick brown fox jumps over the lazy dog"
  }'`;

  const pythonEmbed = `from openai import OpenAI

client = OpenAI(
    api_key="YOUR_API_KEY",
    base_url="${baseUrl}/v1"
)

response = client.embeddings.create(
    model="text-embedding-3-small",
    input="The quick brown fox jumps over the lazy dog"
)

embedding = response.data[0].embedding
print(f"向量维度：{len(embedding)}")`;

  const curlModels = `curl ${baseUrl}/v1/models \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const curlBalance = `curl ${baseUrl}/v1/dashboard/billing/subscription \\
  -H "Authorization: Bearer YOUR_API_KEY"`;

  const errorExample = `# 常见错误码说明：
# 401 Unauthorized   — API Key 无效或已过期
# 403 Forbidden      — 无权访问该模型或功能
# 429 Too Many Req.  — 请求频率超限，请稍后重试
# 500 Internal Error — 上游服务异常，请检查渠道配置

# 错误响应示例：
{
  "error": {
    "message": "Invalid API key provided.",
    "type": "invalid_request_error",
    "code": "invalid_api_key"
  }
}`;

  const retryPython = `import time
from openai import OpenAI, RateLimitError, APIStatusError

client = OpenAI(api_key="YOUR_API_KEY", base_url="${baseUrl}/v1")

def chat_with_retry(prompt, max_retries=3):
    for attempt in range(max_retries):
        try:
            response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
            )
            return response.choices[0].message.content
        except RateLimitError:
            wait = 2 ** attempt  # 指数退避
            print(f"频率限制，{wait}s 后重试...")
            time.sleep(wait)
        except APIStatusError as e:
            print(f"API 错误 {e.status_code}: {e.message}")
            break
    return None`;

  const clawConfig = (providerName) => `{
  "models": {
    "mode": "merge",
    "providers": {
      "${providerName}": {
        "baseUrl": "${baseUrl}/",
        "apiKey": "sk-your-api-key-here",
        "api": "anthropic-messages",
        "models": [
          {
            "id": "claude-sonnet-4-6",
            "name": "claude-sonnet-4-6",
            "reasoning": false,
            "input": ["text", "image"],
            "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
            "contextWindow": 200000,
            "maxTokens": 32000
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": { "primary": "${providerName}/claude-sonnet-4-6" },
      "models": { "${providerName}/claude-sonnet-4-6": {} }
    }
  }
}`;

  return (
    <div className='max-w-4xl mx-auto px-4 py-8 mt-[64px]'>
      {/* Header */}
      <div className='mb-8'>
        <Title heading={2} style={{ marginBottom: 8 }}>
          {t('接口使用指南')}
        </Title>
        <Paragraph type='tertiary'>
          {t('本指南介绍如何通过 OpenAI 兼容接口接入本平台，快速完成应用集成。')}
        </Paragraph>
        <div className='flex flex-wrap gap-2 mt-4'>
          <Tag color='blue' size='small'>OpenAI 兼容</Tag>
          <Tag color='green' size='small'>流式输出</Tag>
          <Tag color='orange' size='small'>多模型</Tag>
          <Tag color='purple' size='small'>Embeddings</Tag>
        </div>
      </div>

      {/* Quick info cards */}
      <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8'>
        <Card bodyStyle={{ padding: '16px 20px' }} style={{ border: '1px solid var(--semi-color-border)' }}>
          <Text type='tertiary' size='small'>{t('接口基础地址')}</Text>
          <div className='flex items-center gap-2 mt-1'>
            <Text className='font-mono font-medium' style={{ wordBreak: 'break-all' }}>{baseUrl}/v1</Text>
          </div>
        </Card>
        <Card bodyStyle={{ padding: '16px 20px' }} style={{ border: '1px solid var(--semi-color-border)' }}>
          <Text type='tertiary' size='small'>{t('认证方式')}</Text>
          <div className='flex items-center gap-2 mt-1'>
            <Text className='font-mono font-medium'>Authorization: Bearer &lt;API Key&gt;</Text>
          </div>
        </Card>
      </div>

      {/* Main tabs */}
      <Tabs type='line' defaultActiveKey='quickstart' keepDOM={false}>

        {/* ── Tab 1: Quick start ── */}
        <TabPane tab={t('快速开始')} itemKey='quickstart'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={Zap}
              title={t('三步开始调用')}
              description={t('按照以下步骤获取 API Key 并发送第一个请求。')}
            />

            {/* Step 1 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <StepBadge num={1} />
                <Text strong>{t('注册并登录账号')}</Text>
              </div>
              <div className='ml-9'>
                <Paragraph type='tertiary'>
                  {t('前往登录页完成注册，或使用管理员分配的账号登录控制台。')}
                </Paragraph>
                <Link to='/login'>
                  <span className='inline-flex items-center gap-1 text-sm' style={{ color: 'var(--semi-color-primary)' }}>
                    {t('前往登录')} <ExternalLink size={13} />
                  </span>
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <StepBadge num={2} />
                <Text strong>{t('创建 API Key（令牌）')}</Text>
              </div>
              <div className='ml-9'>
                <Paragraph type='tertiary'>
                  {t('进入「令牌管理」页面，点击「创建令牌」，设置名称与有效期后复制生成的 Key。请妥善保存，Key 只显示一次。')}
                </Paragraph>
                <Link to='/console/token'>
                  <span className='inline-flex items-center gap-1 text-sm' style={{ color: 'var(--semi-color-primary)' }}>
                    {t('前往令牌管理')} <ExternalLink size={13} />
                  </span>
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <StepBadge num={3} />
                <Text strong>{t('发送第一个请求')}</Text>
              </div>
              <div className='ml-9 space-y-3'>
                <Paragraph type='tertiary'>
                  {t('将 YOUR_API_KEY 替换为你的令牌，选择下方任意语言运行示例代码。')}
                </Paragraph>
                <Tabs type='card' size='small' defaultActiveKey='curl'>
                  <TabPane tab='cURL' itemKey='curl'>
                    <CodeBlock code={curlChat} lang='bash' />
                  </TabPane>
                  <TabPane tab='Python' itemKey='python'>
                    <CodeBlock code={pythonChat} lang='python' />
                  </TabPane>
                  <TabPane tab='JavaScript' itemKey='js'>
                    <CodeBlock code={jsChat} lang='javascript' />
                  </TabPane>
                </Tabs>
              </div>
            </div>
          </div>
        </TabPane>

        {/* ── Tab 2: Chat completions ── */}
        <TabPane tab={t('聊天补全')} itemKey='chat'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={Code2}
              title={t('Chat Completions')}
              description={`POST ${baseUrl}/v1/chat/completions`}
            />

            {/* Multi-turn conversation */}
            <div>
              <Text strong className='block mb-3'>{t('多轮对话')}</Text>
              <Paragraph type='tertiary' className='mb-3'>
                {t('通过 messages 数组携带历史消息，实现上下文连续对话。system 角色用于设定助手行为。')}
              </Paragraph>
              <CodeBlock lang='python' code={`from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY", base_url="${baseUrl}/v1")

messages = [
    {"role": "system", "content": "你是一个专业的 Python 编程助手。"},
    {"role": "user",   "content": "如何用列表推导式过滤偶数？"},
]

response = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
)

answer = response.choices[0].message.content
print(answer)

# 追加回复，继续对话
messages.append({"role": "assistant", "content": answer})
messages.append({"role": "user", "content": "给我一个完整的示例代码"})

response2 = client.chat.completions.create(
    model="gpt-4o-mini",
    messages=messages,
)`} />
            </div>

            {/* Streaming */}
            <div>
              <Text strong className='block mb-3'>{t('流式输出（Stream）')}</Text>
              <Paragraph type='tertiary' className='mb-3'>
                {t('设置 stream=True 可逐字接收响应，减少用户等待感，适合实时对话场景。')}
              </Paragraph>
              <CodeBlock lang='python' code={streamPython} />
            </div>

            {/* Parameters */}
            <div>
              <Text strong className='block mb-4'>{t('常用参数说明')}</Text>
              <div className='overflow-x-auto rounded-lg' style={{ border: '1px solid var(--semi-color-border)' }}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr style={{ background: 'var(--semi-color-fill-1)' }}>
                      <th className='text-left px-4 py-3 font-medium'>{t('参数')}</th>
                      <th className='text-left px-4 py-3 font-medium'>{t('类型')}</th>
                      <th className='text-left px-4 py-3 font-medium'>{t('说明')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { param: 'model', type: 'string', desc: t('模型名称，如 gpt-4o、gpt-4o-mini、claude-3-5-sonnet') },
                      { param: 'messages', type: 'array', desc: t('消息列表，每条含 role（system/user/assistant）和 content') },
                      { param: 'temperature', type: 'number', desc: t('温度 0~2，越高越随机，默认 1') },
                      { param: 'max_tokens', type: 'integer', desc: t('最大输出 token 数，超出则截断') },
                      { param: 'stream', type: 'boolean', desc: t('为 true 时以 SSE 流式返回，默认 false') },
                      { param: 'top_p', type: 'number', desc: t('核采样概率，与 temperature 二选一调节') },
                    ].map((row, i) => (
                      <tr key={row.param} style={{ borderTop: '1px solid var(--semi-color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--semi-color-fill-0)' }}>
                        <td className='px-4 py-3 font-mono' style={{ color: 'var(--semi-color-primary)' }}>{row.param}</td>
                        <td className='px-4 py-3'>
                          <Tag size='small' color='blue'>{row.type}</Tag>
                        </td>
                        <td className='px-4 py-3' style={{ color: 'var(--semi-color-text-1)' }}>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabPane>

        {/* ── Tab 3: Embeddings ── */}
        <TabPane tab={t('文本嵌入')} itemKey='embeddings'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={Layers}
              title={t('Embeddings')}
              description={`POST ${baseUrl}/v1/embeddings`}
            />

            <Paragraph type='tertiary'>
              {t('文本嵌入将文本转换为高维向量，可用于语义搜索、相似度计算、RAG 检索增强生成等场景。')}
            </Paragraph>

            <Tabs type='card' size='small' defaultActiveKey='curl'>
              <TabPane tab='cURL' itemKey='curl'>
                <CodeBlock code={curlEmbed} lang='bash' />
              </TabPane>
              <TabPane tab='Python' itemKey='python'>
                <CodeBlock code={pythonEmbed} lang='python' />
              </TabPane>
            </Tabs>

            <div>
              <Text strong className='block mb-3'>{t('批量嵌入')}</Text>
              <CodeBlock lang='python' code={`from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY", base_url="${baseUrl}/v1")

texts = [
    "机器学习是人工智能的一个分支",
    "深度学习使用多层神经网络",
    "自然语言处理处理人类语言",
]

response = client.embeddings.create(
    model="text-embedding-3-small",
    input=texts,
)

for i, item in enumerate(response.data):
    print(f"文本 {i+1} 向量维度: {len(item.embedding)}")`} />
            </div>

            <div>
              <Text strong className='block mb-3'>{t('推荐嵌入模型')}</Text>
              <div className='overflow-x-auto rounded-lg' style={{ border: '1px solid var(--semi-color-border)' }}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr style={{ background: 'var(--semi-color-fill-1)' }}>
                      <th className='text-left px-4 py-3 font-medium'>{t('模型')}</th>
                      <th className='text-left px-4 py-3 font-medium'>{t('维度')}</th>
                      <th className='text-left px-4 py-3 font-medium'>{t('适用场景')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { model: 'text-embedding-3-small', dim: '1536', scene: t('通用场景，性价比高') },
                      { model: 'text-embedding-3-large', dim: '3072', scene: t('高精度语义检索') },
                      { model: 'text-embedding-ada-002', dim: '1536', scene: t('兼容历史接口') },
                    ].map((row, i) => (
                      <tr key={row.model} style={{ borderTop: '1px solid var(--semi-color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--semi-color-fill-0)' }}>
                        <td className='px-4 py-3 font-mono text-xs' style={{ color: 'var(--semi-color-primary)' }}>{row.model}</td>
                        <td className='px-4 py-3'>{row.dim}</td>
                        <td className='px-4 py-3' style={{ color: 'var(--semi-color-text-1)' }}>{row.scene}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabPane>

        {/* ── Tab 4: Other APIs ── */}
        <TabPane tab={t('其他接口')} itemKey='other'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={Key}
              title={t('模型列表与余额查询')}
            />

            <div>
              <Text strong className='block mb-2'>{t('获取可用模型列表')}</Text>
              <Paragraph type='tertiary' className='mb-3'>
                {`GET ${baseUrl}/v1/models`}
              </Paragraph>
              <CodeBlock code={curlModels} lang='bash' />
            </div>

            <div>
              <Text strong className='block mb-2'>{t('查询账户余额')}</Text>
              <Paragraph type='tertiary' className='mb-3'>
                {`GET ${baseUrl}/v1/dashboard/billing/subscription`}
              </Paragraph>
              <CodeBlock code={curlBalance} lang='bash' />
            </div>

            <div>
              <Text strong className='block mb-3'>{t('图像生成（DALL·E）')}</Text>
              <CodeBlock lang='python' code={`from openai import OpenAI

client = OpenAI(api_key="YOUR_API_KEY", base_url="${baseUrl}/v1")

response = client.images.generate(
    model="dall-e-3",
    prompt="一只在雪山上奔跑的金毛猎犬，电影感光线，写实风格",
    size="1024x1024",
    quality="standard",
    n=1,
)

print(response.data[0].url)`} />
            </div>
          </div>
        </TabPane>

        {/* ── Tab 5: Error handling ── */}
        <TabPane tab={t('错误处理')} itemKey='errors'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={AlertCircle}
              title={t('错误码与重试策略')}
            />

            <CodeBlock code={errorExample} lang='json' />

            <div>
              <Text strong className='block mb-3'>{t('带指数退避的重试示例')}</Text>
              <CodeBlock code={retryPython} lang='python' />
            </div>

            <div>
              <Text strong className='block mb-4'>{t('常见问题排查')}</Text>
              <div className='space-y-3'>
                {[
                  {
                    q: t('返回 401 Unauthorized'),
                    a: t('检查 Authorization 请求头格式是否为 "Bearer sk-xxx"，令牌是否已过期或被禁用。'),
                  },
                  {
                    q: t('返回 403 Model not available'),
                    a: t('该令牌无权访问此模型，请联系管理员确认令牌权限组或切换其他模型。'),
                  },
                  {
                    q: t('返回 429 Too Many Requests'),
                    a: t('触发频率限制，请降低请求频率或联系管理员提升配额，建议实现指数退避重试。'),
                  },
                  {
                    q: t('响应截断或不完整'),
                    a: t('增大 max_tokens 参数，或检查网络连接是否超时中断了流式响应。'),
                  },
                ].map((item, i) => (
                  <div key={i} className='rounded-lg p-4' style={{ background: 'var(--semi-color-fill-0)', border: '1px solid var(--semi-color-border)' }}>
                    <Text strong className='block mb-1' style={{ color: 'var(--semi-color-warning)' }}>{item.q}</Text>
                    <Text type='tertiary'>{item.a}</Text>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </TabPane>

        {/* ── Tab 6: OpenClaw (龙虾) ── */}
        <TabPane tab={t('龙虾接入')} itemKey='openclaw'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={Terminal}
              title={t('OpenClaw（龙虾）接入指南')}
              description={t('通过编辑配置文件，将本平台作为 OpenClaw 的 Anthropic 后端。')}
            />

            <div className='rounded-lg p-4' style={{ background: 'var(--semi-color-warning-light-default)', border: '1px solid var(--semi-color-warning-light-hover)' }}>
              <Text strong style={{ color: 'var(--semi-color-warning-active)' }}>{t('前提条件')}</Text>
              <ul className='mt-2 space-y-1 pl-4 list-disc' style={{ color: 'var(--semi-color-text-1)' }}>
                <li><Text>{t('已安装 OpenClaw CLI（龙虾）并完成初始化，配置文件位于')}{' '}<code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>~/.openclaw/openclaw.json</code></Text></li>
                <li><Text>{t('已在本平台创建 API 令牌（Key 格式为 sk-…）')}</Text></li>
              </ul>
            </div>

            {/* Step 1 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <StepBadge num={1} />
                <Text strong>{t('打开配置文件')}</Text>
              </div>
              <div className='ml-9'>
                <CodeBlock lang='bash' code={`# 用任意编辑器打开配置文件
vim ~/.openclaw/openclaw.json
# 或
code ~/.openclaw/openclaw.json`} />
              </div>
            </div>

            {/* Step 2 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <StepBadge num={2} />
                <Text strong>{t('修改 models 和 agents.defaults 字段')}</Text>
              </div>
              <div className='ml-9 space-y-3'>
                <Paragraph type='tertiary'>
                  {t('将下方配置合并到你的 openclaw.json 中，替换')}
                  {' '}
                  <code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>your-provider-name</code>
                  {' '}
                  {t('为自定义标识符（建议使用域名关键词，如')}{' '}
                  <code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>my-api</code>
                  {t('），并填入你的 API Key。')}
                </Paragraph>
                <OpenClawConfigBlock clawConfig={clawConfig} />
              </div>
            </div>

            {/* Step 3 */}
            <div className='space-y-3'>
              <div className='flex items-center gap-3'>
                <StepBadge num={3} />
                <Text strong>{t('验证配置')}</Text>
              </div>
              <div className='ml-9'>
                <CodeBlock lang='bash' code={`# 列出已注册的模型，确认自定义 provider 出现在列表中
openclaw models list

# 发送测试消息
openclaw "你好，请介绍一下自己"`} />
              </div>
            </div>

            {/* Key notes */}
            <div>
              <Text strong className='block mb-3'>{t('注意事项')}</Text>
              <div className='overflow-x-auto rounded-lg' style={{ border: '1px solid var(--semi-color-border)' }}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr style={{ background: 'var(--semi-color-fill-1)' }}>
                      <th className='text-left px-4 py-3 font-medium'>{t('字段')}</th>
                      <th className='text-left px-4 py-3 font-medium'>{t('说明')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { field: 'models.mode', desc: t('"merge" 表示与默认配置合并，不会清除其他 provider') },
                      { field: 'baseUrl', desc: t('必须以 / 结尾，填写本平台的完整地址') },
                      { field: 'api', desc: t('固定填写 "anthropic-messages"，使用 Anthropic Messages 格式') },
                      { field: 'your-provider-name', desc: t('自定义标识符，在 agents.defaults 中通过 provider名/模型名 格式引用') },
                      { field: 'model.primary', desc: t('格式必须为 provider名/模型名，如 my-api/claude-sonnet-4-6') },
                    ].map((row, i) => (
                      <tr key={row.field} style={{ borderTop: '1px solid var(--semi-color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--semi-color-fill-0)' }}>
                        <td className='px-4 py-3 font-mono text-xs' style={{ color: 'var(--semi-color-primary)' }}>{row.field}</td>
                        <td className='px-4 py-3' style={{ color: 'var(--semi-color-text-1)' }}>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </TabPane>

        {/* ── Tab 7: Seedance 2.0 ── */}
        <TabPane tab='Seedance 2.0' itemKey='seedance'>
          <div className='py-6 space-y-8'>

            <SectionTitle
              icon={Video}
              title='Seedance 2.0 视频生成'
              description='doubao-seedance-2-0 系列模型支持文本、图片、视频、音频多模态输入，生成高质量视频内容。'
            />

            {/* Intro */}
            <div className='rounded-lg p-4' style={{ background: 'var(--semi-color-fill-0)', border: '1px solid var(--semi-color-border)' }}>
              <Text strong className='block mb-2'>接口说明</Text>
              <ul className='space-y-1 pl-4 list-disc' style={{ color: 'var(--semi-color-text-1)' }}>
                <li><Text>视频生成为异步任务接口：先提交任务获取 <code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>task_id</code>，再轮询状态获取结果。</Text></li>
                <li><Text>请求体使用豆包原生格式：通过顶层 <code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>content[]</code> 数组传入文本、图片、视频、音频等多模态素材。</Text></li>
                <li><Text>可用模型：<code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>doubao-seedance-2-0-fast-260128</code>（快速版）、<code className='font-mono text-xs px-1 py-0.5 rounded' style={{ background: 'var(--semi-color-fill-1)' }}>doubao-seedance-2-0-260128</code>（标准版）</Text></li>
                <li><Text>计费：任务完成后按实际生成 token 数结算（后扣费），无视频输入 ¥46/百万 tokens，有视频输入 ¥28/百万 tokens（标准版）。</Text></li>
              </ul>
            </div>

            {/* Step 1: Submit task */}
            <div>
              <Text strong className='block mb-3'>第一步：提交生成任务</Text>
              <Paragraph type='tertiary' className='mb-3'>
                {`POST ${baseUrl}/v1/video/generations`}
              </Paragraph>

              <Tabs type='card' size='small' defaultActiveKey='curl-basic'>
                <TabPane tab='cURL（文生视频）' itemKey='curl-basic'>
                  <CodeBlock lang='bash' code={`curl -X POST ${baseUrl}/v1/video/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "doubao-seedance-2-0-fast-260128",
    "content": [
      {
        "type": "text",
        "text": "一只小猫在阳光明媚的花园中奔跑，慢镜头，电影感光线"
      }
    ],
    "ratio": "16:9",
    "duration": 5,
    "generate_audio": true,
    "watermark": false
  }'`} />
                </TabPane>
                <TabPane tab='cURL（图生视频）' itemKey='curl-i2v'>
                  <CodeBlock lang='bash' code={`curl -X POST ${baseUrl}/v1/video/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "doubao-seedance-2-0-fast-260128",
    "content": [
      {
        "type": "text",
        "text": "相机缓缓拉远，光线逐渐明亮"
      },
      {
        "type": "image_url",
        "image_url": { "url": "https://example.com/reference_image.jpg" },
        "role": "reference_image"
      }
    ],
    "ratio": "16:9",
    "duration": 5,
    "generate_audio": true,
    "watermark": false
  }'`} />
                </TabPane>
                <TabPane tab='cURL（多模态：参考视频+音频）' itemKey='curl-multi'>
                  <CodeBlock lang='bash' code={`curl -X POST ${baseUrl}/v1/video/generations \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -d '{
    "model": "doubao-seedance-2-0-260128",
    "content": [
      {
        "type": "text",
        "text": "全程使用视频1的第一视角构图，全程使用音频1作为背景音乐"
      },
      {
        "type": "image_url",
        "image_url": { "url": "https://example.com/reference_image.jpg" },
        "role": "reference_image"
      },
      {
        "type": "video_url",
        "video_url": { "url": "https://example.com/reference_video.mp4" },
        "role": "reference_video"
      },
      {
        "type": "audio_url",
        "audio_url": { "url": "https://example.com/reference_audio.mp3" },
        "role": "reference_audio"
      }
    ],
    "generate_audio": true,
    "resolution": "720p",
    "ratio": "16:9",
    "duration": 8,
    "watermark": false
  }'`} />
                </TabPane>
                <TabPane tab='Python' itemKey='python'>
                  <CodeBlock lang='python' code={`import requests

API_KEY = "YOUR_API_KEY"
BASE_URL = "${baseUrl}"
HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Bearer {API_KEY}",
}

def create_video_task(text, ratio="16:9", duration=5, extra_content=None):
    """提交视频生成任务，返回 task_id"""
    content = [{"type": "text", "text": text}]
    if extra_content:
        content.extend(extra_content)

    payload = {
        "model": "doubao-seedance-2-0-fast-260128",
        "content": content,
        "ratio": ratio,
        "duration": duration,
        "generate_audio": True,
        "watermark": False,
    }
    resp = requests.post(
        f"{BASE_URL}/v1/video/generations",
        json=payload,
        headers=HEADERS,
    )
    resp.raise_for_status()
    return resp.json()["task_id"]

# 文生视频
task_id = create_video_task("一只小猫在花园中奔跑，慢镜头，电影感光线")
print(f"任务已提交，task_id: {task_id}")

# 图生视频（含参考图片）
task_id = create_video_task(
    "相机缓缓拉远，光线逐渐明亮",
    extra_content=[{
        "type": "image_url",
        "image_url": {"url": "https://example.com/ref.jpg"},
        "role": "reference_image",
    }]
)`} />
                </TabPane>
              </Tabs>
            </div>

            {/* Step 2: Poll for result */}
            <div>
              <Text strong className='block mb-3'>第二步：轮询任务状态获取结果</Text>
              <Paragraph type='tertiary' className='mb-3'>
                {`GET ${baseUrl}/v1/video/generations/{task_id}`}
              </Paragraph>

              <Tabs type='card' size='small' defaultActiveKey='curl-poll'>
                <TabPane tab='cURL' itemKey='curl-poll'>
                  <CodeBlock lang='bash' code={`curl ${baseUrl}/v1/video/generations/YOUR_TASK_ID \\
  -H "Authorization: Bearer YOUR_API_KEY"

# 响应示例（成功）：
# {
#   "code": "success",
#   "data": {
#     "status": "SUCCESS",
#     "progress": "100%",
#     "result_url": "https://..."
#   }
# }

# 响应示例（进行中）：
# {
#   "code": "success",
#   "data": {
#     "status": "IN_PROGRESS",
#     "progress": "50%"
#   }
# }`} />
                </TabPane>
                <TabPane tab='Python（自动轮询）' itemKey='python-poll'>
                  <CodeBlock lang='python' code={`import requests
import time

API_KEY = "YOUR_API_KEY"
BASE_URL = "${baseUrl}"
HEADERS = {"Authorization": f"Bearer {API_KEY}"}

def poll_task(task_id, interval=10, timeout=600):
    """轮询任务直到完成，返回视频 URL"""
    deadline = time.time() + timeout
    while time.time() < deadline:
        resp = requests.get(
            f"{BASE_URL}/v1/video/generations/{task_id}",
            headers=HEADERS,
        )
        resp.raise_for_status()
        data = resp.json().get("data", {})
        status = data.get("status", "UNKNOWN")

        if status == "SUCCESS":
            video_url = data.get("result_url")
            if not video_url:
                raise RuntimeError("任务成功但未找到视频 URL")
            return video_url

        elif status == "FAILURE":
            raise RuntimeError(f"任务失败: {data.get('fail_reason', '未知原因')}")

        else:  # QUEUED / IN_PROGRESS
            progress = data.get("progress", "?")
            print(f"状态: {status}，进度: {progress}，{interval}s 后重试...")
            time.sleep(interval)

    raise TimeoutError(f"任务 {task_id} 在 {timeout}s 内未完成")

video_url = poll_task("YOUR_TASK_ID")
print(f"视频已生成：{video_url}")`} />
                </TabPane>
              </Tabs>
            </div>

            {/* Task status explanation */}
            <div>
              <Text strong className='block mb-3'>任务状态说明</Text>
              <div className='overflow-x-auto rounded-lg' style={{ border: '1px solid var(--semi-color-border)' }}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr style={{ background: 'var(--semi-color-fill-1)' }}>
                      <th className='text-left px-4 py-3 font-medium'>data.status</th>
                      <th className='text-left px-4 py-3 font-medium'>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { status: 'QUEUED', desc: '任务已提交，排队等待处理' },
                      { status: 'IN_PROGRESS', desc: '视频生成中，请继续轮询（建议间隔 10 秒）' },
                      { status: 'SUCCESS', desc: '生成成功，视频下载地址在 data.result_url 中（有效期 24 小时）' },
                      { status: 'FAILURE', desc: '生成失败，失败原因在 data.fail_reason 中' },
                    ].map((row, i) => (
                      <tr key={row.status} style={{ borderTop: '1px solid var(--semi-color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--semi-color-fill-0)' }}>
                        <td className='px-4 py-3 font-mono text-xs' style={{ color: 'var(--semi-color-primary)' }}>{row.status}</td>
                        <td className='px-4 py-3' style={{ color: 'var(--semi-color-text-1)' }}>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Parameters table */}
            <div>
              <Text strong className='block mb-3'>请求参数说明</Text>
              <div className='overflow-x-auto rounded-lg' style={{ border: '1px solid var(--semi-color-border)' }}>
                <table className='w-full text-sm'>
                  <thead>
                    <tr style={{ background: 'var(--semi-color-fill-1)' }}>
                      <th className='text-left px-4 py-3 font-medium'>参数</th>
                      <th className='text-left px-4 py-3 font-medium'>类型</th>
                      <th className='text-left px-4 py-3 font-medium'>说明</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { param: 'model', type: 'string', desc: '模型名称：doubao-seedance-2-0-260128（标准版）或 doubao-seedance-2-0-fast-260128（快速版）' },
                      { param: 'content', type: 'array', desc: '多模态素材数组（必填）。元素类型：text（提示词文本）、image_url（参考图片）、video_url（参考视频）、audio_url（参考音频），图片/视频/音频元素需附带 role 字段标明用途' },
                      { param: 'duration', type: 'number', desc: '视频时长（秒），默认 8，支持 4 ~ 15' },
                      { param: 'ratio', type: 'string', desc: '输出视频宽高比，默认 16:9，支持 9:16、1:1 等' },
                      { param: 'resolution', type: 'string', desc: '输出分辨率，默认 720p，可选 480p / 720p' },
                      { param: 'generate_audio', type: 'boolean', desc: '是否自动生成背景音效，默认 true' },
                      { param: 'watermark', type: 'boolean', desc: '是否添加水印，默认 false' },
                      { param: 'tools', type: 'array', desc: '附加工具，传入 [{"type":"web_search"}] 可开启联网搜索辅助创作' },
                      { param: 'callback_url', type: 'string', desc: '任务完成后的 Webhook 回调地址（可选）' },
                      { param: 'seed', type: 'integer', desc: '随机种子，固定后可复现相同风格的视频' },
                      { param: 'camera_fixed', type: 'boolean', desc: '是否固定镜头（无运镜），默认 false' },
                    ].map((row, i) => (
                      <tr key={row.param} style={{ borderTop: '1px solid var(--semi-color-border)', background: i % 2 === 0 ? 'transparent' : 'var(--semi-color-fill-0)' }}>
                        <td className='px-4 py-3 font-mono text-xs' style={{ color: 'var(--semi-color-primary)', whiteSpace: 'nowrap' }}>{row.param}</td>
                        <td className='px-4 py-3'><Tag size='small' color='blue'>{row.type}</Tag></td>
                        <td className='px-4 py-3' style={{ color: 'var(--semi-color-text-1)' }}>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tips */}
            <div>
              <Text strong className='block mb-3'>使用建议</Text>
              <div className='space-y-3'>
                {[
                  { q: '参考素材使用建议', a: '参考图片建议使用清晰的 JPG/PNG（≥ 720p），参考视频时长与目标视频时长相近效果更佳，参考音频长度应覆盖整段视频时长。' },
                  { q: '提示词技巧', a: '在 content 的 text 中用"图片1"、"视频1的构图"、"音频1作为背景音乐"等关键词引用素材，模型会按顺序匹配 content 数组中对应类型的素材。' },
                  { q: '生成时间', a: '快速版（fast）约 30~150 秒，标准版质量更高但等待时间更长，建议轮询间隔设为 10 秒，超时上限建议设为 10 分钟。' },
                  { q: '计费方式', a: '后扣费模式：任务提交时不预扣费，任务完成后按实际生成 token 数结算。无视频输入时单价更高，含视频输入时单价较低，请确保账户余额充足。' },
                ].map((item, i) => (
                  <div key={i} className='rounded-lg p-4' style={{ background: 'var(--semi-color-fill-0)', border: '1px solid var(--semi-color-border)' }}>
                    <Text strong className='block mb-1' style={{ color: 'var(--semi-color-primary)' }}>{item.q}</Text>
                    <Text type='tertiary'>{item.a}</Text>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </TabPane>

      </Tabs>
    </div>
  );
}
