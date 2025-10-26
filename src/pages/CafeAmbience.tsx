import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Coffee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCafeAudio } from '@/hooks/useCafeAudio';
import { SoundMixer } from '@/components/cafe/SoundMixer';
import { AudioControls } from '@/components/cafe/AudioControls';
import { PresetManager } from '@/components/cafe/PresetManager';
import { StudyTimer } from '@/components/cafe/StudyTimer';
import { AVAILABLE_SOUNDS } from '@/types/cafe';
import { cafeService } from '@/services/cafeService';
import { toast } from 'sonner';

const CafeAmbience = () => {
  const navigate = useNavigate();
  const {
    sounds,
    masterVolume,
    isInitialized,
    initAudioContext,
    loadSound,
    playSound,
    pauseSound,
    setVolume,
    setMasterVolume,
    playAll,
    pauseAll,
    loadPreset,
    getCurrentConfig,
  } = useCafeAudio();

  const [isGloballyPlaying, setIsGloballyPlaying] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);

  useEffect(() => {
    initAudioContext();
    
    AVAILABLE_SOUNDS.forEach(sound => {
      loadSound(sound.id);
    });

    startSession();

    return () => {
      if (sessionId && sessionStartTime) {
        const durationMinutes = Math.round((Date.now() - sessionStartTime) / 60000);
        cafeService.endSession(sessionId, durationMinutes);
      }
    };
  }, []);

  const startSession = async () => {
    const id = await cafeService.startSession();
    if (id) {
      setSessionId(id);
      setSessionStartTime(Date.now());
    }
  };

  const handleTimerComplete = async (durationMinutes: number) => {
    if (sessionId) {
      await cafeService.endSession(sessionId, durationMinutes);
      const points = Math.floor(durationMinutes / 5);
      toast.success(`Você ganhou ${points} pontos! 🎉`);
      
      startSession();
    }
  };

  const handleGlobalToggle = useCallback(() => {
    if (isGloballyPlaying) {
      pauseAll();
      setIsGloballyPlaying(false);
    } else {
      playAll();
      setIsGloballyPlaying(true);
    }
  }, [isGloballyPlaying, playAll, pauseAll]);

  const handleMuteAll = useCallback(() => {
    pauseAll();
    setIsGloballyPlaying(false);
  }, [pauseAll]);

  const handleResetAll = useCallback(() => {
    AVAILABLE_SOUNDS.forEach(sound => {
      setVolume(sound.id, 0.5);
    });
    setMasterVolume(0.8);
  }, [setVolume, setMasterVolume]);

  const handleTogglePlay = useCallback((soundId: string) => {
    const sound = sounds[soundId];
    if (sound?.isPlaying) {
      pauseSound(soundId);
    } else {
      playSound(soundId);
    }
  }, [sounds, playSound, pauseSound]);

  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black flex items-center justify-center">
        <div className="text-center">
          <Coffee className="h-16 w-16 text-amber-500 mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">Preparando sua cafeteria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-purple-950 to-black">
      {/* Header */}
      <div className="bg-card/80 backdrop-blur-sm border-b border-border shadow-soft sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Coffee className="h-5 w-5 text-amber-500" />
                Cafeteria Virtual
              </h1>
              <p className="text-sm text-muted-foreground">
                Crie seu ambiente sonoro ideal para estudos
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Sound Mixers - 2 columns on large screens */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground mb-4">Sons Ambientes</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {AVAILABLE_SOUNDS.map((soundInfo) => {
                const sound = sounds[soundInfo.id];
                if (!sound) return null;

                return (
                  <SoundMixer
                    key={soundInfo.id}
                    sound={sound}
                    onVolumeChange={setVolume}
                    onTogglePlay={handleTogglePlay}
                  />
                );
              })}
            </div>
          </div>

          {/* Sidebar - Controls, Presets, Timer */}
          <div className="space-y-4">
            <AudioControls
              masterVolume={masterVolume}
              isGloballyPlaying={isGloballyPlaying}
              onMasterVolumeChange={setMasterVolume}
              onGlobalToggle={handleGlobalToggle}
              onMuteAll={handleMuteAll}
              onResetAll={handleResetAll}
            />

            <PresetManager
              onLoadPreset={loadPreset}
              getCurrentConfig={getCurrentConfig}
            />

            <StudyTimer onComplete={handleTimerComplete} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CafeAmbience;
