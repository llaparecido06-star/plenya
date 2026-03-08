-- Create menopause diary table
CREATE TABLE IF NOT EXISTS public.menopause_diary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood INTEGER CHECK (mood >= 1 AND mood <= 5),
  weight NUMERIC(5, 1),
  symptoms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, entry_date)
);

-- Enable RLS
ALTER TABLE public.menopause_diary ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view own menopause diary"
ON public.menopause_diary FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own menopause diary"
ON public.menopause_diary FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own menopause diary"
ON public.menopause_diary FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own menopause diary"
ON public.menopause_diary FOR DELETE
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_menopause_diary_updated_at
BEFORE UPDATE ON public.menopause_diary
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();