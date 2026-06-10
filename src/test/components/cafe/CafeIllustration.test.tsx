import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { CafeIllustration } from '@/components/cafe/CafeIllustration';

describe('CafeIllustration', () => {
  it('renderiza as imagens de background e lofi', () => {
    const { container } = render(<CafeIllustration hasActiveSounds={true} isDarkMode={false} />);
    
    
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
