ALTER TABLE email_log ADD COLUMN IF NOT EXISTS thread_id text;

CREATE INDEX IF NOT EXISTS idx_email_log_thread_id ON email_log (thread_id);

-- Update existing records: assign a unique UUID per email as thread_id if null
UPDATE email_log SET thread_id = gen_random_uuid()::text WHERE thread_id IS NULL;
