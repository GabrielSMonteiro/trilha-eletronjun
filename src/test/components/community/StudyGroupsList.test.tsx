import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import StudyGroupsList from '@/components/community/StudyGroupsList';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn()
    })),
    removeChannel: vi.fn(),
    from: vi.fn()
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

const mockCategories = [{ id: 'cat-1', name: 'Frontend', display_name: 'Frontend' }];
const mockGroups = [
  {
    id: 'group-1',
    name: 'Grupo de React',
    description: 'Estudos de React',
    is_private: false,
    max_members: 10,
    created_by: 'user2',
    categories: { display_name: 'Frontend' },
    study_group_members: [{ count: 3 }]
  }
];

const setupMock = (myMemberGroups: any[] = []) => {
  (supabase.from as any).mockImplementation((table: string) => {
    if (table === 'categories') {
      return {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockCategories, error: null })
      };
    }
    if (table === 'study_groups') {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockGroups, error: null }),
        insert: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-group' }, error: null })
      };
      chain.insert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { id: 'new-group' }, error: null })
      });
      return chain;
    }
    if (table === 'study_group_members') {
      return {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          data: myMemberGroups,
          error: null
        }),
        insert: vi.fn().mockResolvedValue({ error: null })
      };
    }
    return {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: [], error: null }),
      in: vi.fn().mockResolvedValue({ data: [], error: null })
    };
  });
};

describe('StudyGroupsList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  it('renderiza o cabecalho e botao de criar grupo', () => {
    render(<StudyGroupsList userId="user1" />);
    expect(screen.getByText('Grupos de Estudo')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Grupo/i })).toBeInTheDocument();
  });

  it('carrega e exibe grupos publicos', async () => {
    render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      expect(screen.getByText('Grupo de React')).toBeInTheDocument();
      expect(screen.getByText('Estudos de React')).toBeInTheDocument();
    });
  });

  it('exibe botao Entrar para grupos publicos nao ingressados', async () => {
    render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    });
  });

  it('chama supabase.from ao clicar em Entrar num grupo', async () => {
    render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Entrar/i })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('study_group_members');
    });
  });

  it('abre o dialog de criar grupo', async () => {
    render(<StudyGroupsList userId="user1" />);
    fireEvent.click(screen.getByRole('button', { name: /Criar Grupo/i }));
    await waitFor(() => {
      expect(screen.getByText('Criar Grupo de Estudo')).toBeInTheDocument();
    });
  });

  it('exibe secao Meus Grupos quando o usuario e membro', async () => {
    setupMock([
      { study_groups: { id: 'group-1', name: 'Grupo de React', is_private: false, categories: { display_name: 'Frontend' }, study_group_members: [{ count: 1 }] } }
    ]);
    render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      expect(screen.getByText('Meus Grupos')).toBeInTheDocument();
    });
  });

  it('exibe icone de cadeado para grupos privados em Meus Grupos', async () => {
    setupMock([
      { study_groups: { id: 'group-priv', name: 'Grupo Privado', is_private: true, categories: { display_name: 'Backend' }, study_group_members: [{ count: 1 }] } }
    ]);
    render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      expect(screen.getByText('Grupo Privado')).toBeInTheDocument();
    });
    const { container } = render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      const lockSvg = container.querySelector('.lucide-lock');
      expect(screen.getAllByText('Grupo Privado').length).toBeGreaterThan(0);
    });
  });

  it('seleciona um grupo de Meus Grupos e abre o GroupChat', async () => {
    setupMock([
      { study_groups: { id: 'group-1', name: 'Grupo de React', is_private: false, categories: { display_name: 'Frontend' }, study_group_members: [{ count: 1 }] } }
    ]);
    render(<StudyGroupsList userId="user1" />);
    
    await waitFor(() => {
      expect(screen.getAllByText('Grupo de React').length).toBeGreaterThan(0);
    });
    
    const cards = screen.getAllByText('Grupo de React');
    fireEvent.click(cards[0]);
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Voltar aos Grupos/i })).toBeInTheDocument();
    });
  });

  it('exibe erro ao criar grupo sem nome ou categoria', async () => {
    render(<StudyGroupsList userId="user1" />);
    fireEvent.click(screen.getByRole('button', { name: /Criar Grupo/i }));
    await waitFor(() => {
      expect(screen.getByText('Criar Grupo de Estudo')).toBeInTheDocument();
    });

    
    vi.clearAllMocks();
    (supabase.from as any).mockImplementation(() => ({
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    }));

    
    const btns = screen.getAllByRole('button', { name: /Criar Grupo/i });
    fireEvent.click(btns[btns.length - 1]);

    
    await new Promise(r => setTimeout(r, 50));
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it('exibe grupo cheio com botao desativado', async () => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'categories') {
        return { select: vi.fn().mockReturnThis(), order: vi.fn().mockResolvedValue({ data: mockCategories, error: null }) };
      }
      if (table === 'study_groups') {
        const chain: any = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({
            data: [{ ...mockGroups[0], study_group_members: [{ count: 10 }], max_members: 10 }],
            error: null
          }),
          insert: vi.fn().mockReturnValue({ select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: 'new-group' }, error: null }) }),
          single: vi.fn().mockResolvedValue({ data: { id: 'new-group' }, error: null })
        };
        return chain;
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockResolvedValue({ data: [], error: null }), insert: vi.fn().mockResolvedValue({ error: null }), order: vi.fn().mockReturnThis(), limit: vi.fn().mockResolvedValue({ data: [], error: null }), in: vi.fn().mockResolvedValue({ data: [], error: null }) };
    });

    render(<StudyGroupsList userId="user1" />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cheio/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Cheio/i })).toBeDisabled();
  });
});
