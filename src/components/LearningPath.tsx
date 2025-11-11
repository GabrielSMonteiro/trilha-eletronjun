import { LessonNode } from "./LessonNode";
import { Badge } from "@/components/ui/badge";
import { Trophy, Target } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  status: "locked" | "available" | "completed";
  videoUrl?: string;
  questions?: any[];
}

interface LearningPathProps {
  lessons: Lesson[];
  currentLevel: number;
  onLessonClick: (lesson: Lesson) => void;
}

export const LearningPath = ({ lessons, currentLevel, onLessonClick }: LearningPathProps) => {
  const positions = ["center", "left", "right", "center", "right", "left"] as const;
  
  return (
    <div className="w-full max-w-2xl mx-auto px-2 sm:px-6">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8 bg-card rounded-xl sm:rounded-2xl p-3 sm:p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          <span className="text-sm sm:text-base font-semibold">Nível {currentLevel}</span>
        </div>
        <Badge variant="secondary" className="bg-gradient-secondary text-xs sm:text-sm">
          <Trophy className="h-3 w-3 mr-1" />
          {lessons.filter(l => l.status === "completed").length}/{lessons.length}
        </Badge>
      </div>

      {/* Learning Path */}
      <div className="space-y-8 sm:space-y-12 relative">
        {/* Path line */}
        <div className="absolute left-1/2 top-8 bottom-8 w-0.5 sm:w-1 bg-gradient-primary rounded-full transform -translate-x-1/2 opacity-20"></div>
        
        {lessons.map((lesson, index) => (
          <div key={lesson.id} className="relative">
            <LessonNode
              id={lesson.id}
              title={lesson.title}
              status={lesson.status}
              position={positions[index % positions.length]}
              onClick={() => onLessonClick(lesson)}
            />
          </div>
        ))}

        {/* Empty state or congratulations */}
        {lessons.length === 0 ? (
          <div className="text-center py-8">
            <div className="bg-card border-2 border-border rounded-2xl p-6 shadow-soft">
              <Target className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2 text-foreground">Nenhuma capacitação disponível</h3>
              <p className="text-sm text-muted-foreground">Não há lições disponíveis para esta categoria no momento.</p>
            </div>
          </div>
        ) : lessons.every(l => l.status === "completed") ? (
          <div className="text-center py-8">
            <div className="bg-gradient-primary rounded-2xl p-6 text-primary-foreground shadow-strong">
              <Trophy className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Parabéns!</h3>
              <p className="text-sm opacity-90">Você completou toda a trilha!</p>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};