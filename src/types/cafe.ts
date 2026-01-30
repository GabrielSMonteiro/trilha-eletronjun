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

// Mapeamento dos sons disponíveis com seus arquivos reais
export const AVAILABLE_SOUNDS = [
  { id: 'ambiente', name: 'Ambiente', description: 'Som ambiente de cafeteria', file: '/sounds/cafe/ambiente.mp3' },
  { id: 'chuva', name: 'Chuva', description: 'Chuva na janela', file: '/sounds/cafe/chuva_janela.mp3' },
  { id: 'teclado', name: 'Teclado', description: 'Digitação em teclado', file: '/sounds/cafe/teclado.mp3' },
  { id: 'lareira', name: 'Lareira', description: 'Fogo crepitando', file: '/sounds/cafe/lareira.mp3' },
  { id: 'paginas', name: 'Páginas', description: 'Folheando livros', file: '/sounds/cafe/paginas.mp3' },
  { id: 'vento', name: 'Vento', description: 'Vento suave', file: '/sounds/cafe/vento_noise.mp3' },
  { id: 'white', name: 'White Noise', description: 'Ruído branco relaxante', file: '/sounds/cafe/white_noise.mp3' },
  { id: 'brown', name: 'Brown Noise', description: 'Ruído marrom para foco', file: '/sounds/cafe/brown_noise.mp3' },
  { id: 'natureza', name: 'Natureza', description: 'Sons da natureza', file: '/sounds/cafe/natureza.mp3' },
  { id: 'rio', name: 'Rio', description: 'Água corrente', file: '/sounds/cafe/rio.mp3' },
  { id: 'passaros', name: 'Pássaros', description: 'Cantos de pássaros', file: '/sounds/cafe/passaros.mp3' },
  { id: 'maquina', name: 'Máquina de Café', description: 'Espresso em ação', file: '/sounds/cafe/maquina.mp3' },
  { id: 'copos', name: 'Copos', description: 'Louças e xícaras', file: '/sounds/cafe/copos.mp3' },
  { id: 'onda', name: 'Ondas', description: 'Ondas do mar', file: '/sounds/cafe/onda.mp3' },
  { id: 'borbulha', name: 'Borbulhas', description: 'Som de borbulhas', file: '/sounds/cafe/borbulha_noise.mp3' },
  { id: 'lava', name: 'Lava', description: 'Som de lava', file: '/sounds/cafe/lava.mp3' },
] as const;

export const DEFAULT_PRESETS: PresetConfig[] = [
  {
    id: 'focus',
    name: 'Foco',
    description: 'Concentração e produtividade',
    isDefault: true,
    soundLevels: {
      'ambiente': 0.5,
      'brown': 0.4,
      'teclado': 0.3,
    },
  },
  {
    id: 'relax',
    name: 'Relaxar',
    description: 'Relaxamento e pausas',
    isDefault: true,
    soundLevels: {
      'lareira': 0.6,
      'chuva': 0.5,
      'natureza': 0.3,
    },
  },
  {
    id: 'study',
    name: 'Estudar',
    description: 'Sessões de estudo',
    isDefault: true,
    soundLevels: {
      'maquina': 0.4,
      'ambiente': 0.5,
      'chuva': 0.3,
      'white': 0.2,
    },
  },
];
