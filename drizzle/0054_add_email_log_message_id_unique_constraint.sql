-- Migration: 0054_add_email_log_message_id_unique_constraint
-- Purpose: Add unique constraint on email_log.message_id for idempotent inbound email handling
-- When duplicate messageId arrives (Brevo retry + Cloudflare retry), we can use ON CONFLICT
-- Only applies WHERE message_id IS NOT NULL (inbound emails have message_id from email header)

-- Create unique index (safe for existing data - ignores nulls)
CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS idx_email_log_message_id_unique
ON email_log(message_id)
WHERE message_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON INDEX idx_email_log_message_id_unique IS 'Unique constraint on message_id for inbound emails only. Null message_ids (outbound emails from Brevo) are excluded.';