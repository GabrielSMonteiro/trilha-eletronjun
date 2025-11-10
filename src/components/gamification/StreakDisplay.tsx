import { Flame, Zap } from "lucide-react";

interface StreakDisplayProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export const StreakDisplay = ({ currentStreak, longestStreak, className = "" }: StreakDisplayProps) => {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return 'from-red-500 to-orange-600';
    if (streak >= 7) return 'from-orange-500 to-yellow-600';
    if (streak >= 3) return 'from-yellow-500 to-orange-500';
    return 'from-gray-500 to-gray-600';
  };

  return (
    <div className={`flex gap-4 ${className}`}>
      {/* Current Streak */}
      <div className={`flex-1 bg-gradient-to-br ${getStreakColor(currentStreak)} rounded-xl p-4 shadow-medium border-2 border-white/20`}>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/80 text-xs font-medium mb-1">Sequência Atual</div>
            <div className="text-white text-3xl font-bold flex items-center gap-2">
              {currentStreak}
              <Flame className="h-6 w-6" />
            </div>
            <div className="text-white/70 text-xs mt-1">
              {currentStreak === 0 ? 'Complete uma lição hoje!' : 'dias consecutivos'}
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Zap className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>

      {/* Longest Streak */}
      <div className="flex-1 bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-4 shadow-medium border-2 border-white/20">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-white/80 text-xs font-medium mb-1">Melhor Sequência</div>
            <div className="text-white text-3xl font-bold flex items-center gap-2">
              {longestStreak}
              <Flame className="h-6 w-6" />
            </div>
            <div className="text-white/70 text-xs mt-1">
              {longestStreak === 0 ? 'Continue estudando!' : 'recorde pessoal'}
            </div>
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
            <Flame className="h-8 w-8 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
};
