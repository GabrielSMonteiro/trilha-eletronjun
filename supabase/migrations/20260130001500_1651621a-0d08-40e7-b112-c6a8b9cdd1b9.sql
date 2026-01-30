-- Criar bucket para imagens de background do login
INSERT INTO storage.buckets (id, name, public)
VALUES ('auth-backgrounds', 'auth-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir que qualquer um veja as imagens (são públicas)
CREATE POLICY "Public can view auth backgrounds"
ON storage.objects FOR SELECT
USING (bucket_id = 'auth-backgrounds');

-- Política para que admins possam fazer upload
CREATE POLICY "Admins can upload auth backgrounds"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'auth-backgrounds' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Política para que admins possam deletar
CREATE POLICY "Admins can delete auth backgrounds"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'auth-backgrounds' 
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);

-- Corrigir política de categories para permitir delete por admins
DROP POLICY IF EXISTS "Admins can manage categories" ON public.categories;
CREATE POLICY "Admins can manage categories"
ON public.categories FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));