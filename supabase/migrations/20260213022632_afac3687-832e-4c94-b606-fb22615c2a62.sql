ALTER TABLE public.profiles ADD COLUMN medication_last_taken date DEFAULT NULL;
ALTER TABLE public.profiles ADD COLUMN medication_frequency_days integer DEFAULT NULL;