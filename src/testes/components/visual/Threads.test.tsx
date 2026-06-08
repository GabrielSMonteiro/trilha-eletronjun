import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Threads from '@/components/Threads';

describe('Threads', () => {
  it('renderiza o container principal do threads', () => {
    const { container } = render(<Threads />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
