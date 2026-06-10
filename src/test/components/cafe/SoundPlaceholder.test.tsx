import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SoundPlaceholder } from '@/components/cafe/SoundPlaceholder';

describe('SoundPlaceholder', () => {
  it('renderiza o componente', () => {
    const { container } = render(<SoundPlaceholder />);
    expect(container.firstChild).toBeInTheDocument();
  });
});
