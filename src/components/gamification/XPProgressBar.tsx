import { Progress } from "@/components/ui/progress";
import { Trophy, Zap } from "lucide-react";

interface XPProgressBarProps {
  currentXP: number;
  currentLevel: number;
  className?: string;
}

export const XPProgressBar = ({ currentXP, currentLevel, className = "" }: XPProgressBarProps) => {
  // Calculate XP for current and next level
  const xpForCurrentLevel = Math.pow(currentLevel - 1, 2) * 100;
  const xpForNextLevel = Math.pow(currentLevel, 2) * 100;
  
  // Calculate progress percentage
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForNextLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min(100, (xpInCurrentLevel / xpNeededForNextLevel) * 100);

  return (
    <div className={`bg-card border-2 border-border rounded-xl p-4 shadow-medium ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-primary rounded-lg p-2">
            <Trophy className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Nível {currentLevel}</div>
            <div className="text-xs text-muted-foreground">{currentXP} XP Total</div>
          </div>
        </div>
        
        <div className="flex items-center gap-1 text-warning">
          <Zap className="h-4 w-4" />
          <span className="text-sm font-bold">{xpInCurrentLevel}/{xpNeededForNextLevel} XP</span>
        </div>
      </div>

      <Progress value={progressPercentage} className="h-3" />
      
      <div className="mt-2 text-center text-xs text-muted-foreground">
        {xpNeededForNextLevel - xpInCurrentLevel} XP para o próximo nível
      </div>
    </div>
  );
};
