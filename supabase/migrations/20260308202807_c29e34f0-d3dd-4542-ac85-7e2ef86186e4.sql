
-- Kick counter logs
CREATE TABLE public.kick_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  kick_count INTEGER NOT NULL DEFAULT 0,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.kick_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own kick logs" ON public.kick_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own kick logs" ON public.kick_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own kick logs" ON public.kick_logs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own kick logs" ON public.kick_logs FOR DELETE USING (auth.uid() = user_id);

-- Pregnancy diary entries
CREATE TABLE public.pregnancy_diary (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  week_number INTEGER,
  weight NUMERIC,
  belly_photo_url TEXT,
  mood INTEGER,
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own pregnancy diary" ON public.pregnancy_diary FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own pregnancy diary" ON public.pregnancy_diary FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own pregnancy diary" ON public.pregnancy_diary FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own pregnancy diary" ON public.pregnancy_diary FOR DELETE USING (auth.uid() = user_id);

-- Appointment checklist
CREATE TABLE public.pregnancy_appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  trimester INTEGER NOT NULL DEFAULT 1,
  recommended_week INTEGER,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  appointment_date DATE,
  notes TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.pregnancy_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own appointments" ON public.pregnancy_appointments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own appointments" ON public.pregnancy_appointments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own appointments" ON public.pregnancy_appointments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own appointments" ON public.pregnancy_appointments FOR DELETE USING (auth.uid() = user_id);
