import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Settings } from "lucide-react";

interface UserProfileProps {
  user: {
    name: string;
    email: string;
    avatar?: string;
    position: string;
    completedLessons: number;
    level: number;
    currentStreak: number;
  };
  onEditProfile: () => void;
}

export const UserProfile = ({ user, onEditProfile }: UserProfileProps) => {
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="bg-card rounded-2xl p-6 shadow-medium border border-border">
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-primary/20">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold text-lg">
                {initials}
              </AvatarFallback>
            </Avatar>
            <Badge 
              variant="secondary" 
              className="absolute -bottom-1 -right-1 bg-gradient-secondary text-xs px-1.5 py-0.5"
            >
              {user.level}
            </Badge>
          </div>
          
          <div className="flex-1">
            <h3 className="font-bold text-lg text-foreground">{user.name}</h3>
            <p className="text-sm text-muted-foreground">{user.position}</p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>

        <Button 
          variant="outline" 
          size="sm" 
          onClick={onEditProfile}
          className="border-border hover:border-primary/20"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-accent rounded-xl">
          <Trophy className="h-5 w-5 text-warning mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Lições</p>
          <p className="font-bold text-foreground">{user.completedLessons}</p>
        </div>
        
        <div className="text-center p-3 bg-accent rounded-xl">
          <Star className="h-5 w-5 text-primary mx-auto mb-1" />
          <p className="text-xs text-muted-foreground">Nível</p>
          <p className="font-bold text-foreground">{user.level}</p>
        </div>
        
        <div className="text-center p-3 bg-accent rounded-xl">
          <div className="h-5 w-5 text-info mx-auto mb-1 rounded-full bg-info flex items-center justify-center">
            <span className="text-xs text-white font-bold">{user.currentStreak}</span>
          </div>
          <p className="text-xs text-muted-foreground">Sequência</p>
          <p className="font-bold text-foreground">{user.currentStreak} dias</p>
        </div>
      </div>
    </div>
  );
};