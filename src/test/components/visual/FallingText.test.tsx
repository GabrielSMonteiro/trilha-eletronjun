import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import FallingText from '@/components/FallingText';

vi.mock('matter-js', () => {
  const mockMatter = {
    Engine: { create: vi.fn(() => ({ world: {} })) },
    Render: { create: vi.fn(), run: vi.fn() },
    Runner: { create: vi.fn(), run: vi.fn() },
    World: { add: vi.fn() },
    Bodies: { rectangle: vi.fn() },
    Mouse: { create: vi.fn() },
    MouseConstraint: { create: vi.fn() },
    Composite: { add: vi.fn() }
  };
  return { ...mockMatter, default: mockMatter };
});

describe('FallingText', () => {
  it('renderiza o container do canvas', () => {
    const { container } = render(<FallingText text="Teste" />);
    
    expect(container.firstChild).toBeInTheDocument();
  });
});
