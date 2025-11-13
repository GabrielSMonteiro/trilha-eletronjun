-- Create forums table for discussion forums by category
CREATE TABLE public.forums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  is_locked BOOLEAN DEFAULT false
);

-- Create forum_posts table for posts in forums
CREATE TABLE public.forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id UUID REFERENCES public.forums(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  likes_count INTEGER DEFAULT 0,
  is_solution BOOLEAN DEFAULT false
);

-- Create forum_likes table for post likes
CREATE TABLE public.forum_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES public.forum_posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Create study_groups table
CREATE TABLE public.study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  max_members INTEGER DEFAULT 10,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create study_group_members table
CREATE TABLE public.study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(group_id, user_id)
);

-- Create group_messages table for real-time chat
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMP WITH TIME ZONE
);

-- Create mentorship_requests table
CREATE TABLE public.mentorship_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mentee_id UUID NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'matched', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create mentorship_matches table
CREATE TABLE public.mentorship_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.mentorship_requests(id) ON DELETE CASCADE NOT NULL,
  mentor_id UUID NOT NULL,
  mentee_id UUID NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on all tables
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_matches ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forums
CREATE POLICY "Everyone can view forums" ON public.forums FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create forums" ON public.forums FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Forum creators can update their forums" ON public.forums FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage all forums" ON public.forums FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for forum_posts
CREATE POLICY "Everyone can view forum posts" ON public.forum_posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.forum_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.forum_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.forum_posts FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for forum_likes
CREATE POLICY "Everyone can view likes" ON public.forum_likes FOR SELECT USING (true);
CREATE POLICY "Users can like posts" ON public.forum_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike posts" ON public.forum_likes FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for study_groups
CREATE POLICY "Everyone can view public groups" ON public.study_groups FOR SELECT USING (NOT is_private OR created_by = auth.uid());
CREATE POLICY "Authenticated users can create groups" ON public.study_groups FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Group creators can update their groups" ON public.study_groups FOR UPDATE USING (auth.uid() = created_by);

-- RLS Policies for study_group_members
CREATE POLICY "Members can view group members" ON public.study_group_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.study_group_members sgm
    WHERE sgm.group_id = study_group_members.group_id AND sgm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can join groups" ON public.study_group_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can leave groups" ON public.study_group_members FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for group_messages
CREATE POLICY "Group members can view messages" ON public.group_messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.study_group_members sgm
    WHERE sgm.group_id = group_messages.group_id AND sgm.user_id = auth.uid()
  )
);
CREATE POLICY "Group members can send messages" ON public.group_messages FOR INSERT WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM public.study_group_members sgm
    WHERE sgm.group_id = group_messages.group_id AND sgm.user_id = auth.uid()
  )
);
CREATE POLICY "Users can update their own messages" ON public.group_messages FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for mentorship_requests
CREATE POLICY "Everyone can view open requests" ON public.mentorship_requests FOR SELECT USING (status = 'open' OR mentee_id = auth.uid());
CREATE POLICY "Users can create their own requests" ON public.mentorship_requests FOR INSERT WITH CHECK (auth.uid() = mentee_id);
CREATE POLICY "Users can update their own requests" ON public.mentorship_requests FOR UPDATE USING (auth.uid() = mentee_id);

-- RLS Policies for mentorship_matches
CREATE POLICY "Users can view their matches" ON public.mentorship_matches FOR SELECT USING (
  mentor_id = auth.uid() OR mentee_id = auth.uid()
);
CREATE POLICY "Mentors can accept requests" ON public.mentorship_matches FOR INSERT WITH CHECK (auth.uid() = mentor_id);
CREATE POLICY "Participants can update matches" ON public.mentorship_matches FOR UPDATE USING (
  mentor_id = auth.uid() OR mentee_id = auth.uid()
);

-- Create indexes for better performance
CREATE INDEX idx_forums_category ON public.forums(category_id);
CREATE INDEX idx_forum_posts_forum ON public.forum_posts(forum_id);
CREATE INDEX idx_forum_posts_user ON public.forum_posts(user_id);
CREATE INDEX idx_study_groups_category ON public.study_groups(category_id);
CREATE INDEX idx_group_members_group ON public.study_group_members(group_id);
CREATE INDEX idx_group_members_user ON public.study_group_members(user_id);
CREATE INDEX idx_group_messages_group ON public.group_messages(group_id);
CREATE INDEX idx_mentorship_requests_status ON public.mentorship_requests(status);

-- Create triggers for updated_at
CREATE TRIGGER update_forums_updated_at BEFORE UPDATE ON public.forums
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forum_posts_updated_at BEFORE UPDATE ON public.forum_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_study_groups_updated_at BEFORE UPDATE ON public.study_groups
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mentorship_requests_updated_at BEFORE UPDATE ON public.mentorship_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for group messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;