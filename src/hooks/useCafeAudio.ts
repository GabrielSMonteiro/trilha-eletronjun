import { useState, useRef, useCallback } from 'react';
import { SoundState, PresetConfig, AVAILABLE_SOUNDS } from '@/types/cafe';

export const useCafeAudio = () => {
  const [sounds, setSounds] = useState<Record<string, SoundState>>({});
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const loadedSoundsRef = useRef<Set<string>>(new Set());

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) {
      setIsInitialized(true);
      return;
    }
    
    try {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = masterVolume;
      
      console.log('AudioContext initialized successfully');
      setIsInitialized(true);
    } catch (err) {
      console.error('Failed to initialize AudioContext:', err);
    }
  }, [masterVolume]);

  const resumeAudioContext = useCallback(async () => {
    if (audioContextRef.current?.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
        console.log('AudioContext resumed');
      } catch (err) {
        console.error('Failed to resume AudioContext:', err);
      }
    }
  }, []);

  const loadSound = useCallback(async (soundId: string) => {
    // Evitar carregar o mesmo som múltiplas vezes
    if (loadedSoundsRef.current.has(soundId)) {
      return;
    }

    if (!audioContextRef.current) {
      console.warn('AudioContext não inicializado');
      return;
    }

    const soundInfo = AVAILABLE_SOUNDS.find(s => s.id === soundId);
    if (!soundInfo) {
      console.warn(`Sound info não encontrada para: ${soundId}`);
      return;
    }

    loadedSoundsRef.current.add(soundId);

    try {
      const audio = new Audio(soundInfo.file);
      audio.loop = true;
      audio.crossOrigin = 'anonymous';
      
      // Esperar o áudio estar pronto para tocar
      await new Promise<void>((resolve, reject) => {
        audio.oncanplaythrough = () => resolve();
        audio.onerror = () => reject(new Error(`Failed to load ${soundInfo.file}`));
        audio.load();
      });

      const source = audioContextRef.current!.createMediaElementSource(audio);
      const gainNode = audioContextRef.current!.createGain();
      const pannerNode = audioContextRef.current!.createStereoPanner();

      gainNode.gain.value = 0.5;
      pannerNode.pan.value = 0;

      source.connect(gainNode);
      gainNode.connect(pannerNode);
      pannerNode.connect(masterGainRef.current!);

      setSounds(prev => ({
        ...prev,
        [soundId]: {
          id: soundId,
          name: soundInfo.name,
          volume: 0.5,
          pan: 0,
          isPlaying: false,
          audioElement: audio,
          gainNode,
          pannerNode,
        },
      }));

      console.log(`Som carregado: ${soundId}`);
    } catch (err) {
      console.error(`Erro ao carregar som ${soundId}:`, err);
      loadedSoundsRef.current.delete(soundId);
    }
  }, []);

  const playSound = useCallback(async (soundId: string) => {
    // Primeiro, garantir que o AudioContext está ativo
    await resumeAudioContext();

    setSounds(prev => {
      const sound = prev[soundId];
      if (!sound?.audioElement) {
        console.warn(`Som não carregado: ${soundId}`);
        return prev;
      }

      sound.audioElement.play().catch(err => {
        console.error('Error playing sound:', err);
      });

      return {
        ...prev,
        [soundId]: { ...prev[soundId], isPlaying: true },
      };
    });
  }, [resumeAudioContext]);

  const pauseSound = useCallback((soundId: string) => {
    setSounds(prev => {
      const sound = prev[soundId];
      if (!sound?.audioElement) return prev;

      sound.audioElement.pause();

      return {
        ...prev,
        [soundId]: { ...prev[soundId], isPlaying: false },
      };
    });
  }, []);

  const setVolume = useCallback((soundId: string, volume: number) => {
    setSounds(prev => {
      const sound = prev[soundId];
      if (!sound?.gainNode) return prev;

      sound.gainNode.gain.value = volume;

      return {
        ...prev,
        [soundId]: { ...prev[soundId], volume },
      };
    });
  }, []);

  const setPan = useCallback((soundId: string, pan: number) => {
    setSounds(prev => {
      const sound = prev[soundId];
      if (!sound?.pannerNode) return prev;

      sound.pannerNode.pan.value = pan;

      return {
        ...prev,
        [soundId]: { ...prev[soundId], pan },
      };
    });
  }, []);

  const setMasterVolumeValue = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
    setMasterVolume(volume);
  }, []);

  const playAll = useCallback(async () => {
    await resumeAudioContext();
    
    setSounds(prev => {
      const newSounds = { ...prev };
      Object.keys(newSounds).forEach(soundId => {
        const sound = newSounds[soundId];
        if (sound?.audioElement && sound.volume > 0) {
          sound.audioElement.play().catch(console.error);
          newSounds[soundId] = { ...sound, isPlaying: true };
        }
      });
      return newSounds;
    });
  }, [resumeAudioContext]);

  const pauseAll = useCallback(() => {
    setSounds(prev => {
      const newSounds = { ...prev };
      Object.keys(newSounds).forEach(soundId => {
        const sound = newSounds[soundId];
        if (sound?.audioElement) {
          sound.audioElement.pause();
          newSounds[soundId] = { ...sound, isPlaying: false };
        }
      });
      return newSounds;
    });
  }, []);

  const loadPreset = useCallback((preset: PresetConfig) => {
    Object.entries(preset.soundLevels).forEach(([soundId, volume]) => {
      setVolume(soundId, volume);
    });
  }, [setVolume]);

  const getCurrentConfig = useCallback((): Omit<PresetConfig, 'id'> => {
    const soundLevels: Record<string, number> = {};
    Object.entries(sounds).forEach(([id, sound]) => {
      soundLevels[id] = sound.volume;
    });

    return {
      name: 'Custom',
      soundLevels,
      description: 'Configuração personalizada',
      isDefault: false,
    };
  }, [sounds]);

  // Cleanup é feito via useEffect no componente pai se necessário
  const cleanup = useCallback(() => {
    Object.values(sounds).forEach(sound => {
      sound.audioElement?.pause();
      sound.gainNode?.disconnect();
      sound.pannerNode?.disconnect();
    });
    audioContextRef.current?.close();
    loadedSoundsRef.current.clear();
  }, [sounds]);

  return {
    sounds,
    masterVolume,
    isInitialized,
    initAudioContext,
    loadSound,
    playSound,
    pauseSound,
    setVolume,
    setPan,
    setMasterVolume: setMasterVolumeValue,
    playAll,
    pauseAll,
    loadPreset,
    getCurrentConfig,
    cleanup,
  };
};
