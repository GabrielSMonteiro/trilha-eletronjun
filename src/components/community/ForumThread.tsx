import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, ThumbsUp, Send } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface ForumThreadProps {
  forum: any;
  userId: string;
  onBack: () => void;
}

const ForumThread = ({ forum, userId, onBack }: ForumThreadProps) => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchPosts();
  }, [forum.id]);

  const fetchPosts = async () => {
    const { data, error } = await supabase
      .from("forum_posts")
      .select(`
        *,
        forum_likes(count)
      `)
      .eq("forum_id", forum.id)
      .order("created_at", { ascending: true });

    if (!error && data) {
      setPosts(data);
      const userIds = [...new Set(data.map(p => p.user_id))];
      await fetchProfiles(userIds);
    }
  };

  const fetchProfiles = async (userIds: string[]) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .in("user_id", userIds);

    if (data) {
      const profilesMap = data.reduce((acc, profile) => {
        acc[profile.user_id] = profile;
        return acc;
      }, {} as Record<string, any>);
      setProfiles(profilesMap);
    }
  };

  const handleSubmitPost = async () => {
    if (!newPost.trim()) return;

    const { error } = await supabase
      .from("forum_posts")
      .insert({
        forum_id: forum.id,
        user_id: userId,
        content: newPost
      });

    if (error) {
      toast({ title: "Erro ao enviar post", variant: "destructive" });
    } else {
      setNewPost("");
      fetchPosts();
    }
  };

  const handleLikePost = async (postId: string, hasLiked: boolean) => {
    if (hasLiked) {
      await supabase
        .from("forum_likes")
        .delete()
        .eq("post_id", postId)
        .eq("user_id", userId);
    } else {
      await supabase
        .from("forum_likes")
        .insert({ post_id: postId, user_id: userId });
    }
    fetchPosts();
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar aos Fóruns
      </Button>

      <div className="bg-card rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-2">{forum.title}</h2>
        {forum.description && (
          <p className="text-muted-foreground">{forum.description}</p>
        )}
      </div>

      <div className="space-y-4">
        {posts.map((post) => {
          const profile = profiles[post.user_id];
          const likesCount = post.forum_likes?.[0]?.count || 0;
          
          return (
            <Card key={post.id}>
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <Avatar>
                    <AvatarImage src={profile?.avatar_url} />
                    <AvatarFallback>
                      {profile?.display_name?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold">
                        {profile?.display_name || "Usuário"}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(post.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </span>
                    </div>
                    <p className="text-foreground whitespace-pre-wrap mb-3">
                      {post.content}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-2"
                      onClick={() => handleLikePost(post.id, false)}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {likesCount > 0 && <span>{likesCount}</span>}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <Textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="Compartilhe suas ideias..."
              rows={4}
            />
            <Button onClick={handleSubmitPost} className="gap-2">
              <Send className="h-4 w-4" />
              Enviar Post
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForumThread;
