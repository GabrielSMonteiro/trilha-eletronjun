-- Create table for auth background carousel images
CREATE TABLE public.auth_background_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.auth_background_images ENABLE ROW LEVEL SECURITY;

-- Everyone can view active images (for the carousel on login page)
CREATE POLICY "Anyone can view active background images"
ON public.auth_background_images
FOR SELECT
USING (is_active = true);

-- Only admins can manage images (using correct parameter order)
CREATE POLICY "Admins can manage background images"
ON public.auth_background_images
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_auth_background_images_updated_at
BEFORE UPDATE ON public.auth_background_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();