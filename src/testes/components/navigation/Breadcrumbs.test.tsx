import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Breadcrumbs } from '@/components/navigation/Breadcrumbs';
import { MemoryRouter } from 'react-router-dom';

describe('Breadcrumbs', () => {
  it('não renderiza nada se estiver na home (/) e não tiver itens explícitos', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumbs />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renderiza breadcrumb a partir da rota atual', () => {
    render(
      <MemoryRouter initialEntries={['/app/lesson']}>
        <Breadcrumbs />
      </MemoryRouter>
    );
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Trilhas')).toBeInTheDocument();
    expect(screen.getByText('Lesson')).toBeInTheDocument();
  });

  it('renderiza breadcrumb a partir de itens passados via prop', () => {
    const items = [
      { label: 'Meu Item', href: '/custom' },
      { label: 'Final' }
    ];
    render(
      <MemoryRouter initialEntries={['/']}>
        <Breadcrumbs items={items} />
      </MemoryRouter>
    );
    expect(screen.getByText('Início')).toBeInTheDocument();
    expect(screen.getByText('Meu Item')).toBeInTheDocument();
    expect(screen.getByText('Final')).toBeInTheDocument();
  });

  it('esconde o link da home quando showHome=false', () => {
    render(
      <MemoryRouter initialEntries={['/app/lesson']}>
        <Breadcrumbs showHome={false} />
      </MemoryRouter>
    );
    expect(screen.queryByText('Início')).not.toBeInTheDocument();
    expect(screen.getByText('Trilhas')).toBeInTheDocument();
  });
});
