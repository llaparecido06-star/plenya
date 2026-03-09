CREATE TABLE public.cycle_diary (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  cycle_day integer,
  cycle_phase text,
  content text NOT NULL,
  ai_analysis text,
  sentiment text,
  tags text[] DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

ALTER TABLE public.cycle_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own diary" ON public.cycle_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own diary" ON public.cycle_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own diary" ON public.cycle_diary FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own diary" ON public.cycle_diary FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_cycle_diary_updated_at BEFORE UPDATE ON public.cycle_diary FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();