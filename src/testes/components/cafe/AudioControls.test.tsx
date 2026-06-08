import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AudioControls } from '@/components/cafe/AudioControls';

describe('AudioControls', () => {
  const defaultProps = {
    masterVolume: 0.7,
    isGloballyPlaying: false,
    onMasterVolumeChange: vi.fn(),
    onGlobalToggle: vi.fn(),
    onMuteAll: vi.fn(),
    onResetAll: vi.fn(),
  };

  it('renderiza o título Controles Globais', () => {
    render(<AudioControls {...defaultProps} />);
    expect(screen.getByText('Controles Globais')).toBeInTheDocument();
  });

  it('exibe botão "Tocar Tudo" quando não está tocando', () => {
    render(<AudioControls {...defaultProps} isGloballyPlaying={false} />);
    expect(screen.getByText('Tocar Tudo')).toBeInTheDocument();
  });

  it('exibe botão "Pausar Tudo" quando está tocando', () => {
    render(<AudioControls {...defaultProps} isGloballyPlaying={true} />);
    expect(screen.getByText('Pausar Tudo')).toBeInTheDocument();
  });

  it('chama onGlobalToggle ao clicar em Tocar Tudo', () => {
    const onGlobalToggle = vi.fn();
    render(<AudioControls {...defaultProps} onGlobalToggle={onGlobalToggle} />);
    fireEvent.click(screen.getByText('Tocar Tudo'));
    expect(onGlobalToggle).toHaveBeenCalled();
  });

  it('chama onMuteAll ao clicar em Mutar', () => {
    const onMuteAll = vi.fn();
    render(<AudioControls {...defaultProps} onMuteAll={onMuteAll} />);
    fireEvent.click(screen.getByText('Mutar'));
    expect(onMuteAll).toHaveBeenCalled();
  });

  it('chama onResetAll ao clicar em Resetar Volumes', () => {
    const onResetAll = vi.fn();
    render(<AudioControls {...defaultProps} onResetAll={onResetAll} />);
    fireEvent.click(screen.getByText('Resetar Volumes'));
    expect(onResetAll).toHaveBeenCalled();
  });

  it('exibe o label Volume Master e o slider', () => {
    render(<AudioControls {...defaultProps} />);
    expect(screen.getByText('Volume Master')).toBeInTheDocument();
    expect(screen.getByRole('slider')).toBeInTheDocument();
  });

  it('chama onMasterVolumeChange ao usar o slider', () => {
    const onMasterVolumeChange = vi.fn();
    render(<AudioControls {...defaultProps} onMasterVolumeChange={onMasterVolumeChange} />);
    const slider = screen.getByRole('slider');
    fireEvent.keyDown(slider, { key: 'ArrowRight' });
    expect(onMasterVolumeChange).toHaveBeenCalled();
  });
});
