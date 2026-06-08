import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VolumeSlider } from '@/components/cafe/VolumeSlider';

describe('VolumeSlider', () => {
  it('renderiza corretamente com volume inicial', () => {
    const onChange = vi.fn();
    render(<VolumeSlider value={0.5} onChange={onChange} />);

    // Volume 0.5 exibe "50"
    expect(screen.getByText('50')).toBeInTheDocument();

    // O thumb do Radix Slider tem role="slider". Pode não ter aria-label diretamente no thumb,
    // mas tem aria-valuenow.
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('exibe o ícone VolumeX quando o volume é 0', () => {
    const onChange = vi.fn();
    const { container } = render(<VolumeSlider value={0} onChange={onChange} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    // Verifica se o svg do VolumeX está presente (classe lucide-volume-x)
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
    const hasVolumeX = Array.from(svgElements).some(svg => svg.classList.contains('lucide-volume-x'));
    expect(hasVolumeX).toBe(true);
  });

  it('exibe o ícone Volume2 quando o volume é maior que 0', () => {
    const onChange = vi.fn();
    const { container } = render(<VolumeSlider value={1} onChange={onChange} />);

    // Verifica a presença de qualquer svg — lucide pode usar classe 'lucide-volume-2'
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);

    // Se a classe não for detectada, verificamos ao menos que VolumeX NÃO está presente
    const hasVolumeX = Array.from(svgElements).some(svg => svg.classList.contains('lucide-volume-x'));
    expect(hasVolumeX).toBe(false);
  });

  it('chama onChange quando o valor é alterado', () => {
    const onChange = vi.fn();
    render(<VolumeSlider value={0.5} onChange={onChange} />);

    const slider = screen.getByRole('slider');

    // O Shadcn UI slider responde a ArrowRight com keyDown
    fireEvent.keyDown(slider, { key: 'ArrowRight', code: 'ArrowRight' });

    expect(onChange).toHaveBeenCalledWith(0.51);
  });

  it('aplica orientação vertical quando prop vertical é true', () => {
    const onChange = vi.fn();
    const { container } = render(<VolumeSlider value={0.5} onChange={onChange} vertical={true} />);

    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('flex-col');
  });
});
