-- AI Agents History Tables
-- Migration: 0004_ai_agents_history
-- Created: 2026-05-23

-- Table: ai_nego_history
-- NegoAgent stores negotiation analysis results
CREATE TABLE IF NOT EXISTS ai_nego_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quotation_id UUID REFERENCES quotation(id) ON DELETE SET NULL,
  user_id UUID NOT NULL,
  barang_id UUID REFERENCES barang(id) ON DELETE SET NULL,
  prompt JSONB NOT NULL,
  response JSONB NOT NULL,
  reasoning_chain TEXT,
  harga_dimintaan BIGINT,
  harga_counter BIGINT,
  margin_percent NUMERIC(5,2),
  recommendation TEXT CHECK (recommendation IN ('ACCEPT', 'COUNTER', 'REJECT')),
  approval_level TEXT CHECK (approval_level IN ('sales', 'manager', 'owner')),
  risk_score NUMERIC(3,1),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_nego_history_user_id ON ai_nego_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_nego_history_created_at ON ai_nego_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_nego_history_quotation_id ON ai_nego_history(quotation_id);

-- Table: ai_data_history
-- DataAgent stores all data analysis results (price recommendations, classifications, etc.)
CREATE TABLE IF NOT EXISTS ai_data_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT DEFAULT 'data-agent',
  user_id UUID NOT NULL,
  task_type TEXT NOT NULL,
  prompt JSONB NOT NULL,
  response JSONB NOT NULL,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_data_history_user_id ON ai_data_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_data_history_task_type ON ai_data_history(task_type);
CREATE INDEX IF NOT EXISTS idx_ai_data_history_created_at ON ai_data_history(created_at DESC);

-- Table: ai_vision_history
-- VisionAgent stores document OCR/parsing results
CREATE TABLE IF NOT EXISTS ai_vision_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_type TEXT DEFAULT 'vision-agent',
  user_id UUID NOT NULL,
  file_name TEXT,
  file_url TEXT,
  source_type TEXT CHECK (source_type IN ('kontrak', 'receipt', 'delivery', 'invoice', 'pdf', 'image')),
  extracted_data JSONB NOT NULL,
  confidence_score NUMERIC(3,2),
  model_used TEXT,
  tokens_used INTEGER,
  latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_vision_history_user_id ON ai_vision_history(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_vision_history_source_type ON ai_vision_history(source_type);
CREATE INDEX IF NOT EXISTS idx_ai_vision_history_created_at ON ai_vision_history(created_at DESC);

-- Table: ai_automation_log
-- Tracks all automation triggers and their results
CREATE TABLE IF NOT EXISTS ai_automation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trigger_type TEXT NOT NULL,
  trigger_payload JSONB NOT NULL,
  agent_type TEXT NOT NULL,
  result JSONB,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  executed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_automation_log_trigger_type ON ai_automation_log(trigger_type);
CREATE INDEX IF NOT EXISTS idx_ai_automation_log_executed_at ON ai_automation_log(executed_at DESC);

-- RLS Policies (Row Level Security)

ALTER TABLE ai_nego_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_data_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_vision_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_automation_log ENABLE ROW LEVEL SECURITY;

-- Users can only see their own AI history
CREATE POLICY "Users can view own nego history" ON ai_nego_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nego history" ON ai_nego_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own data history" ON ai_data_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own data history" ON ai_data_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own vision history" ON ai_vision_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vision history" ON ai_vision_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Automation logs: owner/admin can see all, users see their own
CREATE POLICY "Users can view own automation logs" ON ai_automation_log
  FOR SELECT USING (auth.uid() = executed_by);

CREATE POLICY "Service role can insert automation logs" ON ai_automation_log
  FOR INSERT WITH CHECK (true);

COMMENT ON TABLE ai_nego_history IS 'Stores NegoAgent negotiation analysis results with margin, approval level, and reasoning chain';
COMMENT ON TABLE ai_data_history IS 'Stores DataAgent analysis results including price recommendations, invoice classification, report summaries';
COMMENT ON TABLE ai_vision_history IS 'Stores VisionAgent document extraction results with confidence scores and model metadata';
COMMENT ON TABLE ai_automation_log IS 'Audit trail for all AI-triggered automation events';