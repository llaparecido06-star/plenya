-- Add new columns to profiles table for life cycle management
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS date_of_birth date,
ADD COLUMN IF NOT EXISTS life_phase text DEFAULT 'menstruating' CHECK (life_phase IN ('menstruating', 'pregnant', 'menopause')),
ADD COLUMN IF NOT EXISTS pregnancy_start_date date,
ADD COLUMN IF NOT EXISTS is_trying_to_conceive boolean DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.life_phase IS 'Current biological phase: menstruating, pregnant, or menopause';
COMMENT ON COLUMN public.profiles.pregnancy_start_date IS 'First day of last menstrual period for pregnancy tracking (DUM)';
COMMENT ON COLUMN public.profiles.is_trying_to_conceive IS 'Whether user is actively trying to conceive';