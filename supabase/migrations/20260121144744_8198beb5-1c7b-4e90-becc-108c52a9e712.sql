-- Create intimacy_logs table for intimate wellness tracking
CREATE TABLE public.intimacy_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  libido INTEGER CHECK (libido >= 1 AND libido <= 4),
  fluid_type TEXT,
  sensation_emotional TEXT[] DEFAULT '{}',
  sensation_physical TEXT[] DEFAULT '{}',
  symptoms TEXT[] DEFAULT '{}',
  activity_type TEXT CHECK (activity_type IN ('solo', 'partner', NULL)),
  is_protected BOOLEAN,
  pleasure_rating INTEGER CHECK (pleasure_rating >= 1 AND pleasure_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Enable Row Level Security
ALTER TABLE public.intimacy_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own intimacy logs"
ON public.intimacy_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own intimacy logs"
ON public.intimacy_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own intimacy logs"
ON public.intimacy_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own intimacy logs"
ON public.intimacy_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_intimacy_logs_updated_at
BEFORE UPDATE ON public.intimacy_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add columns to profiles for onboarding data
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS goal TEXT,
ADD COLUMN IF NOT EXISTS diet_type TEXT,
ADD COLUMN IF NOT EXISTS fitness_level TEXT;