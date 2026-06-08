import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SoundMixer } from '@/components/cafe/SoundMixer';

describe('SoundMixer', () => {
  const mockSound = {
    id: 'chuva',
    name: 'Chuva',
    volume: 0.5,
    pan: 0,
    isPlaying: false,
  };

  it('renderiza o nome do som', () => {
    render(
      <SoundMixer
        sound={mockSound}
        onVolumeChange={vi.fn()}
        onTogglePlay={vi.fn()}
      />
    );
    expect(screen.getByText('Chuva')).toBeInTheDocument();
  });

  it('exibe o botão Play quando o som não está tocando', () => {
    const { container } = render(
      <SoundMixer
        sound={mockSound}
        onVolumeChange={vi.fn()}
        onTogglePlay={vi.fn()}
      />
    );
    // Ícone Play deve estar presente
    const svgs = container.querySelectorAll('svg');
    const hasPlay = Array.from(svgs).some(svg => svg.classList.contains('lucide-play'));
    expect(hasPlay).toBe(true);
  });

  it('chama onTogglePlay ao clicar no botão', () => {
    const onTogglePlay = vi.fn();
    render(
      <SoundMixer
        sound={mockSound}
        onVolumeChange={vi.fn()}
        onTogglePlay={onTogglePlay}
      />
    );
    const btn = screen.getByRole('button');
    fireEvent.click(btn);
    expect(onTogglePlay).toHaveBeenCalledWith('chuva');
  });

  it('exibe animação quando o som está tocando', () => {
    const { container } = render(
      <SoundMixer
        sound={{ ...mockSound, isPlaying: true }}
        onVolumeChange={vi.fn()}
        onTogglePlay={vi.fn()}
      />
    );
    // Quando isPlaying, exibe barras de animação (5 divs)
    const animBars = container.querySelectorAll('.animate-pulse');
    expect(animBars.length).toBe(5);
  });

  it('chama onVolumeChange ao usar o VolumeSlider', () => {
    const onVolumeChange = vi.fn();
    render(
      <SoundMixer
        sound={mockSound}
        onVolumeChange={onVolumeChange}
        onTogglePlay={vi.fn()}
      />
    );
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight', code: 'ArrowRight' });
    expect(onVolumeChange).toHaveBeenCalledWith('chuva', 0.51);
  });
});
