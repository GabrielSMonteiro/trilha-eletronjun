import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MobileNav } from '@/components/navigation/MobileNav';
import { MemoryRouter } from 'react-router-dom';

describe('MobileNav', () => {
  const renderComponent = (props = {}) => {
    return render(
      <MemoryRouter>
        <MobileNav {...props} />
      </MemoryRouter>
    );
  };

  it('renderiza o botão de menu', () => {
    renderComponent();
    expect(screen.getByRole('button', { name: /abrir menu/i })).toBeInTheDocument();
  });

  it('abre o menu ao clicar e exibe as rotas', () => {
    renderComponent();
    
    
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    
    
    expect(screen.getByText('Início', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Trilhas')).toBeInTheDocument();
    expect(screen.getByText('Assistente IA')).toBeInTheDocument();
    expect(screen.getByText('Estatísticas')).toBeInTheDocument();
    expect(screen.getByText('Comunidade')).toBeInTheDocument();
    expect(screen.getByText('Café de Estudos')).toBeInTheDocument();
  });

  it('fecha o menu ao clicar em um link', () => {
    renderComponent();
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    
    const link = screen.getByText('Estatísticas');
    fireEvent.click(link);
    
  });

  it('renderiza o nome e email do usuário se passados via props', () => {
    renderComponent({ userName: 'Gabriel', userEmail: 'gabriel@test.com' });
    
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    
    expect(screen.getByText('Gabriel')).toBeInTheDocument();
    expect(screen.getByText('gabriel@test.com')).toBeInTheDocument();
  });

  it('renderiza botão Sair e chama onSignOut ao clicar', () => {
    const onSignOut = vi.fn();
    renderComponent({ onSignOut });
    
    fireEvent.click(screen.getByRole('button', { name: /abrir menu/i }));
    
    const sairBtn = screen.getByText('Sair');
    expect(sairBtn).toBeInTheDocument();
    
    fireEvent.click(sairBtn);
    expect(onSignOut).toHaveBeenCalled();
  });
});
