
CREATE TABLE public.alert_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  alert_title text NOT NULL,
  alert_body text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.alert_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alert logs" ON public.alert_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Service role can insert alert logs" ON public.alert_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_alert_logs_user_date ON public.alert_logs (user_id, created_at DESC);
