import { render, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock all ogl exports - this must be at the top level
vi.mock('ogl', () => {
  const glMock = {
    canvas: document.createElement('canvas'),
    clearColor: vi.fn(),
    enable: vi.fn(),
    blendFunc: vi.fn(),
    SRC_ALPHA: 1,
    ONE_MINUS_SRC_ALPHA: 2,
    BLEND: 3,
    getExtension: vi.fn(() => null),
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    useProgram: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    drawArrays: vi.fn(),
    createBuffer: vi.fn(function() { return {}; }),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    createVertexArray: vi.fn(function() { return {}; }),
    bindVertexArray: vi.fn(),
    ARRAY_BUFFER: 34962,
    ELEMENT_ARRAY_BUFFER: 34963,
    FLOAT: 5126,
    TRIANGLES: 4,
    STATIC_DRAW: 35044,
    VERTEX_SHADER: 35633,
    FRAGMENT_SHADER: 35632,
    COLOR_BUFFER_BIT: 16384,
  };

  return {
    Renderer: vi.fn(function() {
      return {
        gl: glMock,
        setSize: vi.fn(),
        render: vi.fn(),
      };
    }),
    Program: vi.fn(function() {
      return {
        uniforms: {
          iResolution: { value: { r: 0, g: 0, b: 0 } },
          uMouse: { value: [0.5, 0.5] },
          iTime: { value: 0 }
        }
      };
    }),
    Mesh: vi.fn(function() {}),
    Triangle: vi.fn(function() {}),
    Color: vi.fn(function() { return { r: 0, g: 0, b: 0 }; }),
  };
});

vi.mock('@/components/Threads.css', () => ({}));

// Import Threads after mocks
import Threads from '@/components/Threads';

describe('Threads', () => {
  let originalRAF: typeof requestAnimationFrame;
  let originalCAF: typeof cancelAnimationFrame;

  beforeEach(() => {
    vi.clearAllMocks();
    originalRAF = global.requestAnimationFrame;
    originalCAF = global.cancelAnimationFrame;
    let rafId = 0;
    global.requestAnimationFrame = vi.fn((cb) => {
      rafId++;
      setTimeout(() => cb(performance.now()), 0);
      return rafId;
    });
    global.cancelAnimationFrame = vi.fn();
  });

  afterEach(() => {
    global.requestAnimationFrame = originalRAF;
    global.cancelAnimationFrame = originalCAF;
    vi.restoreAllMocks();
  });

  it('renderiza o componente sem erros', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const { container } = render(<Threads />);
    expect(warnSpy).not.toHaveBeenCalled();
    const div = container.firstChild as HTMLDivElement;
    expect(div).toBeInTheDocument();
  });

  it('renderiza com props customizadas', () => {
    const { container } = render(
      <Threads
        color={[1, 0.5, 0]}
        amplitude={2}
        distance={3}
        enableMouseInteraction={true}
        className="custom"
      />
    );
    expect(container.firstChild).toBeInTheDocument();
  });

  it('lida com mousemove quando enableMouseInteraction=true', () => {
    const { container } = render(<Threads enableMouseInteraction={true} />);
    const div = container.firstChild as HTMLDivElement;

    vi.spyOn(div, 'getBoundingClientRect').mockReturnValue({
      width: 500,
      height: 500,
      top: 0,
      left: 0,
      bottom: 500,
      right: 500,
      x: 0,
      y: 0,
      toJSON: () => {}
    });

    act(() => {
      fireEvent.mouseMove(div, { clientX: 100, clientY: 100 });
    });

    expect(div).toBeInTheDocument();
  });

  it('lida com mouseleave quando enableMouseInteraction=true', () => {
    const { container } = render(<Threads enableMouseInteraction={true} />);
    const div = container.firstChild as HTMLDivElement;

    act(() => {
      fireEvent.mouseLeave(div);
    });

    expect(div).toBeInTheDocument();
  });

  it('lida com o resize da janela', () => {
    render(<Threads />);

    act(() => {
      fireEvent(window, new Event('resize'));
    });
  });

  it('limpa os event listeners ao desmontar o componente', () => {
    const windowRemoveSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = render(<Threads enableMouseInteraction={true} />);

    unmount();

    expect(windowRemoveSpy).toHaveBeenCalledWith('resize', expect.any(Function));
  });

  it('renderiza sem interacao de mouse quando enableMouseInteraction=false', () => {
    const { container } = render(<Threads enableMouseInteraction={false} />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
