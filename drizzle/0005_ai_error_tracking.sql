-- AI Agent Error Tracking Migration
-- Adds status and error_message columns to agent history tables

ALTER TABLE ai_nego_history
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE ai_data_history
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

ALTER TABLE ai_vision_history
  ADD COLUMN IF NOT EXISTS status TEXT,
  ADD COLUMN IF NOT EXISTS error_message TEXT;

CREATE INDEX IF NOT EXISTS idx_ai_data_history_status ON ai_data_history(status);
CREATE INDEX IF NOT EXISTS idx_ai_vision_history_status ON ai_vision_history(status);
CREATE INDEX IF NOT EXISTS idx_ai_nego_history_status ON ai_nego_history(status);
