-- Add medication columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS medication_name TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS medication_type TEXT DEFAULT NULL;