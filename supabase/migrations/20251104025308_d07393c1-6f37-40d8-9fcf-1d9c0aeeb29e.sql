-- Create shared_links table for study materials
CREATE TABLE public.shared_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  link_type TEXT NOT NULL CHECK (link_type IN ('youtube', 'drive', 'pdf', 'docs', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shared_links ENABLE ROW LEVEL SECURITY;

-- Policies for shared_links (visible to all, but only owner can modify)
CREATE POLICY "Shared links are viewable by everyone"
  ON public.shared_links
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own shared links"
  ON public.shared_links
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shared links"
  ON public.shared_links
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shared links"
  ON public.shared_links
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create todo_items table for private to-do lists
CREATE TABLE public.todo_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.todo_items ENABLE ROW LEVEL SECURITY;

-- Policies for todo_items (private to each user)
CREATE POLICY "Users can view their own todo items"
  ON public.todo_items
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own todo items"
  ON public.todo_items
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todo items"
  ON public.todo_items
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todo items"
  ON public.todo_items
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_shared_links_updated_at
  BEFORE UPDATE ON public.shared_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_todo_items_updated_at
  BEFORE UPDATE ON public.todo_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();