import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export type ProviderName = 'deepseek' | 'openai' | 'kimi' | 'qwen' | 'anthropic' | 'mock'

interface OpenAIProviderConfig {
  type: 'openai-compatible'
  baseURL: string
  defaultModel: string
  apiKeyEnv: string
}

interface AnthropicProviderConfig {
  type: 'anthropic'
  defaultModel: string
  apiKeyEnv: string
}

interface MockProviderConfig {
  type: 'mock'
}

type ProviderConfig = OpenAIProviderConfig | AnthropicProviderConfig | MockProviderConfig

const providerRegistry: Record<ProviderName, ProviderConfig> = {
  deepseek: {
    type: 'openai-compatible',
    baseURL: 'https://api.deepseek.com',
    defaultModel: 'deepseek-chat',
    apiKeyEnv: 'DEEPSEEK_API_KEY',
  },
  openai: {
    type: 'openai-compatible',
    baseURL: 'https://api.openai.com/v1',
    defaultModel: 'gpt-4o-mini',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  kimi: {
    type: 'openai-compatible',
    baseURL: 'https://api.moonshot.cn/v1',
    defaultModel: 'moonshot-v1-8k',
    apiKeyEnv: 'KIMI_API_KEY',
  },
  qwen: {
    type: 'openai-compatible',
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    defaultModel: 'qwen-plus',
    apiKeyEnv: 'QWEN_API_KEY',
  },
  anthropic: {
    type: 'anthropic',
    defaultModel: 'claude-sonnet-4-20250514',
    apiKeyEnv: 'ANTHROPIC_API_KEY',
  },
  mock: {
    type: 'mock',
  },
}

export interface ResolvedProvider {
  name: ProviderName
  model: string
  config: ProviderConfig
}

export function resolveProvider(): ResolvedProvider {
  const providerName = (process.env.AI_PROVIDER || 'deepseek') as ProviderName
  const config = providerRegistry[providerName]

  if (!config) {
    console.warn(`Unknown AI_PROVIDER "${providerName}", falling back to mock`)
    return { name: 'mock', model: '', config: providerRegistry.mock }
  }

  // Auto-fallback to mock if API key is missing
  if (config.type !== 'mock') {
    const apiKey = process.env[config.apiKeyEnv]
    if (!apiKey) {
      console.warn(`${config.apiKeyEnv} not set, falling back to mock provider`)
      return { name: 'mock', model: '', config: providerRegistry.mock }
    }
  }

  const model = config.type === 'mock'
    ? ''
    : process.env.AI_MODEL || config.defaultModel

  return { name: providerName, model, config }
}

export function createOpenAIClient(config: OpenAIProviderConfig): OpenAI {
  return new OpenAI({
    apiKey: process.env[config.apiKeyEnv],
    baseURL: config.baseURL,
  })
}

export function createAnthropicClient(): Anthropic {
  return new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  })
}
