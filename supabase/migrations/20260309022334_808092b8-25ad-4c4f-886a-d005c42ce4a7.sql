-- Tabela para registrar ondas de calor (hot flashes)
CREATE TABLE public.hot_flash_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  logged_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  intensity INTEGER NOT NULL DEFAULT 3 CHECK (intensity >= 1 AND intensity <= 5),
  duration_minutes INTEGER,
  trigger TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.hot_flash_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own hot flash logs" ON public.hot_flash_logs
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own hot flash logs" ON public.hot_flash_logs
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own hot flash logs" ON public.hot_flash_logs
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own hot flash logs" ON public.hot_flash_logs
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Tabela para checklist de exames da menopausa
CREATE TABLE public.menopause_exams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  exam_type TEXT NOT NULL,
  exam_name TEXT NOT NULL,
  description TEXT,
  recommended_frequency TEXT,
  last_done_at DATE,
  next_due_at DATE,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.menopause_exams ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own menopause exams" ON public.menopause_exams
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
  
CREATE POLICY "Users can insert own menopause exams" ON public.menopause_exams
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can update own menopause exams" ON public.menopause_exams
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY "Users can delete own menopause exams" ON public.menopause_exams
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Adicionar campos de TRH ao perfil
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS hrt_type TEXT,
  ADD COLUMN IF NOT EXISTS hrt_start_date DATE,
  ADD COLUMN IF NOT EXISTS hrt_frequency_days INTEGER,
  ADD COLUMN IF NOT EXISTS hrt_last_taken DATE;