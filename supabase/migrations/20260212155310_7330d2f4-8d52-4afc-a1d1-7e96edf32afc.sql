
-- Add customizable macro goals to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS macro_protein_goal integer DEFAULT 120,
ADD COLUMN IF NOT EXISTS macro_carbs_goal integer DEFAULT 250,
ADD COLUMN IF NOT EXISTS macro_fat_goal integer DEFAULT 70,
ADD COLUMN IF NOT EXISTS macro_calories_goal integer DEFAULT 2000;
