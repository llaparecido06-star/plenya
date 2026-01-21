-- Add contraceptive tracking columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS contraceptive_type TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contraceptive_brand TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS contraceptive_start_date DATE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS pill_reminder_time TIME DEFAULT NULL;

-- Create table for daily pill tracking
CREATE TABLE IF NOT EXISTS public.pill_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  taken_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  skipped BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS
ALTER TABLE public.pill_logs ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own pill logs" 
ON public.pill_logs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own pill logs" 
ON public.pill_logs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own pill logs" 
ON public.pill_logs 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own pill logs" 
ON public.pill_logs 
FOR DELETE 
USING (auth.uid() = user_id);