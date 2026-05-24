import { pgTable, uuid, text, jsonb, numeric, integer, timestamp } from 'drizzle-orm/pg-core'

export const aiVisionHistory = pgTable('ai_vision_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentType: text('agent_type').default('vision-agent'),
  userId: uuid('user_id').notNull(),
  fileName: text('file_name'),
  fileUrl: text('file_url'),
  sourceType: text('source_type'),
  extractedData: jsonb('extracted_data').notNull(),
  confidenceScore: numeric('confidence_score', { precision: 3, scale: 2 }),
  modelUsed: text('model_used'),
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),
  status: text('status'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
