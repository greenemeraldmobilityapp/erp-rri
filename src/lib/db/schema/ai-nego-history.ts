import { pgTable, uuid, text, jsonb, integer, numeric, timestamp } from 'drizzle-orm/pg-core'

export const aiNegoHistory = pgTable('ai_nego_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  quotationId: uuid('quotation_id'),
  userId: uuid('user_id').notNull(),
  barangId: uuid('barang_id'),
  prompt: jsonb('prompt').notNull(),
  response: jsonb('response').notNull(),
  reasoningChain: text('reasoning_chain'),
  hargaDimintaan: integer('harga_dimintaan'),
  hargaCounter: integer('harga_counter'),
  marginPercent: numeric('margin_percent', { precision: 5, scale: 2 }),
  recommendation: text('recommendation'),
  approvalLevel: text('approval_level'),
  riskScore: numeric('risk_score', { precision: 3, scale: 1 }),
  status: text('status'),
  errorMessage: text('error_message'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
})
