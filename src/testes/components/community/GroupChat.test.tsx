import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import GroupChat from '@/components/community/GroupChat';
import { supabase } from '@/integrations/supabase/client';
import userEvent from '@testing-library/user-event';

vi.mock('@/integrations/supabase/client', () => {
  const channelMock = {
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn()
  };
  
  return {
    supabase: {
      channel: vi.fn(() => channelMock),
      removeChannel: vi.fn(),
      from: vi.fn()
    }
  };
});

describe('GroupChat', () => {
  const mockGroup = { id: 'group-1', name: 'Grupo de Estudos', description: 'Vamos estudar' };
  const mockUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Configura os scrollIntoView
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
  });

  const setupMock = (messages: any[], profiles: any[], insertError: any = null) => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'group_messages') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue({ data: messages, error: null }),
          insert: vi.fn().mockResolvedValue({ error: insertError })
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: profiles, error: null }),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: profiles[0] || null, error: null })
        };
      }
      return { select: vi.fn() };
    });
  };

  it('renderiza os detalhes do grupo e carrega mensagens', async () => {
    setupMock(
      [{ id: 'msg-1', user_id: 'user-2', content: 'Olá grupo', created_at: new Date().toISOString() }],
      [{ user_id: 'user-2', display_name: 'Usuário Teste' }]
    );

    render(<GroupChat group={mockGroup} userId={mockUserId} onBack={() => {}} />);

    expect(screen.getByText('Grupo de Estudos')).toBeInTheDocument();
    expect(screen.getByText('Vamos estudar')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Olá grupo')).toBeInTheDocument();
      expect(screen.getByText('Usuário Teste')).toBeInTheDocument();
    });
    
    // Verifica subscrição de canal
    expect(supabase.channel).toHaveBeenCalledWith('group_group-1');
  });

  it('envia uma mensagem e limpa o input', async () => {
    const user = userEvent.setup();
    setupMock([], []);

    render(<GroupChat group={mockGroup} userId={mockUserId} onBack={() => {}} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    await user.type(input, 'Minha mensagem de teste');
    
    const sendBtn = screen.getByRole('button', { name: '' }); // Send icon button tem text vazio
    // Melhor encontrar pelo svg ou getAllByRole. Primeiro botão é Voltar, segundo é Enviar.
    const btns = screen.getAllByRole('button');
    await user.click(btns[1]);

    expect(supabase.from).toHaveBeenCalledWith('group_messages');
    
    // O input deve ser limpo após o envio se não houver erro (nosso mock não retorna erro)
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('envia mensagem com Enter', async () => {
    const user = userEvent.setup();
    setupMock([], []);

    render(<GroupChat group={mockGroup} userId={mockUserId} onBack={() => {}} />);

    const input = screen.getByPlaceholderText('Digite sua mensagem...');
    await user.type(input, 'Outra mensagem{Enter}');

    expect(supabase.from).toHaveBeenCalledWith('group_messages');
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('chama onBack ao clicar em Voltar', async () => {
    const onBackMock = vi.fn();
    setupMock([], []);

    render(<GroupChat group={mockGroup} userId={mockUserId} onBack={onBackMock} />);

    const backBtn = screen.getByRole('button', { name: /Voltar aos Grupos/i });
    fireEvent.click(backBtn);

    expect(onBackMock).toHaveBeenCalled();
  });
  
  it('exibe a própria mensagem formatada corretamente', async () => {
    setupMock(
      [{ id: 'msg-own', user_id: mockUserId, content: 'Minha própria mensagem', created_at: new Date().toISOString() }],
      [{ user_id: mockUserId, display_name: 'Gabriel' }]
    );

    render(<GroupChat group={mockGroup} userId={mockUserId} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Minha própria mensagem')).toBeInTheDocument();
      // O nome deve aparecer como "Você" em vez de display_name
      expect(screen.getByText('Você')).toBeInTheDocument();
    });
  });
});
