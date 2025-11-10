import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LeaderboardEntry {
  user_id: string;
  display_name: string;
  avatar_url: string | null;
  total_xp: number;
  current_level: number;
  current_streak: number;
  lessons_completed: number;
  badges_earned: number;
  rank: number;
}

interface LeaderboardProps {
  userId?: string;
  className?: string;
}

export const Leaderboard = ({ userId, className = "" }: LeaderboardProps) => {
  const [globalLeaderboard, setGlobalLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('leaderboard_global')
        .select('*')
        .order('rank', { ascending: true })
        .limit(10);

      if (error) throw error;
      setGlobalLeaderboard((data as any) || []);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-700" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{rank}</span>;
    }
  };

  const getRankBadgeColor = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500';
    if (rank === 3) return 'bg-gradient-to-r from-amber-600 to-amber-800';
    return 'bg-muted';
  };

  return (
    <Card className={`border-2 shadow-medium ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Trophy className="h-5 w-5 text-warning" />
          Ranking Global
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="global" className="w-full">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="global">🌍 Global</TabsTrigger>
          </TabsList>

          <TabsContent value="global" className="space-y-2 mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando ranking...
              </div>
            ) : globalLeaderboard.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum dado disponível ainda
              </div>
            ) : (
              globalLeaderboard.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all duration-300 hover:shadow-medium ${
                    entry.user_id === userId
                      ? 'bg-primary/10 border-primary'
                      : 'bg-card border-border'
                  }`}
                >
                  {/* Rank */}
                  <div className={`flex items-center justify-center w-12 h-12 rounded-full ${getRankBadgeColor(entry.rank)}`}>
                    {getRankIcon(entry.rank)}
                  </div>

                  {/* Avatar */}
                  <Avatar className="h-10 w-10 border-2 border-border">
                    <AvatarFallback className="bg-gradient-secondary text-secondary-foreground">
                      {entry.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>

                  {/* User Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate">
                      {entry.display_name || 'Usuário'}
                      {entry.user_id === userId && (
                        <Badge variant="secondary" className="ml-2">Você</Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {entry.lessons_completed} lições • {entry.badges_earned} conquistas
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right">
                    <div className="text-sm font-bold text-foreground">
                      Nível {entry.current_level}
                    </div>
                    <div className="text-xs text-warning font-semibold">
                      {entry.total_xp} XP
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
