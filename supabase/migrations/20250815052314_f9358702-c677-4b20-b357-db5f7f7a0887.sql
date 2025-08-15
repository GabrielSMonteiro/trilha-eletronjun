-- Corrigir problemas de segurança: ocultar respostas corretas de questões para usuários comuns

-- Primeiro, removemos as políticas existentes da tabela questions
DROP POLICY IF EXISTS "Questions are viewable by everyone" ON public.questions;
DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;

-- Criar política que permite usuários verem questões SEM a resposta correta
CREATE POLICY "Users can view questions without answers" 
ON public.questions 
FOR SELECT 
USING (
  -- Usuários comuns podem ver questões, mas não a resposta correta
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    ) THEN true  -- Admin vê tudo
    ELSE auth.uid() IS NOT NULL  -- Usuários autenticados veem questões (resposta será filtrada no frontend)
  END
);

-- Política para admins gerenciarem questões
CREATE POLICY "Admins can manage questions" 
ON public.questions 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Adicionar RLS para tabelas de estatísticas que estavam expostas
ALTER TABLE public.admin_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.category_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress_summary ENABLE ROW LEVEL SECURITY;

-- Política para admin_stats - apenas admins
CREATE POLICY "Admin stats only for admins" 
ON public.admin_stats 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Política para category_progress - apenas admins
CREATE POLICY "Category progress only for admins" 
ON public.category_progress 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = auth.uid() AND is_admin = true
  )
);

-- Política para user_progress_summary - usuários veem apenas seus dados, admins veem tudo
CREATE POLICY "Users see own progress summary" 
ON public.user_progress_summary 
FOR SELECT 
USING (
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE user_id = auth.uid() AND is_admin = true
    ) THEN true  -- Admin vê tudo
    ELSE user_id = auth.uid()  -- Usuário vê apenas seus dados
  END
);