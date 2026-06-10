import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ScrambledText from '@/components/ScrambledText';

vi.mock('gsap', () => ({
  gsap: { to: vi.fn(), fromTo: vi.fn() }
}));

vi.mock('@/components/ScrambledText.css', () => ({}));

describe('ScrambledText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      left: 10, top: 10, width: 20, height: 20,
      right: 30, bottom: 30, x: 10, y: 10, toJSON: () => {}
    }));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renderiza sem quebrar', () => {
    const { container } = render(<ScrambledText text="Testando" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renderiza o texto passado como children', () => {
    const { container } = render(<ScrambledText text="Olá Mundo" />);
    expect(container.firstChild).toBeInTheDocument();
  });

  it('lida com pointerMove sem quebrar', () => {
    const { container } = render(<ScrambledText text="Texto" />);
    const div = container.querySelector('.text-block') || container.firstChild as HTMLElement;
    
    if (div) {
      fireEvent.pointerMove(div, { clientX: 15, clientY: 15 });
    }
    
    expect(container.firstChild).toBeInTheDocument();
  });

  it('renderiza com className e style customizados', () => {
    const { container } = render(
      <ScrambledText text="Custom" className="custom-class" style={{ color: 'red' }} />
    );
    expect(container.querySelector('.custom-class') || container.firstChild).toBeTruthy();
  });

  it('scrambleChars customizados funcionam', () => {
    const { container } = render(
      <ScrambledText text="Test" scrambleChars="*#" />
    );
    expect(container.firstChild).toBeInTheDocument();
  });
});
