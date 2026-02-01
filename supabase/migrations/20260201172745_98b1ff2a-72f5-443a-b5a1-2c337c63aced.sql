-- Make avatars bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'avatars';

-- Drop old public SELECT policy
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;

-- Create new SELECT policy for authenticated users to view any avatar
-- This is needed since avatars are typically shown in UI to other users
CREATE POLICY "Authenticated users can view avatars"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');