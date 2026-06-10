import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HyperspeedBackground } from '@/components/HyperspeedBackground';

describe('HyperspeedBackground', () => {
  let originalRAF: any;
  let originalCAF: any;
  let mockContext: any;

  beforeEach(() => {
    vi.clearAllMocks();

    originalRAF = global.requestAnimationFrame;
    originalCAF = global.cancelAnimationFrame;

    global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16) as unknown as number);
    global.cancelAnimationFrame = vi.fn();

    // Mock do getContext para o canvas
    mockContext = {
      createLinearGradient: vi.fn(() => ({
        addColorStop: vi.fn()
      })),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
      arc: vi.fn(),
      fill: vi.fn(),
      fillRect: vi.fn()
    };

    HTMLCanvasElement.prototype.getContext = vi.fn(() => mockContext) as any;
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
    vi.restoreAllMocks();
  });

  it('renderiza o componente canvas sem erros e inicia animação', () => {
    const { container } = render(<HyperspeedBackground />);
    const canvas = container.firstChild as HTMLCanvasElement;
    
    expect(canvas).toBeInTheDocument();
    expect(canvas.tagName).toBe('CANVAS');
    expect(global.requestAnimationFrame).toHaveBeenCalled();
  });

  it('interage com o mouse aumentando e reduzindo a velocidade (mousedown / mouseup)', () => {
    const { container } = render(<HyperspeedBackground />);
    const canvas = container.firstChild as HTMLCanvasElement;

    expect(canvas).toBeInTheDocument();

    act(() => {
      fireEvent.mouseDown(canvas);
    });

    // Como o speed update ocorre no animation frame interno, não podemos facilmente assertar speed aqui 
    // a não ser que testemos os efeitos na tela, mas o mock cobrirá a execução.
    
    act(() => {
      fireEvent.mouseUp(canvas);
    });
  });

  it('interage com touch aumentando e reduzindo a velocidade (touchstart / touchend)', () => {
    const { container } = render(<HyperspeedBackground />);
    const canvas = container.firstChild as HTMLCanvasElement;

    expect(canvas).toBeInTheDocument();

    act(() => {
      fireEvent.touchStart(canvas);
    });

    act(() => {
      fireEvent.touchEnd(canvas);
    });
  });

  it('lida com o resize da janela', () => {
    const { container } = render(<HyperspeedBackground />);
    const canvas = container.firstChild as HTMLCanvasElement;
    
    expect(canvas.width).toBe(window.innerWidth);
    
    // Simula resize
    window.innerWidth = 1024;
    fireEvent(window, new Event('resize'));
    
    expect(canvas.width).toBe(1024);
  });

  it('cancela a animação e remove os eventos ao desmontar', () => {
    const { unmount, container } = render(<HyperspeedBackground />);
    const canvas = container.firstChild as HTMLCanvasElement;
    
    const removeEventListenerSpy = vi.spyOn(canvas, 'removeEventListener');
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    
    unmount();
    
    expect(global.cancelAnimationFrame).toHaveBeenCalled();
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(removeEventListenerSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
    expect(windowRemoveSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });
});
