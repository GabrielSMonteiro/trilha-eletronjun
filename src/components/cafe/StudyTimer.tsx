import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, RotateCcw, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface StudyTimerProps {
  onComplete: (durationMinutes: number) => void;
}

const PRESET_TIMES = [5, 15, 30, 45, 60];

export const StudyTimer = ({ onComplete }: StudyTimerProps) => {
  const [selectedTime, setSelectedTime] = useState(30);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const handleComplete = () => {
    setIsRunning(false);
    const minutesStudied = Math.round((Date.now() - startTimeRef.current) / 60000);
    onComplete(minutesStudied);
    toast.success('🎉 Sessão de estudo concluída!', {
      description: `Você estudou por ${minutesStudied} minutos`,
    });
    
    if (Notification.permission === 'granted') {
      new Notification('CapacitaJun - Timer Completo', {
        body: `Sua sessão de ${minutesStudied} minutos foi concluída!`,
        icon: '/favicon.ico',
      });
    }
    
    handleReset();
  };

  const handleStart = () => {
    if (!hasStarted) {
      setHasStarted(true);
      startTimeRef.current = Date.now();
      
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleReset = () => {
    setIsRunning(false);
    setHasStarted(false);
    setTimeRemaining(selectedTime * 60);
  };

  const handleTimeSelect = (minutes: number) => {
    if (!hasStarted) {
      setSelectedTime(minutes);
      setTimeRemaining(minutes * 60);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((selectedTime * 60 - timeRemaining) / (selectedTime * 60)) * 100;

  return (
    <Card className="bg-gradient-to-br from-purple-900/60 to-purple-950/80 border-purple-700/40">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Timer de Estudo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className="text-4xl font-bold text-foreground mb-2">
            {formatTime(timeRemaining)}
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {!hasStarted && (
          <div className="grid grid-cols-5 gap-2">
            {PRESET_TIMES.map((time) => (
              <Button
                key={time}
                size="sm"
                variant={selectedTime === time ? "default" : "outline"}
                onClick={() => handleTimeSelect(time)}
                className="text-xs"
              >
                {time}m
              </Button>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          {!isRunning ? (
            <Button onClick={handleStart} className="flex-1">
              <Play className="h-4 w-4 mr-2" />
              {hasStarted ? 'Retomar' : 'Iniciar'}
            </Button>
          ) : (
            <Button onClick={handlePause} variant="secondary" className="flex-1">
              <Pause className="h-4 w-4 mr-2" />
              Pausar
            </Button>
          )}
          
          {hasStarted && (
            <Button onClick={handleReset} variant="outline">
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {hasStarted && (
          <p className="text-xs text-muted-foreground text-center">
            Você ganha 1 ponto a cada 5 minutos de estudo
          </p>
        )}
      </CardContent>
    </Card>
  );
};
