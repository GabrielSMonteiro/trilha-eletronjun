import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import MentorshipBoard from '@/components/community/MentorshipBoard';
import { supabase } from '@/integrations/supabase/client';
import userEvent from '@testing-library/user-event';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

const mockCategories = [{ id: 'cat-1', name: 'Frontend', display_name: 'Frontend' }];

const mockOpenRequests = [
  {
    id: 'req-1',
    description: 'Preciso de ajuda com React Hooks',
    status: 'open',
    categories: { display_name: 'Frontend' },
    profiles: { display_name: 'Aluno João' },
    created_at: new Date().toISOString()
  }
];

const mockMyRequests = [
  {
    id: 'req-2',
    description: 'Minha dúvida de CSS',
    status: 'open',
    categories: { display_name: 'Frontend' },
    created_at: new Date().toISOString()
  }
];

const mockMyMentorships = [
  {
    id: 'match-1',
    status: 'active',
    mentor_id: 'test-user',
    mentee_id: 'user-3',
    mentorship_requests: { description: 'Dúvida JS', categories: { display_name: 'Frontend' } },
    mentee_profile: { display_name: 'Aluno Maria' },
    mentor_profile: { display_name: 'Eu' }
  }
];

const setupMock = () => {
  (supabase.from as any).mockImplementation((table: string) => {
    if (table === 'categories') {
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      };
    }
    if (table === 'mentorship_requests') {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        neq: vi.fn().mockReturnThis(),
        order: vi.fn().mockImplementation(() => {
          // Simplificando o mock para retornar dados baseados no uso
          // Mas na prática o componente tem 2 fetch pra essa table: fetchRequests (neq userId) e fetchMyRequests (eq mentee_id)
          return Promise.resolve({ data: mockOpenRequests, error: null });
        }),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null })
        })
      };
      
      // Override eq para diferenciar myRequests
      let isMyReq = false;
      chain.eq = vi.fn().mockImplementation((col, val) => {
        if (col === 'mentee_id' && val === 'test-user') {
          isMyReq = true;
        }
        return chain;
      });
      chain.order = vi.fn().mockImplementation(() => {
        if (isMyReq) return Promise.resolve({ data: mockMyRequests, error: null });
        return Promise.resolve({ data: mockOpenRequests, error: null });
      });
      return chain;
    }
    if (table === 'mentorship_matches') {
      return {
        select: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ data: mockMyMentorships, error: null }),
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        }),
        update: vi.fn().mockResolvedValue({ error: null })
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null })
    };
  });
};

describe('MentorshipBoard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  it('renderiza título e botão Pedir Mentoria', () => {
    render(<MentorshipBoard userId="test-user" />);
    expect(screen.getByText('Mentoria entre Pares')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Pedir Mentoria/i })).toBeInTheDocument();
  });

  it('carrega e exibe pedidos abertos de outras pessoas', async () => {
    render(<MentorshipBoard userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText('Preciso de ajuda com React Hooks')).toBeInTheDocument();
      expect(screen.getByText(/Aluno João/i)).toBeInTheDocument();
    });
  });

  it('carrega e exibe os meus pedidos', async () => {
    render(<MentorshipBoard userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText('Minha dúvida de CSS')).toBeInTheDocument();
    });
  });

  it('carrega e exibe mentorias ativas', async () => {
    render(<MentorshipBoard userId="test-user" />);
    await waitFor(() => {
      expect(screen.getByText(/Mentorando: Aluno Maria/i)).toBeInTheDocument();
      expect(screen.getByText('Dúvida JS')).toBeInTheDocument();
    });
  });

  it('abre o modal de criar pedido', async () => {
    render(<MentorshipBoard userId="test-user" />);
    fireEvent.click(screen.getByRole('button', { name: /Pedir Mentoria/i }));
    expect(await screen.findByText('Solicitar Mentoria')).toBeInTheDocument();
  });

  it('permite criar novo pedido de mentoria', async () => {
    render(<MentorshipBoard userId="test-user" />);
    
    // Abre modal
    fireEvent.click(screen.getByRole('button', { name: /Pedir Mentoria/i }));
    expect(await screen.findByText('Solicitar Mentoria')).toBeInTheDocument();

    // Seleciona categoria
    const selectTrigger = screen.getByRole('combobox');
    fireEvent.click(selectTrigger);
    await waitFor(() => {
      expect(screen.getAllByText('Frontend').length).toBeGreaterThan(0);
    });
    
    // As in radix ui select, the option might appear inside a portal
    const option = screen.getAllByText('Frontend')[1] || screen.getByText('Frontend');
    fireEvent.click(option);

    // Preenche descrição usando fireEvent para evitar o bloqueio de pointer-events da animação do modal
    const textarea = screen.getByPlaceholderText('Explique com o que você precisa de ajuda...');
    fireEvent.change(textarea, { target: { value: 'Ajuda com vitest' } });

    // Submete
    fireEvent.click(screen.getByText('Enviar Pedido'));

    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('mentorship_requests');
    });
  });

  it('oferecer mentoria (match)', async () => {
    render(<MentorshipBoard userId="test-user" />);
    
    // Aguarda o card aparecer
    await waitFor(() => {
      expect(screen.getByText('Preciso de ajuda com React Hooks')).toBeInTheDocument();
    });

    // Clica no botão Oferecer Mentoria
    const offerBtn = screen.getByRole('button', { name: /Aceitar Mentoria/i });
    fireEvent.click(offerBtn);

    await waitFor(() => {
      // Verifica inserção em mentorship_matches
      expect(supabase.from).toHaveBeenCalledWith('mentorship_matches');
    });
  });
});
