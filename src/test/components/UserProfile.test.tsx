import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { UserProfile } from '@/components/UserProfile';

vi.mock('lucide-react', () => ({
  Trophy: () => <span data-testid="trophy-icon" />,
  Star: () => <span data-testid="star-icon" />,
  Settings: () => <span data-testid="settings-icon" />,
}));

const mockUser = {
  name: 'Gabriel Monteiro',
  email: 'gabriel@eletronjun.com.br',
  position: 'Desenvolvedor',
  completedLessons: 15,
  level: 3,
  currentStreak: 7,
};

describe('UserProfile', () => {
  it('renderiza nome e email do usuário', () => {
    render(<UserProfile user={mockUser} onEditProfile={vi.fn()} />);

    expect(screen.getByText('Gabriel Monteiro')).toBeInTheDocument();
    expect(screen.getByText('gabriel@eletronjun.com.br')).toBeInTheDocument();
    expect(screen.getByText('Desenvolvedor')).toBeInTheDocument();
  });

  it('exibe as iniciais do usuário no avatar', () => {
    render(<UserProfile user={mockUser} onEditProfile={vi.fn()} />);
    expect(screen.getByText('GM')).toBeInTheDocument();
  });

  it('renderiza estatísticas: lições, nível e sequência', () => {
    render(<UserProfile user={mockUser} onEditProfile={vi.fn()} />);

    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getAllByText('3').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('7 dias')).toBeInTheDocument();
  });

  it('chama onEditProfile ao clicar no botão de configurações', () => {
    const onEditProfile = vi.fn();
    render(<UserProfile user={mockUser} onEditProfile={onEditProfile} />);

    const settingsBtn = screen.getByRole('button');
    fireEvent.click(settingsBtn);

    expect(onEditProfile).toHaveBeenCalledTimes(1);
  });

  it('exibe iniciais corretas para nome com múltiplas palavras', () => {
    const user = { ...mockUser, name: 'Ana Clara Silva' };
    render(<UserProfile user={user} onEditProfile={vi.fn()} />);
    expect(screen.getByText('ACS')).toBeInTheDocument();
  });

  it('renderiza sem avatar (fallback com iniciais)', () => {
    const user = { ...mockUser, avatar: undefined };
    render(<UserProfile user={user} onEditProfile={vi.fn()} />);
    expect(screen.getByText('GM')).toBeInTheDocument();
  });
});
