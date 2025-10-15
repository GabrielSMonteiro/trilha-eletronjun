-- Configure storage bucket with security constraints
-- Set allowed MIME types and file size limit for lesson-videos bucket
UPDATE storage.buckets
SET 
  allowed_mime_types = ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
  file_size_limit = 524288000  -- 500MB in bytes
WHERE id = 'lesson-videos';

-- Add storage policy to verify video file extensions on upload
CREATE POLICY "Verify video file extensions on upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-videos'
  AND has_role(auth.uid(), 'admin'::app_role)
  AND lower(storage.extension(name)) IN ('mp4', 'webm', 'ogg', 'mov')
);