import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LogoLoop from '@/components/LogoLoop';

vi.mock('@/components/LogoLoop.css', () => ({}));

describe('LogoLoop', () => {
  it('renderiza os logos em loop', () => {
    
    const { container } = render(
      <LogoLoop
        logos={[
          { src: '/logo1.png', alt: 'Logo1' },
          { src: '/logo2.png', alt: 'Logo2' },
        ]}
      />
    );

    
    expect(container.querySelector('.logoloop')).toBeInTheDocument();
  });

  it('renderiza com items de node', () => {
    const { container } = render(
      <LogoLoop
        logos={[
          { node: <span>Test Logo</span>, title: 'Test' },
        ]}
      />
    );

    expect(container.querySelector('.logoloop')).toBeInTheDocument();
  });
});
