import { Coffee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export const CafeTriggerButton = () => {
  const navigate = useNavigate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={() => navigate('/cafe')}
          className="fixed bottom-4 right-4 h-14 w-14 rounded-full bg-gradient-to-br from-amber-600 to-amber-700 shadow-strong hover:scale-110 hover:shadow-[0_0_30px_rgba(217,119,6,0.5)] transition-all duration-300 z-50"
          size="icon"
        >
          <Coffee className="h-6 w-6 text-white" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="left" className="bg-card border-border">
        <p className="text-sm font-medium">Cafeteria Virtual</p>
        <p className="text-xs text-muted-foreground">Sons ambientes para estudo</p>
      </TooltipContent>
    </Tooltip>
  );
};
