import { pgTable, uuid, text, jsonb, integer, timestamp } from 'drizzle-orm/pg-core'

export const aiDataHistory = pgTable('ai_data_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  agentType: text('agent_type').default('data-agent'),
  userId: uuid('user_id').notNull(),
  taskType: text('task_type').notNull(),
  prompt: jsonb('prompt').notNull(),
  response: jsonb('response').notNull(),
  tokensUsed: integer('tokens_used'),
  latencyMs: integer('latency_ms'),
  status: text('status'),
  errorMessage: text('error_message'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
