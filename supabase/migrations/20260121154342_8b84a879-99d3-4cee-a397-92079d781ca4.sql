-- Add tutorial_progress JSONB column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tutorial_progress JSONB DEFAULT '{"home": false, "nutrition": false, "body": false, "mind": false}'::jsonb;

-- Create function to update a specific tutorial key
CREATE OR REPLACE FUNCTION public.complete_tutorial(tutorial_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET tutorial_progress = jsonb_set(
    COALESCE(tutorial_progress, '{"home": false, "nutrition": false, "body": false, "mind": false}'::jsonb),
    ARRAY[tutorial_key],
    'true'::jsonb
  )
  WHERE user_id = auth.uid();
END;
$$;