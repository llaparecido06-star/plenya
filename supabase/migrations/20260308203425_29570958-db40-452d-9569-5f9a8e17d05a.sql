-- Create belly-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('belly-photos', 'belly-photos', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for belly-photos bucket
CREATE POLICY "Users can upload own belly photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'belly-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can view own belly photos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'belly-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own belly photos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'belly-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can update own belly photos"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'belly-photos' AND (storage.foldername(name))[1] = auth.uid()::text);