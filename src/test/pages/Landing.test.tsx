import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Landing from '@/pages/Landing';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/components/HyperspeedBackground', () => ({ HyperspeedBackground: () => <div data-testid="hyperspeed-bg" /> }));
vi.mock('@/components/Threads', () => ({ default: () => <div data-testid="threads" /> }));
vi.mock('@/components/LogoLoop', () => ({ default: () => <div data-testid="logo-loop" /> }));
vi.mock('@/components/MagicButton', () => ({ default: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button> }));
vi.mock('@/components/TextType', () => ({ default: () => <span data-testid="text-type">TextType</span> }));
vi.mock('@/components/ShinyText', () => ({ default: () => <span data-testid="shiny-text">ShinyText</span> }));
vi.mock('@/components/RotatingText', () => ({ default: () => <span data-testid="rotating-text">RotatingText</span> }));

describe('Landing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => render(
    <MemoryRouter>
      <Landing />
    </MemoryRouter>
  );

  it('renderiza o título e logotipo', () => {
    renderComponent();
    expect(screen.getByText('CapacitaJun')).toBeInTheDocument();
    const logos = screen.getAllByAltText('EletronJun Logo');
    expect(logos.length).toBeGreaterThan(0);
  });

  it('renderiza as features principais', () => {
    renderComponent();
    expect(screen.getByText('Trilhas de Aprendizado')).toBeInTheDocument();
    expect(screen.getByText('Rankings Mensais')).toBeInTheDocument();
    expect(screen.getByText('Progressão Gamificada')).toBeInTheDocument();
    expect(screen.getByText('Múltiplas Áreas')).toBeInTheDocument();
  });

  it('renderiza os componentes mockados', () => {
    renderComponent();
    expect(screen.getByTestId('hyperspeed-bg')).toBeInTheDocument();
    expect(screen.getByTestId('threads')).toBeInTheDocument();
    expect(screen.getByTestId('logo-loop')).toBeInTheDocument();
    expect(screen.getByTestId('text-type')).toBeInTheDocument();
    expect(screen.getByTestId('shiny-text')).toBeInTheDocument();
    expect(screen.getByTestId('rotating-text')).toBeInTheDocument();
  });

  it('navega para /auth ao clicar em Entrar', () => {
    renderComponent();
    
    const btnEntrar = screen.getAllByText('Entrar')[0];
    fireEvent.click(btnEntrar.closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });

  it('navega para /auth ao clicar em Começar Agora', () => {
    renderComponent();
    const btnComecar = screen.getByText('Começar Agora');
    fireEvent.click(btnComecar.closest('button')!);
    expect(mockNavigate).toHaveBeenCalledWith('/auth');
  });
});
