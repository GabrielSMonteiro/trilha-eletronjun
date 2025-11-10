import { Trophy, Zap, Flame, Award } from "lucide-react";
import { Card } from "@/components/ui/card";

interface GamificationSummaryProps {
  level: number;
  xp: number;
  streak: number;
  badgesCount: number;
  className?: string;
}

export const GamificationSummary = ({
  level,
  xp,
  streak,
  badgesCount,
  className = "",
}: GamificationSummaryProps) => {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
      {/* Level */}
      <Card className="p-4 bg-gradient-to-br from-purple-600 to-purple-800 border-2 border-purple-500/50 shadow-medium hover:shadow-strong transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Trophy className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium">Nível</div>
            <div className="text-white text-2xl font-bold">{level}</div>
          </div>
        </div>
      </Card>

      {/* XP */}
      <Card className="p-4 bg-gradient-to-br from-amber-500 to-orange-600 border-2 border-amber-500/50 shadow-medium hover:shadow-strong transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium">Total XP</div>
            <div className="text-white text-2xl font-bold">{xp}</div>
          </div>
        </div>
      </Card>

      {/* Streak */}
      <Card className="p-4 bg-gradient-to-br from-red-500 to-orange-500 border-2 border-red-500/50 shadow-medium hover:shadow-strong transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Flame className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium">Sequência</div>
            <div className="text-white text-2xl font-bold">{streak} dias</div>
          </div>
        </div>
      </Card>

      {/* Badges */}
      <Card className="p-4 bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-500/50 shadow-medium hover:shadow-strong transition-all duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-2">
            <Award className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="text-white/70 text-xs font-medium">Conquistas</div>
            <div className="text-white text-2xl font-bold">{badgesCount}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};
