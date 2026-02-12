
-- Add trial reminder columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_reminder_sent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS trial_end_date timestamptz DEFAULT null;
