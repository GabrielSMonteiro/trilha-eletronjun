-- Corrigir apenas a tabela questions para ocultar respostas corretas

-- Primeiro, removemos as políticas existentes da tabela questions
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

-- Criar política que permite usuários verem questões
CREATE POLICY "Users can view questions" 
ON public.questions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

-- Política para admins gerenciarem questões (criar, editar, deletar)
CREATE POLICY "Admins can manage questions" 
ON public.questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);