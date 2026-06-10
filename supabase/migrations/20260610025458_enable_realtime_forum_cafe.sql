-- Habilitar o Realtime para a tabela forum_posts
ALTER PUBLICATION supabase_realtime ADD TABLE public.forum_posts;

-- Habilitar o Realtime para a tabela shared_links
ALTER PUBLICATION supabase_realtime ADD TABLE public.shared_links;
