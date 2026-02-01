-- Create login_streaks table to track user login activity
CREATE TABLE public.login_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  login_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, login_date)
);

-- Enable Row Level Security
ALTER TABLE public.login_streaks ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view own login streaks" 
ON public.login_streaks 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own login streaks" 
ON public.login_streaks 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own login streaks" 
ON public.login_streaks 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_login_streaks_user_date ON public.login_streaks(user_id, login_date DESC);