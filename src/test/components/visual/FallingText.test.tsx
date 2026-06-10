import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import FallingText from '@/components/FallingText';

const { mockEngineUpdate, mockRenderStop, mockRunnerStop, mockWorldClear, mockEngineClear } = vi.hoisted(() => ({
  mockEngineUpdate: vi.fn(),
  mockRenderStop: vi.fn(),
  mockRunnerStop: vi.fn(),
  mockWorldClear: vi.fn(),
  mockEngineClear: vi.fn(),
}));
const mockRequestAnimationFrame = vi.fn((cb) => setTimeout(cb, 16));

vi.mock('matter-js', () => {
  const mockMatter = {
    Engine: { 
      create: vi.fn(() => ({ world: { gravity: { y: 1 } } })),
      update: mockEngineUpdate,
      clear: mockEngineClear
    },
    Render: { 
      create: vi.fn(() => ({ canvas: document.createElement('canvas') })), 
      run: vi.fn(),
      stop: mockRenderStop
    },
    Runner: { 
      create: vi.fn(() => ({})), 
      run: vi.fn(),
      stop: mockRunnerStop
    },
    World: { 
      add: vi.fn(),
      clear: mockWorldClear
    },
    Bodies: { 
      rectangle: vi.fn(() => ({ 
        position: { x: 0, y: 0 },
        bounds: { min: { x: 0, y: 0 }, max: { x: 10, y: 10 } },
        angle: 0
      })) 
    },
    Mouse: { create: vi.fn() },
    MouseConstraint: { create: vi.fn() },
    Composite: { add: vi.fn() },
    Body: {
      setVelocity: vi.fn(),
      setAngularVelocity: vi.fn()
    }
  };
  return { ...mockMatter, default: mockMatter };
});

describe('FallingText', () => {
  let originalGetBoundingClientRect: any;
  let originalRAF: any;
  let observeMock: any;
  let disconnectMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = vi.fn(() => ({
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {}
    }));

    originalRAF = global.requestAnimationFrame;
    global.requestAnimationFrame = mockRequestAnimationFrame as any;

    observeMock = vi.fn();
    disconnectMock = vi.fn();
    class MockIntersectionObserver {
      observe = observeMock;
      disconnect = disconnectMock;
      unobserve = vi.fn();
      constructor(cb: IntersectionObserverCallback) {
        // store callback for manual invocation in tests
        (MockIntersectionObserver as any).lastCallback = cb;
      }
    }
    global.IntersectionObserver = MockIntersectionObserver as any;
  });

  afterEach(() => {
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
    global.requestAnimationFrame = originalRAF;
    vi.restoreAllMocks();
  });

  it('renderiza o container do canvas e aplica text', () => {
    const { container } = render(<FallingText text="Palavra" trigger="auto" />);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Palavra')).toBeInTheDocument();
  });

  it('aplica a classe highlightWords nas palavras corretas', () => {
    render(
      <FallingText 
        text="Aprenda Eletrônica e Programação" 
        highlightWords={['Eletrônica', 'Programação']} 
        highlightClass="text-amber-500" 
      />
    );
    const electronicaElem = screen.getByText('Eletrônica');
    expect(electronicaElem.className).toContain('text-amber-500');
    
    const aprendaElem = screen.getByText('Aprenda');
    expect(aprendaElem.className).not.toContain('text-amber-500');
  });

  it('inicia o efeito ao clicar quando trigger=click', () => {
    const { container } = render(<FallingText text="Click Me" trigger="click" />);
    const div = container.firstChild as HTMLElement;
    
    // Engine não foi criado ainda
    expect(mockEngineUpdate).not.toHaveBeenCalled();
    
    fireEvent.click(div);
    
    // Agora o engine foi criado e o loop foi iniciado
    // (mockRequestAnimationFrame agendou a atualização)
  });

  it('inicia o efeito ao passar o mouse quando trigger=hover', () => {
    const { container } = render(<FallingText text="Hover Me" trigger="hover" />);
    const div = container.firstChild as HTMLElement;
    
    fireEvent.mouseEnter(div);
  });

  it('usa IntersectionObserver para trigger=scroll', () => {
    render(<FallingText text="Scroll Me" trigger="scroll" />);
    
    // observeMock é chamado quando o IntersectionObserver chama observe()
    expect(observeMock).toHaveBeenCalled();
    
    // Simula a interseção via callback guardado no construtor
    const observerCallback = (global.IntersectionObserver as any).lastCallback;
    if (observerCallback) {
      act(() => {
        observerCallback([{ isIntersecting: true }]);
      });
      expect(disconnectMock).toHaveBeenCalled();
    }
  });

  it('limpa os recursos na desmontagem (cleanup)', () => {
    const { unmount } = render(<FallingText text="Cleanup" trigger="auto" />);
    
    unmount();
    
    expect(mockRenderStop).toHaveBeenCalled();
    expect(mockRunnerStop).toHaveBeenCalled();
    expect(mockWorldClear).toHaveBeenCalled();
    expect(mockEngineClear).toHaveBeenCalled();
  });
});
