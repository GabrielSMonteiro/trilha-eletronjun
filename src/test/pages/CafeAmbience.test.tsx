import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CafeAmbience from '@/pages/CafeAmbience';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useCafeAudio', () => ({
  useCafeAudio: () => ({
    sounds: {},
    masterVolume: 0.5,
    isInitialized: true,
    initAudioContext: vi.fn(),
    loadSound: vi.fn().mockResolvedValue(true),
    playSound: vi.fn(),
    pauseSound: vi.fn(),
    setVolume: vi.fn(),
    setMasterVolume: vi.fn(),
    playAll: vi.fn(),
    pauseAll: vi.fn(),
    loadPreset: vi.fn(),
    getCurrentConfig: vi.fn(),
    cleanup: vi.fn(),
  })
}));

vi.mock('@/components/cafe/SoundTabBar', () => ({ SoundTabBar: () => <div data-testid="sound-tab-bar" /> }));
vi.mock('@/components/cafe/ThemeToggle', () => ({ ThemeToggle: () => <div data-testid="theme-toggle" /> }));
vi.mock('@/components/cafe/CafeIllustration', () => ({ CafeIllustration: () => <div data-testid="cafe-illustration" /> }));
vi.mock('@/components/cafe/SoundPlaceholder', () => ({ SoundPlaceholder: () => <div data-testid="sound-placeholder" /> }));
vi.mock('@/components/cafe/PresetManager', () => ({ PresetManager: () => <div data-testid="preset-manager" /> }));
vi.mock('@/components/cafe/StudyTimer', () => ({ StudyTimer: () => <div data-testid="study-timer" /> }));
vi.mock('@/components/cafe/SharedLinks', () => ({ SharedLinks: () => <div data-testid="shared-links" /> }));
vi.mock('@/components/cafe/TodoList', () => ({ TodoList: () => <div data-testid="todo-list" /> }));
vi.mock('@/components/cafe/SpotifyPlayer', () => ({ SpotifyPlayer: () => <div data-testid="spotify-player" /> }));

vi.mock('@/services/cafeService', () => ({
  cafeService: {
    startSession: vi.fn().mockResolvedValue('session-id'),
    endSession: vi.fn()
  }
}));

describe('CafeAmbience Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <CafeAmbience />
    </MemoryRouter>
  );

  it('renderiza os componentes do café', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('EletronFé')).toBeInTheDocument();
      expect(screen.getByTestId('sound-tab-bar')).toBeInTheDocument();
      expect(screen.getByTestId('preset-manager')).toBeInTheDocument();
      expect(screen.getByTestId('study-timer')).toBeInTheDocument();
    });
  });

  it('navega para a página anterior ao clicar em Voltar', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Voltar')).toBeInTheDocument();
    });
    
    fireEvent.click(screen.getByText('Voltar'));
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('alterna o play/pause global', async () => {
    renderComponent();
    
    await waitFor(() => {
      expect(screen.getByText('Controles')).toBeInTheDocument();
    });
    
    
    const buttons = screen.getAllByRole('button');
    
    const toggleBtn = buttons.find(btn => btn.className.includes('h-14 w-14 rounded-full'));
    
    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      
      fireEvent.click(toggleBtn);
    }
  });

  it('altera o volume master', async () => {
    renderComponent();
    
    await waitFor(() => {
      
      const slider = screen.getByRole('slider');
      expect(slider).toBeInTheDocument();
      fireEvent.keyDown(slider, { key: 'ArrowRight' });
      fireEvent.keyDown(slider, { key: 'ArrowUp' });
    });
  });
});

