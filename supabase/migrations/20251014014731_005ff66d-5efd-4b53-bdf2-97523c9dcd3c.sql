-- Create storage bucket for lesson videos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('lesson-videos', 'lesson-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload videos
CREATE POLICY "Admins can upload lesson videos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'lesson-videos' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Allow everyone to view videos
CREATE POLICY "Anyone can view lesson videos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'lesson-videos');

-- Allow admins to delete videos
CREATE POLICY "Admins can delete lesson videos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'lesson-videos' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);

-- Allow admins to update videos
CREATE POLICY "Admins can update lesson videos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'lesson-videos' AND
  (SELECT has_role(auth.uid(), 'admin'::app_role))
);