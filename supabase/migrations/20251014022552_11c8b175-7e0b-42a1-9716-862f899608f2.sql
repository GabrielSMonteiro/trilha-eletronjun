-- Make lesson-videos bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'lesson-videos';

-- Drop existing public access policy if it exists
DROP POLICY IF EXISTS "Anyone can view lesson videos" ON storage.objects;

-- Add authenticated-only access policy for lesson videos
CREATE POLICY "Authenticated users can view lesson videos"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'lesson-videos');

-- Drop existing admin upload policy if exists and recreate
DROP POLICY IF EXISTS "Admins can upload lesson videos" ON storage.objects;
CREATE POLICY "Admins can upload lesson videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-videos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- Drop existing admin delete policy if exists and recreate
DROP POLICY IF EXISTS "Admins can delete lesson videos" ON storage.objects;
CREATE POLICY "Admins can delete lesson videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-videos' 
  AND has_role(auth.uid(), 'admin'::app_role)
);