import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";

interface BadgeData {
  id: string;
  name: string;
  description: string;
  badge_type: 'bronze' | 'silver' | 'gold' | 'special';
  icon_name: string;
}

interface BadgesDisplayProps {
  badges: BadgeData[];
  className?: string;
}

export const BadgesDisplay = ({ badges, className = "" }: BadgesDisplayProps) => {
  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'bronze':
        return 'bg-gradient-to-br from-amber-600 to-amber-800 border-amber-700';
      case 'silver':
        return 'bg-gradient-to-br from-slate-300 to-slate-500 border-slate-400';
      case 'gold':
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 border-yellow-500';
      case 'special':
        return 'bg-gradient-to-br from-purple-500 to-pink-600 border-purple-400';
      default:
        return 'bg-gradient-secondary border-border';
    }
  };

  const getBadgeIcon = (iconName: string): LucideIcon => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Award;
  };

  return (
    <Card className={`border-2 shadow-medium ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-foreground">
          <LucideIcons.Award className="h-5 w-5 text-warning" />
          Conquistas ({badges.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {badges.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <LucideIcons.Lock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Complete lições para desbloquear conquistas!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {badges.map((badge) => {
              const Icon = getBadgeIcon(badge.icon_name);
              return (
                <div
                  key={badge.id}
                  className={`group relative rounded-xl p-4 border-2 ${getBadgeColor(badge.badge_type)} transition-all duration-300 hover:scale-105 hover:shadow-strong cursor-pointer`}
                  title={badge.description}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className="bg-background/20 backdrop-blur-sm rounded-full p-3">
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm">{badge.name}</div>
                      <Badge variant="secondary" className="mt-1 text-xs">
                        {badge.badge_type}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs rounded-lg p-2 shadow-strong border border-border whitespace-nowrap">
                      {badge.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
