import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HyperspeedBackground } from '@/components/HyperspeedBackground';

vi.mock('ogl', () => ({
  Renderer: vi.fn(() => ({ gl: { canvas: document.createElement('canvas') } })),
  Camera: vi.fn(),
  Transform: vi.fn(),
  Geometry: vi.fn(),
  Program: vi.fn(),
  Mesh: vi.fn(),
  Color: vi.fn(),
  Post: vi.fn(() => ({ render: vi.fn() }))
}));

describe('HyperspeedBackground', () => {
  it('renderiza o componente sem erros de mount', () => {
    const { container } = render(<HyperspeedBackground />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
