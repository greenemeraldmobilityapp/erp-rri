import { OpenAI } from 'openai'

export const NVIDIA_BASE_URL = 'https://integrate.api.nvidia.com/v1'
export const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY ?? ''

export const AI_MODELS = {
  NEGO_AGENT: process.env.NVIDIA_MODEL_NEGO ?? 'stepfun-ai/step-3.5-flash',
  DATA_AGENT: process.env.NVIDIA_MODEL_DATA ?? 'minimaxai/minimax-m2.7',
  VISION_AGENT: process.env.NVIDIA_MODEL_VISION ?? 'microsoft/phi-4-multimodal-instruct',
} as const

export type AgentType = keyof typeof AI_MODELS

export function createNvidiaClient(apiKey?: string) {
  return new OpenAI({
    baseURL: NVIDIA_BASE_URL,
    apiKey: apiKey ?? NVIDIA_API_KEY,
  })
}

export const defaultClient = createNvidiaClient()

export interface ModelParams {
  temperature?: number
  top_p?: number
  max_tokens?: number
  stream?: boolean
}

export const MODEL_CONFIGS: Record<AgentType, ModelParams> = {
  NEGO_AGENT: {
    temperature: 1,
    top_p: 0.9,
    max_tokens: 16384,
    stream: true,
  },
  DATA_AGENT: {
    temperature: 1,
    top_p: 0.95,
    max_tokens: 8192,
    stream: true,
  },
  VISION_AGENT: {
    temperature: 0.10,
    top_p: 0.70,
    max_tokens: 512,
    stream: false,
  },
}