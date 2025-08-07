import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Lock } from "lucide-react";

interface LessonNodeProps {
  id: string;
  title: string;
  status: "locked" | "available" | "completed";
  position: "left" | "center" | "right";
  onClick?: () => void;
}

export const LessonNode = ({ title, status, position, onClick }: LessonNodeProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-6 w-6" />;
      case "available":
        return <Play className="h-6 w-6" />;
      case "locked":
        return <Lock className="h-4 w-4" />;
    }
  };

  const getStatusStyles = () => {
    switch (status) {
      case "completed":
        return "bg-gradient-primary text-primary-foreground shadow-medium border-2 border-primary/20";
      case "available":
        return "bg-gradient-secondary text-secondary-foreground shadow-medium border-2 border-secondary/20 animate-bounce-gentle";
      case "locked":
        return "bg-muted text-muted-foreground shadow-soft border-2 border-border";
    }
  };

  const getPositionStyles = () => {
    switch (position) {
      case "left":
        return "self-start";
      case "center":
        return "self-center";
      case "right":
        return "self-end";
    }
  };

  return (
    <div className={cn("flex flex-col items-center gap-2 relative", getPositionStyles())}>
      {/* Pulse ring animation for available lessons */}
      {status === "available" && (
        <div className="absolute inset-0 rounded-full bg-secondary/30 animate-pulse-ring"></div>
      )}
      
      <Button
        onClick={onClick}
        disabled={status === "locked"}
        className={cn(
          "w-16 h-16 rounded-full transition-all duration-300 hover:scale-105 active:scale-95 relative z-10",
          getStatusStyles()
        )}
      >
        {getStatusIcon()}
      </Button>
      
      <span className={cn(
        "text-xs font-medium text-center max-w-20 leading-tight",
        status === "locked" ? "text-muted-foreground" : "text-foreground"
      )}>
        {title}
      </span>
    </div>
  );
};