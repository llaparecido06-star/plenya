-- Create contraceptive_history table to track changes over time
CREATE TABLE public.contraceptive_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  contraceptive_type text NOT NULL,
  contraceptive_brand text,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contraceptive_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own contraceptive history"
  ON public.contraceptive_history
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contraceptive history"
  ON public.contraceptive_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contraceptive history"
  ON public.contraceptive_history
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own contraceptive history"
  ON public.contraceptive_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_contraceptive_history_user_id ON public.contraceptive_history(user_id);
CREATE INDEX idx_contraceptive_history_start_date ON public.contraceptive_history(start_date DESC);