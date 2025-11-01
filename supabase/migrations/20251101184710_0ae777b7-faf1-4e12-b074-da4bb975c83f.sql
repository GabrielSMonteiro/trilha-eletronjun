-- Create cafe_presets table for saving user sound presets
CREATE TABLE public.cafe_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  preset_name TEXT NOT NULL,
  preset_config JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cafe_presets ENABLE ROW LEVEL SECURITY;

-- Create policies for cafe_presets
CREATE POLICY "Users can view their own cafe presets"
  ON public.cafe_presets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cafe presets"
  ON public.cafe_presets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cafe presets"
  ON public.cafe_presets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cafe presets"
  ON public.cafe_presets FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_cafe_presets_updated_at
  BEFORE UPDATE ON public.cafe_presets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create cafe_sessions table for tracking usage and gamification
CREATE TABLE public.cafe_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  preset_used TEXT,
  points_earned INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.cafe_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies for cafe_sessions
CREATE POLICY "Users can view their own cafe sessions"
  ON public.cafe_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own cafe sessions"
  ON public.cafe_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cafe sessions"
  ON public.cafe_sessions FOR UPDATE
  USING (auth.uid() = user_id);