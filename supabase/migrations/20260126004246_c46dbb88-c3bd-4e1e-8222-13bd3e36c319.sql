-- Add contraceptive_details JSONB column to profiles for flexible storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contraceptive_details jsonb DEFAULT '{}'::jsonb;

-- Add comment explaining the structure
COMMENT ON COLUMN public.profiles.contraceptive_details IS 'Flexible storage for contraceptive details: {brand, reminderTime, lastApplicationDate, frequency, insertionDate, changeDay, usageCycle}';