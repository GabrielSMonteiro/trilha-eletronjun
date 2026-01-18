import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, BookOpen, CheckCircle, TrendingUp, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DashboardStats {
  totalUsers: number;
  totalLessons: number;
  totalCompletions: number;
  activeUsers: number;
  totalCategories: number;
}

interface RecentActivity {
  id: string;
  user_name: string;
  lesson_title: string;
  completed_at: string;
  score: number;
}

interface CategoryStats {
  category_name: string;
  total_lessons: number;
  total_completions: number;
  completion_rate: number;
}

export const AdminDashboard = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // Load basic stats
      // Get admin user IDs
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');
      
      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      
      let usersQuery = supabase.from('profiles').select('id', { count: 'exact' });
      if (adminUserIds.length > 0) {
        // Use array directly instead of string interpolation for safer query construction
        usersQuery = usersQuery.not('user_id', 'in', `(${adminUserIds.map(id => `"${id}"`).join(',')})`);
      }
      
      const [usersResult, lessonsResult, completionsResult, categoriesResult] = await Promise.all([
        usersQuery,
        supabase.from('lessons').select('id', { count: 'exact' }),
        supabase.from('user_progress').select('id', { count: 'exact' }).not('completed_at', 'is', null),
        supabase.from('categories').select('id', { count: 'exact' }),
      ]);

      // Active users (users with progress in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: activeUsersData } = await supabase
        .from('user_progress')
        .select('user_id', { count: 'exact' })
        .gte('created_at', thirtyDaysAgo.toISOString());

      const uniqueActiveUsers = new Set(activeUsersData?.map(u => u.user_id) || []).size;

      setStats({
        totalUsers: usersResult.count || 0,
        totalLessons: lessonsResult.count || 0,
        totalCompletions: completionsResult.count || 0,
        activeUsers: uniqueActiveUsers,
        totalCategories: categoriesResult.count || 0,
      });

      // Load recent activity
      const { data: recentData } = await supabase
        .from('user_progress')
        .select(`
          id,
          completed_at,
          score,
          profiles!inner(display_name),
          lessons!inner(title)
        `)
        .not('completed_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(10);

      const formattedActivity = recentData?.map(item => ({
        id: item.id,
        user_name: (item.profiles as any)?.display_name || 'Usuário',
        lesson_title: (item.lessons as any)?.title || 'Lição',
        completed_at: item.completed_at!,
        score: item.score || 0,
      })) || [];

      setRecentActivity(formattedActivity);

      // Load category stats
      const { data: categoryData } = await supabase
        .from('category_progress')
        .select('*');

      const formattedCategoryStats = categoryData?.map(cat => ({
        category_name: cat.category_name || 'Categoria',
        total_lessons: Number(cat.total_lessons) || 0,
        total_completions: Number(cat.total_completions) || 0,
        completion_rate: cat.total_lessons ? 
          Math.round((Number(cat.total_completions) / Number(cat.total_lessons)) * 100) : 0,
      })) || [];

      setCategoryStats(formattedCategoryStats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema EletronJun</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              +{stats?.activeUsers} ativos este mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Lições</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons}</div>
            <p className="text-xs text-muted-foreground">
              Em {stats?.totalCategories} categorias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conclusões</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalCompletions}</div>
            <p className="text-xs text-muted-foreground">
              Lições concluídas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              ) : (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.user_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.lesson_title}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">
                        {activity.score}%
                      </Badge>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(activity.completed_at)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Category Statistics */}
        <Card>
          <CardHeader>
            <CardTitle>Estatísticas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categoryStats.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma estatística disponível
                </p>
              ) : (
                categoryStats.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category_name}</span>
                      <Badge variant="outline">
                        {category.completion_rate}%
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {category.total_completions} conclusões de {category.total_lessons} lições
                    </div>
                    <div className="w-full bg-secondary rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all"
                        style={{ width: `${category.completion_rate}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};