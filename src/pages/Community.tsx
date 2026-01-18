import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, GraduationCap, ArrowLeft, Sparkles } from "lucide-react";
import { NotificationCenter } from "@/components/NotificationCenter";
import ForumsList from "@/components/community/ForumsList";
import StudyGroupsList from "@/components/community/StudyGroupsList";
import MentorshipBoard from "@/components/community/MentorshipBoard";

const Community = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session) {
          navigate("/auth");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-6 flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate("/app")}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/ai")}
              className="border-border hover:border-primary/20 h-9 px-3 gap-1"
            >
              <Sparkles className="h-4 w-4" />
              <span className="hidden sm:inline text-xs">IA</span>
            </Button>
            <NotificationCenter />
          </div>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">
            Comunidade
          </h1>
          <p className="text-muted-foreground">
            Conecte-se, aprenda e cresça junto com outros estudantes
          </p>
        </div>

        <Tabs defaultValue="forums" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="forums" className="gap-2">
              <MessageSquare className="h-4 w-4" />
              <span className="hidden sm:inline">Fóruns</span>
            </TabsTrigger>
            <TabsTrigger value="groups" className="gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Grupos</span>
            </TabsTrigger>
            <TabsTrigger value="mentorship" className="gap-2">
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Mentoria</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="forums">
            <ForumsList userId={user.id} />
          </TabsContent>

          <TabsContent value="groups">
            <StudyGroupsList userId={user.id} />
          </TabsContent>

          <TabsContent value="mentorship">
            <MentorshipBoard userId={user.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Community;
