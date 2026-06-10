import { render, screen, fireEvent } from '@testing-library/react';
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

  it('renderiza com fadeOut', () => {
    const { container } = render(
      <LogoLoop
        logos={[{ src: '/logo1.png', alt: 'Logo1' }]}
        fadeOut={true}
        fadeOutColor="#fff"
      />
    );
    expect(container.querySelector('.logoloop--fade')).toBeInTheDocument();
  });

  it('renderiza com scaleOnHover', () => {
    const { container } = render(
      <LogoLoop
        logos={[{ src: '/logo1.png', alt: 'Logo1' }]}
        scaleOnHover={true}
      />
    );
    expect(container.querySelector('.logoloop--scale-hover')).toBeInTheDocument();
  });

  it('renderiza logo com href como link', () => {
    render(
      <LogoLoop
        logos={[
          { src: '/logo.png', alt: 'Logo', href: 'https://example.com' },
        ]}
      />
    );
    const link = document.querySelector('a.logoloop__link');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com');
  });

  it('lida com mouseenter/mouseleave quando pauseOnHover=true', () => {
    const { container } = render(
      <LogoLoop
        logos={[{ src: '/logo.png', alt: 'Logo' }]}
        pauseOnHover={true}
      />
    );
    const region = container.querySelector('[role="region"]')!;
    fireEvent.mouseEnter(region);
    fireEvent.mouseLeave(region);
    expect(region).toBeInTheDocument();
  });

  it('renderiza com ariaLabel customizado', () => {
    render(
      <LogoLoop
        logos={[{ src: '/logo.png', alt: 'Logo' }]}
        ariaLabel="Custom aria label"
      />
    );
    expect(screen.getByRole('region', { name: 'Custom aria label' })).toBeInTheDocument();
  });

  it('renderiza com direction right', () => {
    const { container } = render(
      <LogoLoop
        logos={[{ src: '/logo.png', alt: 'Logo' }]}
        direction="right"
        speed={50}
      />
    );
    expect(container.querySelector('.logoloop')).toBeInTheDocument();
  });
});
