import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { CategorySelector } from '@/components/CategorySelector';

vi.mock('lucide-react', () => ({
  ChevronDown: () => <span data-testid="chevron-down" />,
  Code: () => <span data-testid="icon-code" />,
  Zap: () => <span data-testid="icon-zap" />,
  Users: () => <span data-testid="icon-users" />,
  Target: () => <span data-testid="icon-target" />,
  Briefcase: () => <span data-testid="icon-briefcase" />,
  Building2: () => <span data-testid="icon-building" />,
}));

const mockCategories = [
  { id: '1', name: 'software', display_name: 'Software', description: 'Programação' },
  { id: '2', name: 'eletronica', display_name: 'Eletrônica', description: 'Hardware' },
  { id: '3', name: 'lideranca', display_name: 'Liderança', description: 'Soft skills' },
];

describe('CategorySelector', () => {
  it('exibe botão desabilitado quando não há categorias', () => {
    render(
      <CategorySelector categories={[]} selectedCategory="" onCategoryChange={vi.fn()} />
    );
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
    expect(screen.getByText('Carregando...')).toBeInTheDocument();
  });

  it('renderiza a categoria selecionada como padrão', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory="software"
        onCategoryChange={vi.fn()}
      />
    );
    expect(screen.getByText('Software')).toBeInTheDocument();
  });

  it('abre o dropdown e lista todas as categorias', async () => {
    const user = userEvent.setup();
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory="software"
        onCategoryChange={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(screen.getByText('Eletrônica')).toBeInTheDocument();
      expect(screen.getByText('Liderança')).toBeInTheDocument();
    });
  });

  it('chama onCategoryChange ao selecionar uma categoria', async () => {
    const user = userEvent.setup();
    const onCategoryChange = vi.fn();
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory="software"
        onCategoryChange={onCategoryChange}
      />
    );

    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText('Eletrônica')).toBeInTheDocument());
    await user.click(screen.getByText('Eletrônica'));

    expect(onCategoryChange).toHaveBeenCalledWith('eletronica');
  });

  it('usa primeira categoria quando selectedCategory não corresponde a nenhuma', () => {
    render(
      <CategorySelector
        categories={mockCategories}
        selectedCategory="inexistente"
        onCategoryChange={vi.fn()}
      />
    );
    // Deve mostrar a primeira categoria como fallback
    expect(screen.getByText('Software')).toBeInTheDocument();
  });
});
