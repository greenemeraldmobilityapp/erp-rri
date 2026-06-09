ALTER TABLE quotation ADD COLUMN IF NOT EXISTS email_access_token text;
ALTER TABLE quotation ADD COLUMN IF NOT EXISTS email_access_token_expires_at timestamp;
