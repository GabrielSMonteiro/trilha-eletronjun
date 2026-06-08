import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import NotFound from '@/pages/NotFound';

describe('NotFound', () => {
  const renderComponent = () =>
    render(
      <BrowserRouter>
        <NotFound />
      </BrowserRouter>
    );

  it('renderiza o código 404', () => {
    renderComponent();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('renderiza mensagem de página não encontrada', () => {
    renderComponent();
    expect(screen.getByText('Oops! Page not found')).toBeInTheDocument();
  });

  it('renderiza link para home', () => {
    renderComponent();
    const link = screen.getByText('Return to Home');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/');
  });

  it('loga erro 404 no console', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    renderComponent();
    expect(consoleSpy).toHaveBeenCalledWith(
      '404 Error: User attempted to access non-existent route:',
      expect.any(String)
    );
    consoleSpy.mockRestore();
  });
});
