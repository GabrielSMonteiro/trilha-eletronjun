import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCafeAudio } from '@/hooks/useCafeAudio';
import { AVAILABLE_SOUNDS } from '@/types/cafe';

const mockConnect = vi.fn();
const mockDisconnect = vi.fn();

const mockGainNode = {
  gain: { value: 0 },
  connect: mockConnect,
  disconnect: mockDisconnect,
};

const mockPannerNode = {
  pan: { value: 0 },
  connect: mockConnect,
  disconnect: mockDisconnect,
};

const mockCreateMediaElementSource = vi.fn(() => ({
  connect: mockConnect,
}));

const mockResume = vi.fn().mockResolvedValue(undefined);
const mockClose = vi.fn().mockResolvedValue(undefined);

class MockAudioContext {
  state = 'suspended';
  createGain = vi.fn(() => mockGainNode);
  createStereoPanner = vi.fn(() => mockPannerNode);
  createMediaElementSource = mockCreateMediaElementSource;
  destination = {};
  resume = mockResume;
  close = mockClose;
}

const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockPause = vi.fn();
const mockLoad = vi.fn(function (this: any) {
  if (this.oncanplaythrough) {
    this.oncanplaythrough();
  }
});

class MockAudio {
  src = '';
  loop = false;
  crossOrigin = '';
  oncanplaythrough: (() => void) | null = null;
  onerror: (() => void) | null = null;
  play = mockPlay;
  pause = mockPause;
  load = mockLoad;

  constructor(src: string) {
    this.src = src;
  }
}

describe('useCafeAudio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (window as any).AudioContext = MockAudioContext;
    (window as any).Audio = MockAudio;
  });

  it('inicializa corretamente com volume master padrão', () => {
    const { result } = renderHook(() => useCafeAudio());

    expect(result.current.isInitialized).toBe(false);
    expect(result.current.masterVolume).toBe(0.8);
    expect(result.current.sounds).toEqual({});
  });

  it('inicializa o AudioContext', () => {
    const { result } = renderHook(() => useCafeAudio());

    act(() => {
      result.current.initAudioContext();
    });

    expect(result.current.isInitialized).toBe(true);
  });

  it('carrega um som corretamente', async () => {
    const { result } = renderHook(() => useCafeAudio());

    act(() => {
      result.current.initAudioContext();
    });

    // Mockar o AVAILABLE_SOUNDS se precisar, mas vamos usar o primeiro do array real
    const firstSound = AVAILABLE_SOUNDS[0];

    await act(async () => {
      await result.current.loadSound(firstSound.id);
    });

    expect(result.current.sounds[firstSound.id]).toBeDefined();
    expect(result.current.sounds[firstSound.id].name).toBe(firstSound.name);
    expect(result.current.sounds[firstSound.id].volume).toBe(0.5);
  });

  it('toca e pausa um som carregado', async () => {
    const { result } = renderHook(() => useCafeAudio());

    act(() => {
      result.current.initAudioContext();
    });

    const firstSound = AVAILABLE_SOUNDS[0];

    await act(async () => {
      await result.current.loadSound(firstSound.id);
    });

    await act(async () => {
      await result.current.playSound(firstSound.id);
    });

    expect(mockPlay).toHaveBeenCalled();
    expect(result.current.sounds[firstSound.id].isPlaying).toBe(true);

    act(() => {
      result.current.pauseSound(firstSound.id);
    });

    expect(mockPause).toHaveBeenCalled();
    expect(result.current.sounds[firstSound.id].isPlaying).toBe(false);
  });

  it('altera volume e pan de um som', async () => {
    const { result } = renderHook(() => useCafeAudio());
    act(() => result.current.initAudioContext());

    const firstSound = AVAILABLE_SOUNDS[0];
    await act(async () => {
      await result.current.loadSound(firstSound.id);
    });

    act(() => {
      result.current.setVolume(firstSound.id, 0.7);
      result.current.setPan(firstSound.id, -0.5);
    });

    expect(result.current.sounds[firstSound.id].volume).toBe(0.7);
    expect(result.current.sounds[firstSound.id].pan).toBe(-0.5);
  });

  it('toca e pausa todos os sons', async () => {
    const { result } = renderHook(() => useCafeAudio());
    act(() => result.current.initAudioContext());

    const s1 = AVAILABLE_SOUNDS[0];
    await act(async () => {
      await result.current.loadSound(s1.id);
    });

    await act(async () => {
      await result.current.playAll();
    });

    expect(result.current.sounds[s1.id].isPlaying).toBe(true);

    act(() => {
      result.current.pauseAll();
    });

    expect(result.current.sounds[s1.id].isPlaying).toBe(false);
  });

  it('limpa os recursos no cleanup', async () => {
    const { result } = renderHook(() => useCafeAudio());
    act(() => result.current.initAudioContext());

    const s1 = AVAILABLE_SOUNDS[0];
    await act(async () => {
      await result.current.loadSound(s1.id);
    });

    act(() => {
      result.current.cleanup();
    });

    expect(mockPause).toHaveBeenCalled();
    expect(mockDisconnect).toHaveBeenCalled();
    expect(mockClose).toHaveBeenCalled();
  });
});
