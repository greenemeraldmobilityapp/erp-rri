-- Add escalation_hours to site_settings
INSERT INTO site_settings (key, value) 
VALUES ('escalation_hours', '24')
ON CONFLICT (key) DO UPDATE SET value = '24';
