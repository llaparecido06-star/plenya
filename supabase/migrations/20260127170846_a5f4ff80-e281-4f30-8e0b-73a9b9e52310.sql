-- Create table for manual menstruation entries
CREATE TABLE public.menstruation_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL,
  is_menstruating BOOLEAN NOT NULL DEFAULT true,
  emergency_contraception BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, log_date)
);

-- Enable RLS
ALTER TABLE public.menstruation_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own menstruation logs"
ON public.menstruation_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menstruation logs"
ON public.menstruation_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menstruation logs"
ON public.menstruation_logs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own menstruation logs"
ON public.menstruation_logs
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_menstruation_logs_updated_at
BEFORE UPDATE ON public.menstruation_logs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();