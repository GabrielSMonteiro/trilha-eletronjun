import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Award, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RankingUser {
  user_id: string;
  display_name: string;
  avatar_url?: string;
  position?: string;
  lessons_completed: number;
  average_score: number;
  ranking: number;
}

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RankingModal = ({ isOpen, onClose }: RankingModalProps) => {
  const [rankings, setRankings] = useState<RankingUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadRankingData();
    }
  }, [isOpen]);

  const loadRankingData = async () => {
    setIsLoading(true);
    try {
      const now = new Date();
      const monthName = now.toLocaleDateString("pt-BR", { 
        month: "long", 
        year: "numeric" 
      });
      setCurrentMonth(monthName);

      // Get ranking for current month with score >= 80%
      // First get admin user IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      
      // Get non-admin profiles
      let query = supabase
        .from("profiles")
        .select("user_id, display_name, position, avatar_url");
      
      if (adminUserIds.length > 0) {
        query = query.not("user_id", "in", `(${adminUserIds.join(",")})`);
      }
      
      const { data: profilesData } = await query;

      if (!profilesData) {
        setRankings([]);
        return;
      }

      const rankingPromises = profilesData.map(async (profile) => {
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("lesson_id, completed_at, score")
          .eq("user_id", profile.user_id)
          .not("completed_at", "is", null)
          .gte("score", 80) // Only successful completions
          .gte("completed_at", `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`)
          .lt("completed_at", `${now.getFullYear()}-${String(now.getMonth() + 2).padStart(2, '0')}-01`);

        const lessonsCompleted = progressData?.length || 0;
        const averageScore = progressData && progressData.length > 0
          ? progressData.reduce((sum, p) => sum + (p.score || 0), 0) / progressData.length
          : 0;

        return {
          user_id: profile.user_id,
          display_name: profile.display_name || "Usuário",
          position: profile.position,
          avatar_url: profile.avatar_url,
          lessons_completed: lessonsCompleted,
          average_score: Number(averageScore.toFixed(1)),
          ranking: 0, // Will be set after sorting
        };
      });

      const rankingData = await Promise.all(rankingPromises);
      
      // Sort by lessons completed (desc) then by average score (desc)
      // Only include users with at least 1 completed lesson
      const sortedRankings = rankingData
        .filter(user => user.lessons_completed > 0)
        .sort((a, b) => {
          if (b.lessons_completed !== a.lessons_completed) {
            return b.lessons_completed - a.lessons_completed;
          }
          return b.average_score - a.average_score;
        })
        .map((user, index) => ({
          ...user,
          ranking: index + 1,
        }));

      setRankings(sortedRankings.slice(0, 10)); // Top 10
    } catch (error) {
      console.error("Error loading ranking data:", error);
      setRankings([]);
    } finally {
      setIsLoading(false);
    }
  };
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-card border-2 border-border shadow-strong rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Ranking do Mês
          </DialogTitle>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
            <Calendar className="h-4 w-4" />
            {currentMonth}
          </p>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {isLoading ? (
            // Loading skeletons
            [...Array(3)].map((_, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-xl border">
                <Skeleton className="w-12 h-12 rounded-full" />
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-6 w-20" />
              </div>
            ))
          ) : rankings.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Nenhum ranking este mês
              </h3>
              <p className="text-sm text-muted-foreground">
                Complete lições com nota acima de 80% para aparecer no ranking!
              </p>
            </div>
          ) : (
            <>
              {rankings.map((user) => {
                const position = user.ranking;
                const initials = user.display_name.split(' ').map(n => n[0]).join('').toUpperCase();
                
                return (
                  <div 
                    key={user.user_id}
                    className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                      position === 1 ? 'bg-gradient-to-r from-yellow-900/40 to-yellow-800/40 border-2 border-yellow-600/50' :
                      position === 2 ? 'bg-gradient-to-r from-gray-800/40 to-gray-700/40 border-2 border-gray-500/50' :
                      position === 3 ? 'bg-gradient-to-r from-amber-900/40 to-amber-800/40 border-2 border-amber-600/50' :
                      'bg-card/50 border border-border/50'
                    }`}
                  >
                    <div className="flex items-center justify-center w-12 h-12">
                      {getPositionIcon(position)}
                    </div>
                    
                    <Avatar className="h-12 w-12 border-2 border-white shadow-soft">
                      <AvatarImage src={user.avatar_url} alt={user.display_name} />
                      <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <h4 className="font-semibold text-foreground">{user.display_name}</h4>
                      <p className="text-xs text-muted-foreground">{user.position || "Membro"}</p>
                    </div>
                    
                    <div className="text-right space-y-1">
                      <Badge className={`${getPositionBadge(position)} font-bold text-xs`}>
                        {user.lessons_completed} lições
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        Média: {user.average_score}%
                      </p>
                    </div>
                  </div>
                );
              })}
              
              {/* Message for users not in ranking */}
              <div className="text-center py-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Continue se capacitando para aparecer no próximo ranking! 🚀
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Complete lições com nota ≥ 80% para pontuar
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};