import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface GroupChatProps {
  group: any;
  userId: string;
  onBack: () => void;
}

const GroupChat = ({ group, userId, onBack }: GroupChatProps) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [profiles, setProfiles] = useState<Record<string, any>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to real-time messages
    const channel = supabase
      .channel(`group_${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${group.id}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new]);
          fetchProfile(payload.new.user_id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [group.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("group_messages")
      .select("*")
      .eq("group_id", group.id)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
      const userIds = [...new Set(data.map(m => m.user_id))];
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

  const fetchProfile = async (userId: string) => {
    if (profiles[userId]) return;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setProfiles(prev => ({ ...prev, [userId]: data }));
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from("group_messages")
      .insert({
        group_id: group.id,
        user_id: userId,
        content: newMessage
      });

    if (!error) {
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="space-y-4">
      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" />
        Voltar aos Grupos
      </Button>

      <Card className="h-[600px] flex flex-col">
        <CardHeader>
          <CardTitle>{group.name}</CardTitle>
          {group.description && (
            <p className="text-sm text-muted-foreground">{group.description}</p>
          )}
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 px-4" ref={scrollRef}>
            <div className="space-y-4 py-4">
              {messages.map((message) => {
                const profile = profiles[message.user_id];
                const isOwn = message.user_id === userId;

                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback>
                        {profile?.display_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className={`flex flex-col ${isOwn ? 'items-end' : ''} max-w-[70%]`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-semibold">
                          {isOwn ? "Você" : profile?.display_name || "Usuário"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(message.created_at), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </span>
                      </div>
                      <div
                        className={`rounded-lg px-3 py-2 ${
                          isOwn
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua mensagem..."
              />
              <Button onClick={handleSendMessage} size="icon">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupChat;
