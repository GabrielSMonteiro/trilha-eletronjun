import { useState, useRef, useCallback, useEffect } from 'react';
import { SoundState, PresetConfig, AVAILABLE_SOUNDS } from '@/types/cafe';

export const useCafeAudio = () => {
  const [sounds, setSounds] = useState<Record<string, SoundState>>({});
  const [masterVolume, setMasterVolume] = useState(0.8);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const initAudioContext = useCallback(() => {
    if (audioContextRef.current) return;
    
    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    masterGainRef.current = audioContextRef.current.createGain();
    masterGainRef.current.connect(audioContextRef.current.destination);
    masterGainRef.current.gain.value = masterVolume;
    
    setIsInitialized(true);
  }, [masterVolume]);

  const loadSound = useCallback(async (soundId: string) => {
    if (!audioContextRef.current || sounds[soundId]?.audioElement) return;

    const soundInfo = AVAILABLE_SOUNDS.find(s => s.id === soundId);
    if (!soundInfo) {
      console.warn(`Sound info não encontrada para: ${soundId}`);
      return;
    }

    // O arquivo agora vem diretamente do soundInfo
    const audio = new Audio(soundInfo.file);
    audio.loop = true;
    audio.volume = 0; // controlado via GainNode

    try {
      const source = audioContextRef.current.createMediaElementSource(audio);
      const gainNode = audioContextRef.current.createGain();
      const pannerNode = audioContextRef.current.createStereoPanner();

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
    } catch (err) {
      console.error(`Erro ao carregar som ${soundId}:`, err);
    }
  }, [sounds]);

  const playSound = useCallback((soundId: string) => {
    const sound = sounds[soundId];
    if (!sound?.audioElement) return;

    sound.audioElement.play().catch(err => {
      console.error('Error playing sound:', err);
    });

    setSounds(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], isPlaying: true },
    }));
  }, [sounds]);

  const pauseSound = useCallback((soundId: string) => {
    const sound = sounds[soundId];
    if (!sound?.audioElement) return;

    sound.audioElement.pause();

    setSounds(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], isPlaying: false },
    }));
  }, [sounds]);

  const setVolume = useCallback((soundId: string, volume: number) => {
    const sound = sounds[soundId];
    if (!sound?.gainNode) return;

    sound.gainNode.gain.value = volume;

    setSounds(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], volume },
    }));
  }, [sounds]);

  const setPan = useCallback((soundId: string, pan: number) => {
    const sound = sounds[soundId];
    if (!sound?.pannerNode) return;

    sound.pannerNode.pan.value = pan;

    setSounds(prev => ({
      ...prev,
      [soundId]: { ...prev[soundId], pan },
    }));
  }, [sounds]);

  const setMasterVolumeValue = useCallback((volume: number) => {
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
    setMasterVolume(volume);
  }, []);

  const playAll = useCallback(() => {
    Object.keys(sounds).forEach(soundId => {
      if (sounds[soundId].volume > 0) {
        playSound(soundId);
      }
    });
  }, [sounds, playSound]);

  const pauseAll = useCallback(() => {
    Object.keys(sounds).forEach(soundId => pauseSound(soundId));
  }, [sounds, pauseSound]);

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

  useEffect(() => {
    return () => {
      Object.values(sounds).forEach(sound => {
        sound.audioElement?.pause();
        sound.gainNode?.disconnect();
        sound.pannerNode?.disconnect();
      });
      audioContextRef.current?.close();
    };
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
  };
};
