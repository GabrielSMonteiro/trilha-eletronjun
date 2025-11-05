-- Create lesson_notes table for user notes during lessons
CREATE TABLE public.lesson_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Enable RLS
ALTER TABLE public.lesson_notes ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own notes
CREATE POLICY "Users can view their own lesson notes"
ON public.lesson_notes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own lesson notes"
ON public.lesson_notes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lesson notes"
ON public.lesson_notes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lesson notes"
ON public.lesson_notes
FOR DELETE
USING (auth.uid() = user_id);

-- Create kanban_tasks table for personal progress tracking
CREATE TABLE public.kanban_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.kanban_tasks ENABLE ROW LEVEL SECURITY;

-- Users can only view and manage their own tasks
CREATE POLICY "Users can view their own kanban tasks"
ON public.kanban_tasks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own kanban tasks"
ON public.kanban_tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own kanban tasks"
ON public.kanban_tasks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own kanban tasks"
ON public.kanban_tasks
FOR DELETE
USING (auth.uid() = user_id);

-- Add updated_at triggers for both tables
CREATE TRIGGER update_lesson_notes_updated_at
BEFORE UPDATE ON public.lesson_notes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_kanban_tasks_updated_at
BEFORE UPDATE ON public.kanban_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();