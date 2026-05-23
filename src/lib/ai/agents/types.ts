export interface AgentResponse {
  id: string
  agent_type: AgentType
  user_id: string
  prompt: string
  response: string
  reasoning_chain?: string
  tokens_used?: number
  latency_ms?: number
  created_at: string
}

export type AgentType = 'NEGO_AGENT' | 'DATA_AGENT' | 'VISION_AGENT'

export interface AgentContext {
  user_id: string
  user_role?: 'sales' | 'manager' | 'owner' | 'admin'
  timestamp: string
  session_id?: string
}

export interface AgentTask<T = unknown> {
  id: string
  agent_type: AgentType
  context: AgentContext
  input: T
  system_prompt?: string
}

export interface StreamingChunk {
  reasoning_content?: string
  content?: string
  done?: boolean
}

export interface TriggerPayload {
  type: TriggerType
  payload: unknown
  timestamp: string
  user_id: string
}

export type TriggerType =
  | 'INVOICE_CREATED'
  | 'INVOICE_OVERDUE'
  | 'QUOTATION_CREATED'
  | 'PR_SUBMITTED'
  | 'GRN_CREATED'
  | 'CONTRACT_NEARING_EXPIRY'
  | 'AR_OVERDUE_30'
  | 'MANUAL_TRIGGER'

export interface WorkflowResult {
  success: boolean
  message: string
  data?: unknown
  next_trigger?: TriggerType
}

export interface ParsedDocument {
  extracted: Record<string, unknown>
  confidence: number
  warnings: string[]
  source_file?: string
}