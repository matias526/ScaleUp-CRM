-- Add receive_daily_email field to users table
-- This field controls whether a user receives the daily pending tasks email

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS receive_daily_email boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.users.receive_daily_email IS 'Controls whether user receives daily pending tasks email';

-- Create index for efficient querying of users who should receive emails
CREATE INDEX IF NOT EXISTS idx_users_receive_daily_email 
ON public.users (receive_daily_email) 
WHERE receive_daily_email = true AND is_active = true;
