import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause } from 'lucide-react';
import { VolumeSlider } from './VolumeSlider';
import { SoundState } from '@/types/cafe';

interface SoundMixerProps {
  sound: SoundState;
  onVolumeChange: (soundId: string, volume: number) => void;
  onTogglePlay: (soundId: string) => void;
}

export const SoundMixer = ({ sound, onVolumeChange, onTogglePlay }: SoundMixerProps) => {
  return (
    <Card className="bg-gradient-to-br from-purple-900/40 to-purple-950/60 border-purple-700/30 hover:border-purple-600/50 transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm text-foreground">{sound.name}</h3>
          <Button
            size="sm"
            variant={sound.isPlaying ? "secondary" : "outline"}
            onClick={() => onTogglePlay(sound.id)}
            className="h-8 w-8 p-0"
          >
            {sound.isPlaying ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
          </Button>
        </div>

        <VolumeSlider
          value={sound.volume}
          onChange={(vol) => onVolumeChange(sound.id, vol)}
          label={`Volume ${sound.name}`}
        />

        {sound.isPlaying && (
          <div className="mt-3 flex gap-1 justify-center">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-primary rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 16 + 8}px`,
                  animationDelay: `${i * 0.1}s`,
                  animationDuration: '0.6s',
                }}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
