-- Create user_gamification table for XP, levels, and points
CREATE TABLE IF NOT EXISTS public.user_gamification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  total_points INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  badge_type TEXT NOT NULL, -- 'bronze', 'silver', 'gold', 'special'
  icon_name TEXT NOT NULL, -- lucide icon name
  requirement_type TEXT NOT NULL, -- 'lessons_completed', 'streak_days', 'perfect_scores', 'category_master'
  requirement_value INTEGER NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_badges table for tracking user achievements
CREATE TABLE IF NOT EXISTS public.user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create xp_transactions table for tracking XP history
CREATE TABLE IF NOT EXISTS public.xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'lesson_completed', 'perfect_score', 'streak_bonus', 'badge_earned'
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create leaderboard view by category
CREATE OR REPLACE VIEW public.leaderboard_by_category AS
SELECT 
  ug.user_id,
  p.display_name,
  p.avatar_url,
  ug.total_xp,
  ug.current_level,
  ug.total_points,
  c.id as category_id,
  c.name as category_name,
  COUNT(DISTINCT up.lesson_id) as lessons_completed,
  RANK() OVER (PARTITION BY c.id ORDER BY ug.total_xp DESC) as rank
FROM public.user_gamification ug
JOIN public.profiles p ON p.user_id = ug.user_id
CROSS JOIN public.categories c
LEFT JOIN public.user_progress up ON up.user_id = ug.user_id 
  AND up.completed_at IS NOT NULL
LEFT JOIN public.lessons l ON l.id = up.lesson_id AND l.category_id = c.id
GROUP BY ug.user_id, p.display_name, p.avatar_url, ug.total_xp, ug.current_level, ug.total_points, c.id, c.name;

-- Create global leaderboard view
CREATE OR REPLACE VIEW public.leaderboard_global AS
SELECT 
  ug.user_id,
  p.display_name,
  p.avatar_url,
  ug.total_xp,
  ug.current_level,
  ug.total_points,
  ug.current_streak,
  ug.longest_streak,
  COUNT(DISTINCT up.lesson_id) as lessons_completed,
  COUNT(DISTINCT ub.badge_id) as badges_earned,
  RANK() OVER (ORDER BY ug.total_xp DESC) as rank
FROM public.user_gamification ug
JOIN public.profiles p ON p.user_id = ug.user_id
LEFT JOIN public.user_progress up ON up.user_id = ug.user_id AND up.completed_at IS NOT NULL
LEFT JOIN public.user_badges ub ON ub.user_id = ug.user_id
GROUP BY ug.user_id, p.display_name, p.avatar_url, ug.total_xp, ug.current_level, ug.total_points, ug.current_streak, ug.longest_streak;

-- Enable RLS
ALTER TABLE public.user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_gamification
CREATE POLICY "Users can view their own gamification data"
ON public.user_gamification FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification data"
ON public.user_gamification FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification data"
ON public.user_gamification FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all gamification data"
ON public.user_gamification FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for badges
CREATE POLICY "Everyone can view badges"
ON public.badges FOR SELECT
USING (true);

CREATE POLICY "Admins can manage badges"
ON public.badges FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for user_badges
CREATE POLICY "Users can view their own badges"
ON public.user_badges FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own badges"
ON public.user_badges FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Everyone can view all user badges"
ON public.user_badges FOR SELECT
USING (true);

-- RLS Policies for xp_transactions
CREATE POLICY "Users can view their own xp transactions"
ON public.xp_transactions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own xp transactions"
ON public.xp_transactions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all xp transactions"
ON public.xp_transactions FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updating user_gamification updated_at
CREATE TRIGGER update_user_gamification_updated_at
BEFORE UPDATE ON public.user_gamification
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate level from XP
CREATE OR REPLACE FUNCTION public.calculate_level(xp INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Level formula: level = floor(sqrt(xp / 100)) + 1
  -- This means: Level 1 = 0-99 XP, Level 2 = 100-399 XP, Level 3 = 400-899 XP, etc.
  RETURN FLOOR(SQRT(xp / 100.0)) + 1;
END;
$$;

-- Function to calculate XP needed for next level
CREATE OR REPLACE FUNCTION public.xp_for_next_level(current_level INTEGER)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Inverse of level formula: xp = (level - 1)^2 * 100
  RETURN POWER(current_level, 2) * 100;
END;
$$;

-- Insert default badges
INSERT INTO public.badges (name, description, badge_type, icon_name, requirement_type, requirement_value) VALUES
  ('Primeiro Passo', 'Complete sua primeira lição', 'bronze', 'Award', 'lessons_completed', 1),
  ('Iniciante', 'Complete 5 lições', 'bronze', 'Medal', 'lessons_completed', 5),
  ('Aprendiz', 'Complete 10 lições', 'silver', 'Trophy', 'lessons_completed', 10),
  ('Dedicado', 'Complete 25 lições', 'silver', 'Star', 'lessons_completed', 25),
  ('Expert', 'Complete 50 lições', 'gold', 'Crown', 'lessons_completed', 50),
  ('Mestre', 'Complete 100 lições', 'gold', 'Gem', 'lessons_completed', 100),
  ('Consistente', 'Mantenha uma sequência de 3 dias', 'bronze', 'Flame', 'streak_days', 3),
  ('Persistente', 'Mantenha uma sequência de 7 dias', 'silver', 'Zap', 'streak_days', 7),
  ('Imparável', 'Mantenha uma sequência de 30 dias', 'gold', 'Rocket', 'streak_days', 30),
  ('Perfeicionista', 'Consiga 5 pontuações perfeitas', 'silver', 'Target', 'perfect_scores', 5),
  ('Infalível', 'Consiga 20 pontuações perfeitas', 'gold', 'Sparkles', 'perfect_scores', 20)
ON CONFLICT DO NOTHING;