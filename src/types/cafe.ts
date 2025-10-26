export interface SoundState {
  id: string;
  name: string;
  volume: number; // 0-1
  pan: number; // -1 a 1
  isPlaying: boolean;
  audioElement?: HTMLAudioElement;
  gainNode?: GainNode;
  pannerNode?: StereoPannerNode;
}

export interface PresetConfig {
  id: string;
  name: string;
  soundLevels: Record<string, number>;
  description?: string;
  isDefault: boolean;
  userId?: string;
}

export interface CafeState {
  sounds: Record<string, SoundState>;
  masterVolume: number;
  isGloballyPlaying: boolean;
  activePreset: string | null;
  timerActive: boolean;
  timerDuration: number;
}

export interface CafeSession {
  id: string;
  userId: string;
  durationMinutes: number;
  presetUsed?: string;
  pointsEarned: number;
  createdAt: string;
}

export const AVAILABLE_SOUNDS = [
  { id: 'barista', name: 'Barista', description: 'Sons de preparação' },
  { id: 'coffee-machine', name: 'Máquina de Café', description: 'Espresso em ação' },
  { id: 'coffee-cups', name: 'Xícaras', description: 'Louças e xícaras' },
  { id: 'customer-chatter', name: 'Conversas', description: 'Murmúrio ambiente' },
  { id: 'rain', name: 'Chuva', description: 'Chuva na janela' },
  { id: 'fireplace', name: 'Lareira', description: 'Fogo crepitando' },
  { id: 'keyboard-typing', name: 'Digitação', description: 'Teclado mecânico' },
  { id: 'pages-turning', name: 'Páginas', description: 'Folheando livros' },
] as const;

export const DEFAULT_PRESETS: PresetConfig[] = [
  {
    id: 'focus',
    name: 'Foco',
    description: 'Concentração e produtividade',
    isDefault: true,
    soundLevels: {
      'barista': 0.6,
      'customer-chatter': 0.4,
      'keyboard-typing': 0.5,
      'rain': 0.3,
    },
  },
  {
    id: 'relax',
    name: 'Relaxar',
    description: 'Relaxamento e pausas',
    isDefault: true,
    soundLevels: {
      'fireplace': 0.7,
      'rain': 0.5,
      'pages-turning': 0.3,
      'customer-chatter': 0.2,
    },
  },
  {
    id: 'study',
    name: 'Estudar',
    description: 'Sessões de estudo',
    isDefault: true,
    soundLevels: {
      'coffee-machine': 0.5,
      'customer-chatter': 0.6,
      'rain': 0.4,
      'keyboard-typing': 0.4,
    },
  },
];
