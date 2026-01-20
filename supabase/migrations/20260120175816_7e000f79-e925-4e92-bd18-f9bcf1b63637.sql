-- Drop and recreate the UPDATE policy with proper WITH CHECK clause
DROP POLICY IF EXISTS "Users can update own logs" ON public.daily_logs;

CREATE POLICY "Users can update own logs" 
ON public.daily_logs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);