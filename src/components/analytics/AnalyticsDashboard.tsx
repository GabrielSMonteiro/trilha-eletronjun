import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ProgressChart } from "./ProgressChart";
import { StudyTimeChart } from "./StudyTimeChart";
import { CompletionRateChart } from "./CompletionRateChart";
import { useAnalytics } from "@/hooks/useAnalytics";
import { Download, TrendingUp, Clock, Award, Target, Search, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface AnalyticsDashboardProps {
  userId: string;
}

interface UserProfile {
  user_id: string;
  display_name: string;
  position: string;
  total_xp: number;
  lessons_completed: number;
  avg_score: number;
}

export const AnalyticsDashboard = ({ userId }: AnalyticsDashboardProps) => {
  const { userAnalytics, categoryAnalytics, recentSessions, loading } = useAnalytics(userId);
  const { toast } = useToast();
  const [progressData, setProgressData] = useState<any[]>([]);
  const [studyTimeData, setStudyTimeData] = useState<any[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [positions, setPositions] = useState<string[]>([]);

  // Check if user is admin
  useEffect(() => {
    const checkAdmin = async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
        loadAllUsers();
      }
    };

    checkAdmin();
  }, [userId]);

  // Load all users for admin
  const loadAllUsers = async () => {
    const { data, error } = await supabase
      .from('user_analytics')
      .select('user_id, display_name, total_xp, lessons_completed, avg_score')
      .order('total_xp', { ascending: false });

    if (!error && data) {
      // Get profiles to get positions
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, position');

      const usersWithPositions = data.map(user => {
        const profile = profiles?.find(p => p.user_id === user.user_id);
        return {
          ...user,
          position: profile?.position || 'Não informado'
        };
      });

      setAllUsers(usersWithPositions);
      setFilteredUsers(usersWithPositions);

      // Extract unique positions
      const uniquePositions = Array.from(new Set(usersWithPositions.map(u => u.position)));
      setPositions(uniquePositions);
    }
  };

  // Filter users based on search and position
  useEffect(() => {
    let filtered = allUsers;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (positionFilter !== "all") {
      filtered = filtered.filter(user => user.position === positionFilter);
    }

    setFilteredUsers(filtered);
  }, [searchTerm, positionFilter, allUsers]);

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

  // Prepare pie chart data
  const pieData = categoryAnalytics.map(cat => ({
    name: cat.category_name,
    value: cat.total_completions,
  }));

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--chart-1))', 'hsl(var(--chart-2))'];

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

      {/* Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Distribuição Geral por Categoria</CardTitle>
          <CardDescription>Visão geral das conclusões por área</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="value">
                {pieData.map((_, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CompletionRateChart completed={userAnalytics?.lessons_completed || 0} total={categoryAnalytics.reduce((acc, cat) => acc + cat.total_lessons, 0)} />
        
        <Card>
          <CardHeader>
            <CardTitle>Desempenho por Categoria</CardTitle>
            <CardDescription>Top 5 categorias</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryAnalytics.slice(0, 5).map((cat) => (
              <div key={cat.category_id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{cat.category_name}</span>
                  <span className="text-muted-foreground">{cat.total_completions}/{cat.total_lessons}</span>
                </div>
                <div className="h-2 bg-secondary rounded-full"><div className="h-full bg-primary transition-all" style={{ width: `${(cat.total_completions / (cat.total_lessons || 1)) * 100}%` }} /></div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle>Analytics de Todos os Usuários (Admin)</CardTitle>
            <CardDescription>Visão geral do desempenho de todos os estudantes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Buscar por nome..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
              </div>
              <Select value={positionFilter} onValueChange={setPositionFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por cargo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os cargos</SelectItem>
                  {positions.map(position => <SelectItem key={position} value={position}>{position}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="p-3 text-left text-sm font-medium">Nome</th>
                    <th className="p-3 text-left text-sm font-medium">Cargo</th>
                    <th className="p-3 text-right text-sm font-medium">XP</th>
                    <th className="p-3 text-right text-sm font-medium">Lições</th>
                    <th className="p-3 text-right text-sm font-medium">Média</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.user_id} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-3 text-sm">{user.display_name || 'Sem nome'}</td>
                      <td className="p-3 text-sm text-muted-foreground">{user.position}</td>
                      <td className="p-3 text-sm text-right font-medium">{user.total_xp || 0}</td>
                      <td className="p-3 text-sm text-right">{user.lessons_completed || 0}</td>
                      <td className="p-3 text-sm text-right">{Math.round(user.avg_score || 0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredUsers.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum usuário encontrado.</div>}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
