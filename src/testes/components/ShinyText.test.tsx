import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('@/components/ShinyText.css', () => ({}));

import ShinyText from '@/components/ShinyText';

describe('ShinyText', () => {
  it('renderiza o texto passado por prop', () => {
    render(<ShinyText text="Hello World" />);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('aplica a classe disabled quando disabled=true', () => {
    const { container } = render(<ShinyText text="Disabled" disabled={true} />);
    expect(container.firstChild).toHaveClass('disabled');
  });

  it('não aplica a classe disabled quando disabled=false', () => {
    const { container } = render(<ShinyText text="Enabled" disabled={false} />);
    expect(container.firstChild).not.toHaveClass('disabled');
  });

  it('aplica animationDuration baseado no speed', () => {
    const { container } = render(<ShinyText text="Fast" speed={3} />);
    expect(container.firstChild).toHaveStyle({ animationDuration: '3s' });
  });

  it('usa speed padrão de 5 quando não especificado', () => {
    const { container } = render(<ShinyText text="Default" />);
    expect(container.firstChild).toHaveStyle({ animationDuration: '5s' });
  });

  it('aplica className personalizada', () => {
    const { container } = render(<ShinyText text="Custom" className="my-class" />);
    expect(container.firstChild).toHaveClass('my-class');
  });

  it('sempre tem a classe shiny-text', () => {
    const { container } = render(<ShinyText text="Base" />);
    expect(container.firstChild).toHaveClass('shiny-text');
  });
});
