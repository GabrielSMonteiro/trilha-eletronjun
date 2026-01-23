import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { 
  Coffee, 
  KanbanSquare, 
  Pencil, 
  ChevronLeft, 
  ChevronRight,
  Trophy,
  Zap,
  Flame,
  Award,
  Menu
} from "lucide-react";
import { cn } from "@/lib/utils";

interface GamificationData {
  current_level: number;
  total_xp: number;
  current_streak: number;
}

interface QuickAccessSidebarProps {
  gamificationData: GamificationData | null;
  badgesCount: number;
  userId?: string;
  selectedLessonId?: string;
  onOpenKanban: () => void;
  onOpenNotes: () => void;
  isKanbanOpen: boolean;
  isNotesOpen: boolean;
}

export const QuickAccessSidebar = ({
  gamificationData,
  badgesCount,
  onOpenKanban,
  onOpenNotes,
  isKanbanOpen,
  isNotesOpen,
}: QuickAccessSidebarProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const navigate = useNavigate();

  const toggleSidebar = () => setIsExpanded(!isExpanded);

  return (
    <div
      className={cn(
        "fixed left-0 top-[72px] h-[calc(100vh-72px)] bg-card/95 backdrop-blur-sm border-r border-border shadow-medium z-30 transition-all duration-300 flex flex-col",
        isExpanded ? "w-64" : "w-14"
      )}
    >
      {/* Toggle Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={toggleSidebar}
        className="absolute -right-3 top-4 w-6 h-6 rounded-full bg-card border border-border shadow-sm p-0 hover:bg-accent"
      >
        {isExpanded ? (
          <ChevronLeft className="h-3 w-3" />
        ) : (
          <ChevronRight className="h-3 w-3" />
        )}
      </Button>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Gamification Summary - Compact */}
        {gamificationData && (
          <div className={cn("space-y-2", !isExpanded && "hidden")}>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              Seu Progresso
            </h3>
            
            {/* Level Card */}
            <Card className="p-3 bg-gradient-to-br from-purple-600 to-purple-800 border-purple-500/50">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Trophy className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/70 text-[10px] font-medium">Nível</div>
                  <div className="text-white text-lg font-bold leading-tight">
                    {gamificationData.current_level}
                  </div>
                </div>
              </div>
            </Card>

            {/* XP Card */}
            <Card className="p-3 bg-gradient-to-br from-amber-500 to-orange-600 border-amber-500/50">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Zap className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/70 text-[10px] font-medium">Total XP</div>
                  <div className="text-white text-lg font-bold leading-tight">
                    {gamificationData.total_xp}
                  </div>
                </div>
              </div>
            </Card>

            {/* Streak Card */}
            <Card className="p-3 bg-gradient-to-br from-red-500 to-orange-500 border-red-500/50">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Flame className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/70 text-[10px] font-medium">Sequência</div>
                  <div className="text-white text-lg font-bold leading-tight">
                    {gamificationData.current_streak} dias
                  </div>
                </div>
              </div>
            </Card>

            {/* Badges Card */}
            <Card className="p-3 bg-gradient-to-br from-blue-600 to-indigo-700 border-blue-500/50">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 rounded-full p-1.5">
                  <Award className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white/70 text-[10px] font-medium">Conquistas</div>
                  <div className="text-white text-lg font-bold leading-tight">
                    {badgesCount}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Collapsed state - show icons only */}
        {!isExpanded && gamificationData && (
          <div className="space-y-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center mx-auto" title={`Nível ${gamificationData.current_level}`}>
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mx-auto" title={`${gamificationData.total_xp} XP`}>
              <Zap className="h-4 w-4 text-white" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mx-auto" title={`${gamificationData.current_streak} dias de sequência`}>
              <Flame className="h-4 w-4 text-white" />
            </div>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center mx-auto" title={`${badgesCount} conquistas`}>
              <Award className="h-4 w-4 text-white" />
            </div>
          </div>
        )}

        {/* Divider */}
        <div className={cn("border-t border-border my-3", !isExpanded && "mx-1")} />

        {/* Quick Access Buttons */}
        <div className={cn("space-y-2", !isExpanded && "hidden")}>
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Ferramentas
          </h3>
        </div>

        {/* Café Button */}
        <Button
          onClick={() => navigate('/cafe')}
          className={cn(
            "bg-gradient-to-br from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-md transition-all duration-300",
            isExpanded ? "w-full justify-start gap-3" : "w-8 h-8 p-0 mx-auto"
          )}
          title="Cafeteria Virtual"
        >
          <Coffee className="h-4 w-4" />
          {isExpanded && <span>Cafeteria Virtual</span>}
        </Button>

        {/* Kanban Button */}
        <Button
          onClick={onOpenKanban}
          variant={isKanbanOpen ? "default" : "outline"}
          className={cn(
            "transition-all duration-300",
            isKanbanOpen 
              ? "bg-gradient-to-br from-purple-500 to-indigo-600 text-white" 
              : "hover:border-purple-500/50",
            isExpanded ? "w-full justify-start gap-3" : "w-8 h-8 p-0 mx-auto"
          )}
          title="Meu Progresso"
        >
          <KanbanSquare className="h-4 w-4" />
          {isExpanded && <span>Meu Progresso</span>}
        </Button>

        {/* Notes Button */}
        <Button
          onClick={onOpenNotes}
          variant={isNotesOpen ? "default" : "outline"}
          className={cn(
            "transition-all duration-300",
            isNotesOpen 
              ? "bg-gradient-to-br from-amber-500 to-orange-600 text-white" 
              : "hover:border-orange-500/50",
            isExpanded ? "w-full justify-start gap-3" : "w-8 h-8 p-0 mx-auto"
          )}
          title="Anotações"
        >
          <Pencil className="h-4 w-4" />
          {isExpanded && <span>Anotações</span>}
        </Button>
      </div>
    </div>
  );
};

// Mobile version - bottom sheet trigger
export const QuickAccessMobileTrigger = ({
  onOpenSidebar,
}: {
  onOpenSidebar: () => void;
}) => {
  return (
    <Button
      onClick={onOpenSidebar}
      className="fixed bottom-4 left-4 h-12 w-12 rounded-full bg-gradient-primary shadow-strong z-50 md:hidden"
      size="icon"
    >
      <Menu className="h-5 w-5" />
    </Button>
  );
};
