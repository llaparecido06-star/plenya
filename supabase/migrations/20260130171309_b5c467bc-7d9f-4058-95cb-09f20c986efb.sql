-- Replace complete_tutorial function with input validation
CREATE OR REPLACE FUNCTION public.complete_tutorial(tutorial_key TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate tutorial_key against allowed values
  IF tutorial_key NOT IN ('home', 'nutrition', 'body', 'mind') THEN
    RAISE EXCEPTION 'Invalid tutorial_key: %. Must be one of: home, nutrition, body, mind', tutorial_key;
  END IF;
  
  UPDATE public.profiles
  SET tutorial_progress = jsonb_set(
    COALESCE(tutorial_progress, '{"home": false, "nutrition": false, "body": false, "mind": false}'::jsonb),
    ARRAY[tutorial_key],
    'true'::jsonb
  )
  WHERE user_id = auth.uid();
END;
$$;