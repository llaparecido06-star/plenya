-- Create monthly_reports table to store generated AI reports
CREATE TABLE IF NOT EXISTS public.monthly_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  report_date DATE NOT NULL,
  cycle_start_date DATE NOT NULL,
  cycle_end_date DATE NOT NULL,
  
  -- Report data
  wellness_score INTEGER NOT NULL CHECK (wellness_score >= 0 AND wellness_score <= 100),
  summary TEXT NOT NULL,
  patterns TEXT[] NOT NULL DEFAULT '{}',
  correlations TEXT[] NOT NULL DEFAULT '{}',
  recommendations TEXT[] NOT NULL DEFAULT '{}',
  next_cycle_tip TEXT,
  
  -- Cycle metrics used to generate report
  avg_mood NUMERIC(3,1),
  avg_energy NUMERIC(3,1),
  avg_stress NUMERIC(3,1),
  top_symptoms TEXT[] DEFAULT '{}',
  total_logs INTEGER DEFAULT 0,
  period_days INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  CONSTRAINT monthly_reports_user_date_unique UNIQUE (user_id, report_date)
);

-- Enable RLS
ALTER TABLE public.monthly_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own monthly reports"
  ON public.monthly_reports
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own monthly reports"
  ON public.monthly_reports
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own monthly reports"
  ON public.monthly_reports
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own monthly reports"
  ON public.monthly_reports
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_monthly_reports_user_date ON public.monthly_reports(user_id, report_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_monthly_reports_updated_at
  BEFORE UPDATE ON public.monthly_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();