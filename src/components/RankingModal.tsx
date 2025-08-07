import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Trophy, Medal, Award } from "lucide-react";

interface RankingUser {
  id: string;
  name: string;
  avatar?: string;
  completedLessons: number;
  position: string;
}

interface RankingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rankings: RankingUser[];
  month: string;
}

export const RankingModal = ({ isOpen, onClose, rankings, month }: RankingModalProps) => {
  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Award className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-muted-foreground">#{position}</span>;
    }
  };

  const getPositionBadge = (position: number) => {
    switch (position) {
      case 1:
        return "bg-gradient-to-r from-yellow-400 to-yellow-600 text-white";
      case 2:
        return "bg-gradient-to-r from-gray-300 to-gray-500 text-white";
      case 3:
        return "bg-gradient-to-r from-amber-400 to-amber-600 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto bg-card border-2 border-border shadow-strong rounded-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="text-xl font-bold flex items-center justify-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Ranking do Mês
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{month}</p>
        </DialogHeader>
        
        <div className="space-y-4 mt-6">
          {rankings.slice(0, 3).map((user, index) => {
            const position = index + 1;
            const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
            
            return (
              <div 
                key={user.id}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all ${
                  position === 1 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-200' :
                  position === 2 ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200' :
                  'bg-gradient-to-r from-amber-50 to-amber-100 border-2 border-amber-200'
                }`}
              >
                <div className="flex items-center justify-center w-12 h-12">
                  {getPositionIcon(position)}
                </div>
                
                <Avatar className="h-12 w-12 border-2 border-white shadow-soft">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{user.name}</h4>
                  <p className="text-xs text-muted-foreground">{user.position}</p>
                </div>
                
                <div className="text-right">
                  <Badge className={`${getPositionBadge(position)} font-bold`}>
                    {user.completedLessons} lições
                  </Badge>
                </div>
              </div>
            );
          })}
          
          {/* Message for users not in top 3 */}
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">
              Continue se capacitando para aparecer no próximo ranking! 🚀
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};