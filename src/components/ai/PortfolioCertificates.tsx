/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Award, Download, Share2, Trophy } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface Certificate {
  id: string;
  category_name: string;
  completed_lessons: number;
  total_lessons: number;
  completion_date: string;
  avg_score: number;
}

export const PortfolioCertificates = ({ userId }: { userId: string }) => {
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [badges, setBadges] = useState<{ badge_id: string; earned_at: string; badges: { name: string; description: string; icon_name: string } }[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadPortfolio();
  }, [userId]);

  const loadPortfolio = async () => {
    try {
      
      const { data: progress } = await supabase
        .from('user_progress')
        .select(`
          lesson_id,
          completed_at,
          score,
          lessons (
            category_id,
            categories (
              id,
              display_name
            )
          )
        `)
        .eq('user_id', userId)
        .not('completed_at', 'is', null);

      
      const categoryMap = new Map();
      progress?.forEach((item: { score?: number; completed_at: string; lessons: { category_id: string; categories: { display_name: string } } }) => {
        const categoryId = item.lessons.category_id;
        const categoryName = item.lessons.categories.display_name;
        
        if (!categoryMap.has(categoryId)) {
          categoryMap.set(categoryId, {
            id: categoryId,
            category_name: categoryName,
            completed_lessons: 0,
            scores: [],
            dates: []
          });
        }
        
        const cat = categoryMap.get(categoryId);
        cat.completed_lessons++;
        if (item.score) cat.scores.push(item.score);
        cat.dates.push(item.completed_at);
      });

      
      const { data: categories } = await supabase
        .from('lessons')
        .select('category_id, categories(id, display_name)');

      const categoryLessons = new Map();
      categories?.forEach((item: { category_id: string }) => {
        const catId = item.category_id;
        categoryLessons.set(catId, (categoryLessons.get(catId) || 0) + 1);
      });

      
      const certs: Certificate[] = [];
      categoryMap.forEach((value, key) => {
        const totalLessons = categoryLessons.get(key) || 0;
        if (value.completed_lessons >= totalLessons && totalLessons > 0) {
          certs.push({
            id: key,
            category_name: value.category_name,
            completed_lessons: value.completed_lessons,
            total_lessons: totalLessons,
            completion_date: new Date(Math.max(...value.dates.map((d: string) => new Date(d).getTime()))).toISOString(),
            avg_score: value.scores.length > 0 
              ? Math.round(value.scores.reduce((a: number, b: number) => a + b, 0) / value.scores.length)
              : 0
          });
        }
      });

      setCertificates(certs);

      
      const { data: badgesData } = await supabase
        .from('user_badges')
        .select(`
          badge_id,
          earned_at,
          badges (
            name,
            description,
            icon_name
          )
        `)
        .eq('user_id', userId);

      setBadges(badgesData || []);
    } catch (error) {
      console.error('Error loading portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCertificate = (cert: Certificate) => {
    toast({
      title: "Download em desenvolvimento",
      description: "A funcionalidade de download de certificados será implementada em breve.",
    });
  };

  const shareCertificate = (cert: Certificate) => {
    toast({
      title: "Compartilhamento em desenvolvimento",
      description: "A funcionalidade de compartilhamento será implementada em breve.",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando portfólio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Certificados Conquistados
          </CardTitle>
          <CardDescription>
            Certificados das trilhas de aprendizado completadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {certificates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Complete todas as lições de uma trilha para ganhar seu certificado!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificates.map((cert) => (
                <Card key={cert.id} className="border-2 border-primary/20">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cert.category_name}</CardTitle>
                        <CardDescription>
                          Concluído em {new Date(cert.completion_date).toLocaleDateString('pt-BR')}
                        </CardDescription>
                      </div>
                      <Award className="h-6 w-6 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Lições Completadas:</span>
                      <span className="font-bold">{cert.completed_lessons}/{cert.total_lessons}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pontuação Média:</span>
                      <span className="font-bold">{cert.avg_score}%</span>
                    </div>
                    <Separator />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => downloadCertificate(cert)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Baixar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => shareCertificate(cert)}
                      >
                        <Share2 className="h-4 w-4 mr-2" />
                        Compartilhar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            Conquistas e Badges
          </CardTitle>
          <CardDescription>
            Todas as suas conquistas e badges conquistados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {badges.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Continue aprendendo para conquistar badges!
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {badges.map((badge) => (
                <Card key={badge.badge_id} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6 pb-4 space-y-2">
                    <div className="text-4xl mb-2">🏆</div>
                    <h4 className="font-semibold text-sm">{badge.badges.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {badge.badges.description}
                    </p>
                    <Badge variant="secondary" className="text-xs">
                      {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
