import { useEffect, useState } from "react";
import * as LucideIcons from "lucide-react";
import { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AchievementNotificationProps {
  name: string;
  description: string;
  badge_type: 'bronze' | 'silver' | 'gold' | 'special';
  icon_name: string;
  onClose: () => void;
}

export const AchievementNotification = ({
  name,
  description,
  badge_type,
  icon_name,
  onClose,
}: AchievementNotificationProps) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animate in
    setTimeout(() => setIsVisible(true), 100);

    // Auto close after 5 seconds
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500);
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'bronze':
        return 'from-amber-600 to-amber-800 border-amber-500';
      case 'silver':
        return 'from-slate-300 to-slate-500 border-slate-400';
      case 'gold':
        return 'from-yellow-400 to-yellow-600 border-yellow-500';
      case 'special':
        return 'from-purple-500 to-pink-600 border-purple-400';
      default:
        return 'from-secondary to-secondary-foreground border-border';
    }
  };

  const getBadgeIcon = (iconName: string): LucideIcon => {
    const Icon = (LucideIcons as any)[iconName];
    return Icon || LucideIcons.Award;
  };

  const Icon = getBadgeIcon(icon_name);

  return (
    <div
      className={`fixed top-20 right-4 z-[100] transition-all duration-500 transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
    >
      <Card
        className={`bg-gradient-to-br ${getBadgeColor(badge_type)} border-2 shadow-strong p-6 max-w-sm cursor-pointer hover:scale-105 transition-transform`}
        onClick={onClose}
      >
        <div className="flex items-center gap-4">
          {/* Icon */}
          <div className="bg-white/20 backdrop-blur-sm rounded-full p-4 animate-pulse">
            <Icon className="h-10 w-10 text-white" />
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="text-white/80 text-xs font-semibold uppercase tracking-wider mb-1">
              🏆 Nova Conquista!
            </div>
            <div className="text-white text-lg font-bold mb-1">{name}</div>
            <div className="text-white/90 text-sm">{description}</div>
            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
              {badge_type}
            </Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};
