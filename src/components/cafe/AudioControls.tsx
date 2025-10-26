import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, VolumeX, RotateCcw } from 'lucide-react';
import { VolumeSlider } from './VolumeSlider';

interface AudioControlsProps {
  masterVolume: number;
  isGloballyPlaying: boolean;
  onMasterVolumeChange: (volume: number) => void;
  onGlobalToggle: () => void;
  onMuteAll: () => void;
  onResetAll: () => void;
}

export const AudioControls = ({
  masterVolume,
  isGloballyPlaying,
  onMasterVolumeChange,
  onGlobalToggle,
  onMuteAll,
  onResetAll,
}: AudioControlsProps) => {
  return (
    <Card className="bg-gradient-to-br from-purple-900/60 to-purple-950/80 border-purple-700/40">
      <CardHeader>
        <CardTitle className="text-lg text-foreground">Controles Globais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-muted-foreground mb-2 block">
            Volume Master
          </label>
          <VolumeSlider
            value={masterVolume}
            onChange={onMasterVolumeChange}
            label="Volume Master"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={onGlobalToggle}
            className="w-full"
            variant={isGloballyPlaying ? "secondary" : "default"}
          >
            {isGloballyPlaying ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                Pausar Tudo
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Tocar Tudo
              </>
            )}
          </Button>

          <Button onClick={onMuteAll} variant="outline" className="w-full">
            <VolumeX className="h-4 w-4 mr-2" />
            Mutar
          </Button>
        </div>

        <Button onClick={onResetAll} variant="ghost" className="w-full">
          <RotateCcw className="h-4 w-4 mr-2" />
          Resetar Volumes
        </Button>
      </CardContent>
    </Card>
  );
};
