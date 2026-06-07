// Provider abstraction — unified call interface for all supported LLMs

export type Provider = 'anthropic' | 'openai' | 'google' | 'moonshot' | 'xai'

export interface ProviderConfig {
  provider: Provider
  apiKey: string
  model?: string
}

export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  google: 'gemini-1.5-pro',
  moonshot: 'moonshot-v1-8k',
  xai: 'grok-2-1212',
}

export const PROVIDER_LABELS: Record<Provider, string> = {
  anthropic: 'Anthropic Claude',
  openai: 'OpenAI',
  google: 'Google Gemini',
  moonshot: 'Moonshot (Kimi)',
  xai: 'xAI Grok',
}

export const PROVIDER_KEY_LINKS: Record<Provider, string> = {
  anthropic: 'https://console.anthropic.com/settings/keys',
  openai: 'https://platform.openai.com/api-keys',
  google: 'https://aistudio.google.com/app/apikey',
  moonshot: 'https://platform.moonshot.cn/console/api-keys',
  xai: 'https://console.x.ai/',
}

export async function callProvider(
  config: ProviderConfig,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const model = config.model ?? DEFAULT_MODELS[config.provider]

  switch (config.provider) {
    case 'anthropic':
      return callAnthropic(config.apiKey, model, systemPrompt, userMessage)
    case 'openai':
      return callOpenAI(config.apiKey, model, systemPrompt, userMessage)
    case 'google':
      return callGoogle(config.apiKey, model, systemPrompt, userMessage)
    case 'moonshot':
      return callMoonshot(config.apiKey, model, systemPrompt, userMessage)
    case 'xai':
      return callXAI(config.apiKey, model, systemPrompt, userMessage)
    default:
      throw new Error(`Unknown provider: ${config.provider}`)
  }
}

async function callAnthropic(
  apiKey: string, model: string, system: string, user: string
): Promise<string> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey })
  const msg = await client.messages.create({
    model,
    max_tokens: 2048,
    system,
    messages: [{ role: 'user', content: user }],
  })
  const block = msg.content[0]
  if (block.type !== 'text') throw new Error('Unexpected response type from Anthropic')
  return block.text
}

async function callOpenAI(
  apiKey: string, model: string, system: string, user: string
): Promise<string> {
  const OpenAI = (await import('openai')).default
  const client = new OpenAI({ apiKey })
  const res = await client.chat.completions.create({
    model,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    max_tokens: 2048,
  })
  return res.choices[0]?.message?.content ?? ''
}

async function callGoogle(
  apiKey: string, model: string, system: string, user: string
): Promise<string> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai')
  const genAI = new GoogleGenerativeAI(apiKey)
  const genModel = genAI.getGenerativeModel({
    model,
    systemInstruction: system,
  })
  const result = await genModel.generateContent(user)
  return result.response.text()
}

async function callMoonshot(
  apiKey: string, model: string, system: string, user: string
): Promise<string> {
  const res = await fetch('https://api.moonshot.cn/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 2048,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}

async function callXAI(
  apiKey: string, model: string, system: string, user: string
): Promise<string> {
  const res = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
      max_tokens: 2048,
    }),
  })
  const data = await res.json()
  return data.choices?.[0]?.message?.content ?? ''
}
