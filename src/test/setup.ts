import '@testing-library/jest-dom';

global.ResizeObserver = class ResizeObserver {
  observe() { }
  unobserve() { }
  disconnect() { }
};

global.IntersectionObserver = class IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  observe() { }
  unobserve() { }
  disconnect() { }
  takeRecords(): IntersectionObserverEntry[] { return []; }
};

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => { },
    removeListener: () => { },
    addEventListener: () => { },
    removeEventListener: () => { },
    dispatchEvent: () => false,
  }),
});

window.HTMLElement.prototype.scrollIntoView = () => { };

window.HTMLElement.prototype.animate = () =>
({
  cancel: () => { },
  finish: () => { },
  pause: () => { },
  play: () => { },
  reverse: () => { },
  addEventListener: () => { },
  removeEventListener: () => { },
  finished: Promise.resolve({} as Animation),
} as unknown as Animation);

if (typeof window.PointerEvent === 'undefined') {
  class PointerEvent extends MouseEvent {
    public pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: typeof PointerEvent }).PointerEvent = PointerEvent;
}

window.HTMLElement.prototype.hasPointerCapture = () => false;
window.HTMLElement.prototype.setPointerCapture = () => { };
window.HTMLElement.prototype.releasePointerCapture = () => { };
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
