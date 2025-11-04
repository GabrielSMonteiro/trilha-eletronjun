import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Pause, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useCafeAudio } from '@/hooks/useCafeAudio';
import { SoundTabBar } from '@/components/cafe/SoundTabBar';
import { ThemeToggle } from '@/components/cafe/ThemeToggle';
import { CafeIllustration } from '@/components/cafe/CafeIllustration';
import { SoundPlaceholder } from '@/components/cafe/SoundPlaceholder';
import { PresetManager } from '@/components/cafe/PresetManager';
import { StudyTimer } from '@/components/cafe/StudyTimer';
import { SharedLinks } from '@/components/cafe/SharedLinks';
import { TodoList } from '@/components/cafe/TodoList';
import { SpotifyPlayer } from '@/components/cafe/SpotifyPlayer';
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
      <div className="cafe-page min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-16 w-16 rounded-full bg-[var(--cafe-accent)] mx-auto mb-4 animate-pulse flex items-center justify-center">
            <span className="text-2xl">☕</span>
          </div>
          <p className="text-[var(--cafe-text-muted)]">Preparando sua cafeteria...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="cafe-page min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-10 backdrop-blur-sm bg-[var(--cafe-bg)]/80 border-b border-[var(--cafe-border)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="gap-2 hover:bg-[var(--cafe-accent)]/20"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          
          <div className="flex items-center gap-2">
            <SpotifyPlayer />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold mb-3 text-[var(--cafe-text)]">
            I Miss My Cafe
          </h1>
          <p className="text-lg text-[var(--cafe-text-muted)] mb-8">
            Aproveite e fique um pouco.
          </p>
          
          <CafeIllustration />
        </div>

        {/* Sound Placeholder Alert */}
        <SoundPlaceholder />

        {/* Controls Grid */}
        <div className="grid lg:grid-cols-[1fr,400px] gap-8 items-start">
          {/* Sound Controls */}
          <div className="space-y-6">
            {/* Master Controls */}
            <div className="bg-[var(--cafe-card)] rounded-xl p-6 border border-[var(--cafe-border)]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[var(--cafe-text)]">Controles</h2>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleGlobalToggle}
                  className="h-14 w-14 rounded-full bg-[var(--cafe-accent)] hover:bg-[var(--cafe-accent)]/80 text-white"
                >
                  {isGloballyPlaying ? (
                    <Pause className="h-6 w-6" />
                  ) : (
                    <Play className="h-6 w-6" />
                  )}
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Volume2 className="h-5 w-5 text-[var(--cafe-text-muted)] flex-shrink-0" />
                <Slider
                  value={[Math.round(masterVolume * 100)]}
                  onValueChange={(values) => setMasterVolume(values[0] / 100)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-sm text-[var(--cafe-text-muted)] min-w-[3ch]">
                  {Math.round(masterVolume * 100)}
                </span>
              </div>
            </div>

            {/* Sound Tab Bar */}
            <div className="bg-[var(--cafe-card)] rounded-xl p-6 border border-[var(--cafe-border)]">
              <SoundTabBar
                sounds={sounds}
                onVolumeChange={setVolume}
                onTogglePlay={handleTogglePlay}
              />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <PresetManager
              onLoadPreset={loadPreset}
              getCurrentConfig={getCurrentConfig}
            />

            <StudyTimer onComplete={handleTimerComplete} />
            
            <TodoList />
          </div>
        </div>

        {/* Shared Links Section */}
        <div className="mt-8">
          <SharedLinks />
        </div>
      </main>
    </div>
  );
};

export default CafeAmbience;
