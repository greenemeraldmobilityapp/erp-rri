import { pgTable, uuid, text, jsonb, boolean, timestamp } from 'drizzle-orm/pg-core'

export const aiAutomationLog = pgTable('ai_automation_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  triggerType: text('trigger_type').notNull(),
  triggerPayload: jsonb('trigger_payload').notNull(),
  agentType: text('agent_type').notNull(),
  result: jsonb('result'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  executedBy: uuid('executed_by'),
  executedAt: timestamp('executed_at', { withTimezone: true }).defaultNow(),
})
