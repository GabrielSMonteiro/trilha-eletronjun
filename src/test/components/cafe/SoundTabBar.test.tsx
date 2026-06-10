import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SoundTabBar } from '@/components/cafe/SoundTabBar';

describe('SoundTabBar', () => {
  const mockSounds: Record<string, any> = {
    'chuva': { id: 'chuva', name: 'Chuva', volume: 0.5, pan: 0, isPlaying: true },
    'lareira': { id: 'lareira', name: 'Lareira', volume: 0.8, pan: 0, isPlaying: false },
    'ambiente': { id: 'ambiente', name: 'Ambiente', volume: 0.5, pan: 0, isPlaying: false },
  };

  const mockTogglePlay = vi.fn();
  const mockVolumeChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza as abas de categorias', () => {
    render(
      <SoundTabBar
        sounds={mockSounds}
        onTogglePlay={mockTogglePlay}
        onVolumeChange={mockVolumeChange}
      />
    );

    expect(screen.getByText('Natureza')).toBeInTheDocument();
    expect(screen.getByText('Cafeteria')).toBeInTheDocument();
    expect(screen.getByText('Ruídos')).toBeInTheDocument();
    expect(screen.getByText('Estudo')).toBeInTheDocument();
  });

  it('exibe sons na aba de Natureza', async () => {
    const user = userEvent.setup();
    render(
      <SoundTabBar
        sounds={mockSounds}
        onTogglePlay={mockTogglePlay}
        onVolumeChange={mockVolumeChange}
      />
    );

    const tabNatureza = screen.getByRole('tab', { name: 'Natureza' });
    await user.click(tabNatureza);

    await waitFor(() => {
      expect(screen.getByText('Chuva')).toBeInTheDocument();
    });
  });

  it('aciona o onTogglePlay ao clicar no botão de play', async () => {
    const user = userEvent.setup();
    render(
      <SoundTabBar
        sounds={mockSounds}
        onTogglePlay={mockTogglePlay}
        onVolumeChange={mockVolumeChange}
      />
    );

    
    const ambienteHeader = await screen.findByText('Ambiente');
    
    const container = ambienteHeader.closest('div.flex.items-center');
    const playBtn = container!.querySelector('button');

    await user.click(playBtn!);

    expect(mockTogglePlay).toHaveBeenCalledWith('ambiente');
  });

  it('aciona onVolumeChange ao usar o slider', async () => {
    const user = userEvent.setup();
    render(
      <SoundTabBar
        sounds={mockSounds}
        onTogglePlay={mockTogglePlay}
        onVolumeChange={mockVolumeChange}
      />
    );

    const ambienteHeader = await screen.findByText('Ambiente');
    const container = ambienteHeader.closest('div.flex.items-center');
    const slider = container!.querySelector('[role="slider"]') as HTMLElement;

    
    slider.focus();
    await user.keyboard('{ArrowRight}');

    
    
    expect(mockVolumeChange).toHaveBeenCalledWith('ambiente', 0.51);
  });
});
