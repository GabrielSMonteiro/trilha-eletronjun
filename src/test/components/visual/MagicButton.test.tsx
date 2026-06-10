import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MagicButton from '@/components/MagicButton';

vi.mock('gsap', () => ({
  gsap: {
    to: vi.fn(),
    fromTo: vi.fn(),
  }
}));

vi.mock('@/components/MagicButton.css', () => ({}));

describe('MagicButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock getBoundingClientRect
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 200,
      height: 50,
      top: 0,
      left: 0,
      bottom: 50,
      right: 200,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));
  });

  it('renderiza o botão com o texto correto e trata onClick', () => {
    const onClickMock = vi.fn();
    render(<MagicButton onClick={onClickMock}>Mágico</MagicButton>);
    
    const btn = screen.getByText('Mágico');
    expect(btn).toBeInTheDocument();
    
    fireEvent.click(btn);
    expect(onClickMock).toHaveBeenCalled();
  });

  it('renderiza com className customizada', () => {
    const { container } = render(<MagicButton className="custom-class">Btn</MagicButton>);
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('lida com mouseenter/mouseleave sem quebrar', () => {
    const { container } = render(<MagicButton>Hover me</MagicButton>);
    const btn = container.querySelector('button')!;
    
    fireEvent.mouseEnter(btn);
    fireEvent.mouseLeave(btn);
    
    expect(btn).toBeInTheDocument();
  });

  it('lida com mousemove sem quebrar', () => {
    const { container } = render(<MagicButton>Move me</MagicButton>);
    const btn = container.querySelector('button')!;
    
    fireEvent.mouseMove(btn, { clientX: 100, clientY: 25 });
    
    expect(btn).toBeInTheDocument();
  });

  it('renderiza sem efeitos quando props de features são false', () => {
    const { container } = render(
      <MagicButton
        enableStars={false}
        enableBorderGlow={false}
        enableTilt={false}
        enableMagnetism={false}
        clickEffect={false}
      >
        Simple
      </MagicButton>
    );
    expect(container.querySelector('button')).toBeInTheDocument();
  });

  it('chama onClick quando passado como prop de Button', () => {
    const fn = vi.fn();
    render(<MagicButton onClick={fn}>Click</MagicButton>);
    fireEvent.click(screen.getByText('Click'));
    expect(fn).toHaveBeenCalledOnce();
  });
});
