import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { VolumeSlider } from '@/components/cafe/VolumeSlider';

describe('VolumeSlider', () => {
  it('renderiza corretamente com volume inicial', () => {
    const onChange = vi.fn();
    render(<VolumeSlider value={0.5} onChange={onChange} />);

    
    expect(screen.getByText('50')).toBeInTheDocument();

    
    
    const slider = screen.getByRole('slider');
    expect(slider).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '50');
  });

  it('exibe o ícone VolumeX quando o volume é 0', () => {
    const onChange = vi.fn();
    const { container } = render(<VolumeSlider value={0} onChange={onChange} />);

    expect(screen.getByText('0')).toBeInTheDocument();
    
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);
    const hasVolumeX = Array.from(svgElements).some(svg => svg.classList.contains('lucide-volume-x'));
    expect(hasVolumeX).toBe(true);
  });

  it('exibe o ícone Volume2 quando o volume é maior que 0', () => {
    const onChange = vi.fn();
    const { container } = render(<VolumeSlider value={1} onChange={onChange} />);

    
    const svgElements = container.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThan(0);

    
    const hasVolumeX = Array.from(svgElements).some(svg => svg.classList.contains('lucide-volume-x'));
    expect(hasVolumeX).toBe(false);
  });

  it('chama onChange quando o valor é alterado', () => {
    const onChange = vi.fn();
    render(<VolumeSlider value={0.5} onChange={onChange} />);

    const slider = screen.getByRole('slider');

    
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
