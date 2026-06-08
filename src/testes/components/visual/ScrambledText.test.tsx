import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ScrambledText from '@/components/ScrambledText';

describe('ScrambledText', () => {
  it('renderiza sem quebrar', () => {
    const { container } = render(<ScrambledText text="Testando" />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
