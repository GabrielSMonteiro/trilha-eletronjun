import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LearningPath } from "@/components/LearningPath";
import { CategorySelector } from "@/components/CategorySelector";
import { UserProfile } from "@/components/UserProfile";
import { RankingModal } from "@/components/RankingModal";
import { LessonModal } from "@/components/LessonModal";
import { Trophy, Menu, User } from "lucide-react";

// Mock data - Em produção, estes dados viriam do Supabase
const mockUser = {
  name: "João Silva",
  email: "joao.silva@eletronjun.com.br",
  avatar: "",
  position: "Desenvolvedor",
  completedLessons: 12,
  level: 3,
  currentStreak: 7,
};

const mockLessons = {
  software: [
    {
      id: "1",
      title: "Intro ao React",
      status: "completed" as const,
      videoUrl: "https://www.youtube.com/embed/dGcsHMXbSOA",
      questions: [
        {
          id: "1",
          question: "O que é React?",
          options: ["Uma biblioteca JavaScript", "Uma linguagem de programação", "Um banco de dados", "Um servidor web"],
          correctAnswer: 0
        },
        {
          id: "2", 
          question: "Qual hook é usado para gerenciar estado?",
          options: ["useEffect", "useState", "useContext", "useCallback"],
          correctAnswer: 1
        }
      ]
    },
    {
      id: "2", 
      title: "Components",
      status: "available" as const,
      questions: []
    },
    {
      id: "3",
      title: "Hooks",
      status: "locked" as const,
      questions: []
    },
  ],
  eletronica: [
    {
      id: "e1",
      title: "Circuitos Básicos",
      status: "available" as const,
      questions: []
    }
  ]
};

const mockRankings = [
  { id: "1", name: "Maria Santos", completedLessons: 25, position: "Líder Técnica" },
  { id: "2", name: "Pedro Costa", completedLessons: 23, position: "Desenvolvedor Senior" },
  { id: "3", name: "Ana Oliveira", completedLessons: 20, position: "Product Manager" },
];

const Index = () => {
  const [selectedCategory, setSelectedCategory] = useState("software");
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [showRanking, setShowRanking] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [lessons, setLessons] = useState(mockLessons);

  const currentLessons = lessons[selectedCategory as keyof typeof lessons] || [];
  const currentLevel = mockUser.level;

  const handleLessonClick = (lesson: any) => {
    if (lesson.status !== "locked") {
      setSelectedLesson(lesson);
    }
  };

  const handleLessonComplete = (lessonId: string, passed: boolean) => {
    if (passed) {
      // Atualizar status da lição e desbloquear próxima
      setLessons(prev => {
        const updated = { ...prev };
        const categoryLessons = updated[selectedCategory as keyof typeof updated];
        if (categoryLessons) {
          const lessonIndex = categoryLessons.findIndex(l => l.id === lessonId);
          if (lessonIndex !== -1) {
            categoryLessons[lessonIndex].status = "completed";
            if (lessonIndex + 1 < categoryLessons.length) {
              categoryLessons[lessonIndex + 1].status = "available";
            }
          }
        }
        return updated;
      });
    }
    setSelectedLesson(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-card/80 backdrop-blur-sm border-b border-border shadow-soft">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-primary rounded-xl p-2">
                <span className="text-primary-foreground font-bold text-xl">📚</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">CapacitaJUN</h1>
                <p className="text-xs text-muted-foreground">Sistema de Capacitações</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRanking(true)}
                className="border-border hover:border-primary/20"
              >
                <Trophy className="h-4 w-4" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="border-border hover:border-primary/20"
              >
                <User className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Category Selector */}
        <div className="flex justify-center">
          <CategorySelector
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
          />
        </div>

        {/* Learning Path */}
        <LearningPath
          lessons={currentLessons}
          currentLevel={currentLevel}
          onLessonClick={handleLessonClick}
        />

        {/* Floating Profile Card - Mobile */}
        <div className="md:hidden fixed bottom-4 right-4 z-30">
          <Button
            onClick={() => setShowProfile(true)}
            className="bg-gradient-primary shadow-strong rounded-full w-14 h-14"
          >
            <User className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Modals */}
      <LessonModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onComplete={handleLessonComplete}
      />

      <RankingModal
        isOpen={showRanking}
        onClose={() => setShowRanking(false)}
        rankings={mockRankings}
        month="Janeiro 2024"
      />

      {/* Profile Modal/Sidebar */}
      {showProfile && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
          <div className="w-full max-w-md">
            <UserProfile
              user={mockUser}
              onEditProfile={() => {
                // Implementar edição de perfil
                setShowProfile(false);
              }}
            />
            <Button
              variant="outline"
              className="w-full mt-4 border-border hover:border-primary/20"
              onClick={() => setShowProfile(false)}
            >
              Fechar
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
