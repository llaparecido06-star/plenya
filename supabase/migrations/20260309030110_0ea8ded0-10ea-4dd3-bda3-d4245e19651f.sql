
CREATE TABLE public.breastfeeding_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  feed_type text NOT NULL DEFAULT 'breast',
  side text,
  duration_minutes integer,
  quantity_ml integer,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.breastfeeding_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own breastfeeding logs" ON public.breastfeeding_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own breastfeeding logs" ON public.breastfeeding_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own breastfeeding logs" ON public.breastfeeding_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own breastfeeding logs" ON public.breastfeeding_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_breastfeeding_user_date ON public.breastfeeding_logs (user_id, log_date DESC);

CREATE TABLE public.postpartum_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  bleeding_level integer,
  pain_level integer,
  mood integer,
  sleep_hours numeric,
  stitches_healing text,
  notes text,
  first_period_returned boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.postpartum_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own postpartum logs" ON public.postpartum_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own postpartum logs" ON public.postpartum_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own postpartum logs" ON public.postpartum_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own postpartum logs" ON public.postpartum_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX idx_postpartum_user_date ON public.postpartum_logs (user_id, log_date DESC);
