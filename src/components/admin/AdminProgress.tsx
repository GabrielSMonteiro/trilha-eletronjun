import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, TrendingUp, Target, Users, Search, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
  display_name: string;
}

interface CategoryProgress {
  category_id: string;
  category_name: string;
  total_lessons: number;
  total_completions: number;
  unique_users_completed: number;
  completion_rate: number;
}

interface UserProgress {
  user_id: string;
  display_name: string;
  position?: string;
  total_lessons_started: number;
  total_lessons_completed: number;
  completion_percentage: number;
  average_score: number;
}

interface OverallStats {
  averageCompletionRate: number;
  averageScore: number;
  totalActiveUsers: number;
  totalLessonsInProgress: number;
}

interface UserCategoryProgress {
  category_id: string;
  category_name: string;
  total_lessons: number;
  completed_lessons: number;
  progress_percentage: number;
  avg_score: number | null;
}

export const AdminProgress = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryProgress, setCategoryProgress] = useState<CategoryProgress[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [filteredUserProgress, setFilteredUserProgress] = useState<UserProgress[]>([]);
  const [overallStats, setOverallStats] = useState<OverallStats>({
    averageCompletionRate: 0,
    averageScore: 0,
    totalActiveUsers: 0,
    totalLessonsInProgress: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userCategoryProgress, setUserCategoryProgress] = useState<UserCategoryProgress[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoadingModal, setIsLoadingModal] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadProgressData();
  }, []);

  useEffect(() => {
    filterUserProgress();
  }, [userProgress, searchTerm]);

  const loadProgressData = async () => {
    setIsLoading(true);
    try {
      // Load categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .order("display_name");

      if (categoriesError) {
        console.error("Error loading categories:", categoriesError);
        setIsLoading(false);
        return;
      }

      setCategories(categoriesData || []);

      // Calculate category progress manually from existing tables
      const categoryProgressPromises = (categoriesData || []).map(async (category) => {
        // Get lessons count for this category
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id")
          .eq("category_id", category.id);

        // Get progress for this category's lessons
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("user_id, lesson_id, completed_at")
          .in("lesson_id", (lessonsData || []).map(l => l.id))
          .not("completed_at", "is", null);

        const totalLessons = lessonsData?.length || 0;
        const totalCompletions = progressData?.length || 0;
        const uniqueUsersCompleted = new Set(progressData?.map(p => p.user_id) || []).size;

        return {
          category_id: category.id,
          category_name: category.name,
          total_lessons: totalLessons,
          total_completions: totalCompletions,
          unique_users_completed: uniqueUsersCompleted,
          completion_rate: totalLessons > 0 ? Math.round((totalCompletions / totalLessons) * 100) : 0,
        };
      });

      const categoryProgressData = await Promise.all(categoryProgressPromises);
      setCategoryProgress(categoryProgressData);

      // Calculate user progress manually
      // Get admin user IDs
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      
      const adminUserIds = adminRoles?.map(r => r.user_id) || [];
      
      // Get non-admin profiles
      let query = supabase
        .from("profiles")
        .select("user_id, display_name, position, created_at");
      
      if (adminUserIds.length > 0) {
        query = query.not("user_id", "in", `(${adminUserIds.join(",")})`);
      }
      
      const { data: profilesData } = await query;

      const userProgressPromises = (profilesData || []).map(async (profile) => {
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("lesson_id, completed_at, score")
          .eq("user_id", profile.user_id);

        const totalStarted = progressData?.length || 0;
        const completedProgress = progressData?.filter(p => p.completed_at) || [];
        const totalCompleted = completedProgress.length;
        const avgScore = completedProgress.length > 0 
          ? completedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / completedProgress.length 
          : 0;

        // Get total lessons available to calculate completion percentage
        const { data: totalLessonsData } = await supabase
          .from("lessons")
          .select("id");

        const totalAvailable = totalLessonsData?.length || 1;
        const completionPercentage = (totalCompleted / totalAvailable) * 100;

        return {
          user_id: profile.user_id,
          display_name: profile.display_name || "Usuário",
          position: profile.position,
          total_lessons_started: totalStarted,
          total_lessons_completed: totalCompleted,
          completion_percentage: Number(completionPercentage.toFixed(1)),
          average_score: Number(avgScore.toFixed(1)),
        };
      });

      const userProgressData = await Promise.all(userProgressPromises);
      setUserProgress(userProgressData);

      // Calculate overall stats
      const totalUsers = userProgressData.length;
      const activeUsers = userProgressData.filter(u => u.total_lessons_started > 0).length;
      const averageCompletionRate = totalUsers > 0 
        ? userProgressData.reduce((sum, u) => sum + u.completion_percentage, 0) / totalUsers 
        : 0;
      const averageScore = totalUsers > 0 
        ? userProgressData.reduce((sum, u) => sum + u.average_score, 0) / totalUsers 
        : 0;
      const totalLessonsInProgress = userProgressData.reduce((sum, u) => 
        sum + (u.total_lessons_started - u.total_lessons_completed), 0);

      setOverallStats({
        averageCompletionRate: Math.round(averageCompletionRate),
        averageScore: Math.round(averageScore),
        totalActiveUsers: activeUsers,
        totalLessonsInProgress,
      });
    } catch (error) {
      console.error("Error loading progress data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterUserProgress = () => {
    const filtered = userProgress.filter(user => {
      const name = user.display_name?.toLowerCase() || "";
      const position = user.position?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      
      return name.includes(search) || position.includes(search);
    });
    
    setFilteredUserProgress(filtered);
  };

  const getFilteredCategoryProgress = () => {
    if (selectedCategory === "all") return categoryProgress;
    return categoryProgress.filter(cp => cp.category_id === selectedCategory);
  };

  const loadUserCategoryProgress = async (userId: string) => {
    setIsLoadingModal(true);
    try {
      // Pegar todas as categorias
      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, display_name")
        .order("display_name");

      if (!categoriesData) {
        setIsLoadingModal(false);
        return;
      }

      // Para cada categoria, calcular o progresso do usuário
      const progressPromises = categoriesData.map(async (category) => {
        // Pegar todas as lições da categoria
        const { data: lessonsData } = await supabase
          .from("lessons")
          .select("id")
          .eq("category_id", category.id);

        const totalLessons = lessonsData?.length || 0;
        const lessonIds = lessonsData?.map(l => l.id) || [];

        if (lessonIds.length === 0) {
          return {
            category_id: category.id,
            category_name: category.display_name,
            total_lessons: 0,
            completed_lessons: 0,
            progress_percentage: 0,
            avg_score: null,
          };
        }

        // Pegar progresso do usuário nessas lições
        const { data: progressData } = await supabase
          .from("user_progress")
          .select("lesson_id, completed_at, score")
          .eq("user_id", userId)
          .in("lesson_id", lessonIds);

        const completedProgress = progressData?.filter(p => p.completed_at) || [];
        const completedLessons = completedProgress.length;
        const avgScore = completedProgress.length > 0
          ? completedProgress.reduce((sum, p) => sum + (p.score || 0), 0) / completedProgress.length
          : null;

        const progressPercentage = totalLessons > 0
          ? Math.round((completedLessons / totalLessons) * 100)
          : 0;

        return {
          category_id: category.id,
          category_name: category.display_name,
          total_lessons: totalLessons,
          completed_lessons: completedLessons,
          progress_percentage: progressPercentage,
          avg_score: avgScore,
        };
      });

      const categoryProgressData = await Promise.all(progressPromises);
      setUserCategoryProgress(categoryProgressData);
    } catch (error) {
      console.error("Error loading user category progress:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o progresso do usuário.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingModal(false);
    }
  };

  const handleShowUserDetails = async (userId: string) => {
    setSelectedUserId(userId);
    setIsModalOpen(true);
    await loadUserCategoryProgress(userId);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Progresso dos Usuários</h1>
          <p className="text-muted-foreground">Acompanhe o progresso e performance</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-8 bg-muted rounded w-16"></div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Progresso dos Usuários</h1>
        <p className="text-muted-foreground">
          Acompanhe o progresso e performance dos usuários no sistema
        </p>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conclusão Média</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageCompletionRate}%</div>
            <p className="text-xs text-muted-foreground">
              Média de conclusão de lições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pontuação Média</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.averageScore}%</div>
            <p className="text-xs text-muted-foreground">
              Média das avaliações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalActiveUsers}</div>
            <p className="text-xs text-muted-foreground">
              Com progresso registrado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lições em Progresso</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overallStats.totalLessonsInProgress}</div>
            <p className="text-xs text-muted-foreground">
              Iniciadas mas não concluídas
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Progress */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart className="h-5 w-5" />
                Progresso por Categoria
              </CardTitle>
              
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {getFilteredCategoryProgress().length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum progresso registrado
                </p>
              ) : (
                getFilteredCategoryProgress().map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{category.category_name}</span>
                      <Badge variant="outline">
                        {category.completion_rate}%
                      </Badge>
                    </div>
                    <Progress value={category.completion_rate} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      {category.total_completions} conclusões • {category.unique_users_completed} usuários únicos
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Progress List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <CardTitle>Progresso Individual</CardTitle>
              
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {filteredUserProgress.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  {searchTerm ? "Nenhum usuário encontrado" : "Nenhum progresso registrado"}
                </p>
              ) : (
                filteredUserProgress.map((user) => (
                  <Card key={user.user_id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {user.display_name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{user.display_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {user.position || "Cargo não informado"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm font-medium">{user.total_lessons_completed} lições</p>
                            <p className="text-xs text-muted-foreground">concluídas</p>
                          </div>
                          <Button size="sm" onClick={() => handleShowUserDetails(user.user_id)}>
                            Ver mais
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal de detalhes do usuário */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Progresso de {userProgress.find(u => u.user_id === selectedUserId)?.display_name}
            </DialogTitle>
          </DialogHeader>
          
          {isLoadingModal ? (
            <div className="space-y-4 py-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-32 animate-pulse"></div>
                  <div className="h-2 bg-muted rounded animate-pulse"></div>
                  <div className="h-3 bg-muted rounded w-48 animate-pulse"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {userCategoryProgress.map((category) => (
                <div key={category.category_id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{category.category_name}</span>
                    <Badge variant={category.progress_percentage === 100 ? "default" : "secondary"}>
                      {category.progress_percentage}%
                    </Badge>
                  </div>
                  <Progress value={category.progress_percentage} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {category.completed_lessons}/{category.total_lessons} lições concluídas
                    </span>
                    {category.avg_score !== null && (
                      <span>Média: {category.avg_score.toFixed(1)}%</span>
                    )}
                  </div>
                </div>
              ))}
              {userCategoryProgress.length === 0 && (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum progresso registrado ainda.
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};