import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { SoundState } from '@/types/cafe';
import { AVAILABLE_SOUNDS } from '@/types/cafe';

interface SoundTabBarProps {
  sounds: Record<string, SoundState>;
  onVolumeChange: (soundId: string, volume: number) => void;
  onTogglePlay: (soundId: string) => void;
}

export const SoundTabBar = ({ sounds, onVolumeChange, onTogglePlay }: SoundTabBarProps) => {
  const categories = [
    { 
      id: 'cafe', 
      name: 'Cafeteria',
      soundIds: ['ambiente', 'maquina', 'copos']
    },
    { 
      id: 'natureza', 
      name: 'Natureza',
      soundIds: ['chuva', 'natureza', 'rio', 'passaros', 'onda', 'lareira']
    },
    { 
      id: 'ruidos', 
      name: 'Ruídos',
      soundIds: ['white', 'brown', 'vento', 'borbulha', 'lava']
    },
    { 
      id: 'estudo', 
      name: 'Estudo',
      soundIds: ['teclado', 'paginas']
    },
  ];

  return (
    <Tabs defaultValue="cafe" className="w-full">
      <TabsList className="w-full bg-[var(--cafe-card)] border border-[var(--cafe-border)] mb-6 flex-wrap h-auto">
        {categories.map(category => (
          <TabsTrigger 
            key={category.id} 
            value={category.id}
            className="flex-1 data-[state=active]:bg-[var(--cafe-accent)] data-[state=active]:text-[var(--cafe-text)]"
          >
            {category.name}
          </TabsTrigger>
        ))}
      </TabsList>

      {categories.map(category => (
        <TabsContent key={category.id} value={category.id} className="space-y-4">
          {category.soundIds.map(soundId => {
            const soundInfo = AVAILABLE_SOUNDS.find(s => s.id === soundId);
            const sound = sounds[soundId];
            
            if (!soundInfo) return null;

            return (
              <div 
                key={soundId}
                className="flex items-center gap-4 p-4 bg-[var(--cafe-card)] rounded-lg border border-[var(--cafe-border)] hover:border-[var(--cafe-accent)] transition-all"
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onTogglePlay(soundId)}
                  className="h-10 w-10 rounded-full flex-shrink-0 hover:bg-[var(--cafe-accent)]/20"
                >
                  {sound?.isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>

                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm mb-1">{soundInfo.name}</h4>
                  <p className="text-xs text-[var(--cafe-text-muted)] mb-2">{soundInfo.description}</p>
                  
                  <div className="flex items-center gap-3">
                    <Volume2 className="h-4 w-4 text-[var(--cafe-text-muted)] flex-shrink-0" />
                    <Slider
                      value={[Math.round((sound?.volume || 0.5) * 100)]}
                      onValueChange={(values) => onVolumeChange(soundId, values[0] / 100)}
                      max={100}
                      step={1}
                      className="flex-1"
                    />
                    <span className="text-xs text-[var(--cafe-text-muted)] min-w-[3ch]">
                      {Math.round((sound?.volume || 0.5) * 100)}
                    </span>
                  </div>
                </div>

                {sound?.isPlaying && (
                  <div className="flex gap-1 ml-2">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-[var(--cafe-accent)] rounded-full animate-pulse"
                        style={{
                          height: `${Math.random() * 12 + 6}px`,
                          animationDelay: `${i * 0.15}s`,
                          animationDuration: '0.8s',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </TabsContent>
      ))}
    </Tabs>
  );
};
