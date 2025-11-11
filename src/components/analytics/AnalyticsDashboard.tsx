import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProgressChart } from "./ProgressChart";
import { StudyTimeChart } from "./StudyTimeChart";
import { CompletionRateChart } from "./CompletionRateChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Download, TrendingUp, Clock, Award, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AnalyticsDashboardProps {
  userId: string;
}

export const AnalyticsDashboard = ({ userId }: AnalyticsDashboardProps) => {
  const { userAnalytics, categoryAnalytics, recentSessions, loading } = useAnalytics(userId);
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [studyTimeData, setStudyTimeData] = useState<any[]>([]);

  useEffect(() => {
    if (categoryAnalytics.length > 0) {
      const chartData = categoryAnalytics.map(cat => ({
        name: cat.category_name,
        completed: cat.total_completions,
        total: cat.total_lessons,
      }));
      setProgressData(chartData);
    }

    if (recentSessions.length > 0) {
      const last7Days = recentSessions.slice(0, 7).reverse().map(session => ({
        date: new Date(session.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        minutes: session.duration_minutes,
      }));
      setStudyTimeData(last7Days);
    }
  }, [categoryAnalytics, recentSessions]);

  const handleExport = () => {
    toast({
      title: "Exportação em desenvolvimento",
      description: "A funcionalidade de exportação será implementada em breve.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold">Dashboard Analítico</h2>
          <p className="text-sm text-muted-foreground mt-1">Acompanhe seu progresso e desempenho</p>
        </div>
        <Button onClick={handleExport} variant="outline" className="w-full sm:w-auto">
          <Download className="h-4 w-4 mr-2" />
          Exportar Relatório
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de XP</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics?.total_xp || 0}</div>
            <p className="text-xs text-muted-foreground">Nível {userAnalytics?.current_level || 1}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tempo de Estudo</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((userAnalytics?.total_study_minutes || 0) / 60)}h</div>
            <p className="text-xs text-muted-foreground">{userAnalytics?.total_sessions || 0} sessões</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Média de Score</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics?.avg_score?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">Desempenho geral</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lições Completadas</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userAnalytics?.lessons_completed || 0}</div>
            <p className="text-xs text-muted-foreground">Sequência: {userAnalytics?.current_streak || 0} dias</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProgressChart data={progressData} />
        <StudyTimeChart data={studyTimeData} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionRateChart 
          completed={userAnalytics?.lessons_completed || 0}
          total={categoryAnalytics.reduce((acc, cat) => acc + cat.total_lessons, 0)}
        />
        
        {/* Category Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Categoria</CardTitle>
            <CardDescription>Progresso em cada trilha de aprendizado</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryAnalytics.slice(0, 5).map((cat) => (
                <div key={cat.category_id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cat.category_name}</span>
                    <span className="text-muted-foreground">
                      {cat.total_completions}/{cat.total_lessons}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all"
                      style={{ 
                        width: `${(cat.total_completions / (cat.total_lessons || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
