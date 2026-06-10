import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ForumThread from '@/components/community/ForumThread';
import { supabase } from '@/integrations/supabase/client';
import userEvent from '@testing-library/user-event';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    }),
    removeChannel: vi.fn(),
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() }),
  toast: vi.fn()
}));

describe('ForumThread', () => {
  const mockForum = { id: 'forum-1', title: 'React JS', description: 'Discussões sobre React' };
  const mockUserId = 'user-1';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockSupabaseQuery = (posts: any[], profiles: any[], insertError: any = null) => {
    (supabase.from as any).mockImplementation((table: string) => {
      if (table === 'forum_posts') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockResolvedValue({ data: posts, error: null }),
          insert: vi.fn().mockResolvedValue({ error: insertError })
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          in: vi.fn().mockResolvedValue({ data: profiles, error: null })
        };
      }
      if (table === 'forum_likes') {
        return {
          insert: vi.fn().mockResolvedValue({ error: null }),
          delete: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis()
        };
      }
      return { select: vi.fn() };
    });
  };

  it('renderiza título e descrição e carrega posts', async () => {
    mockSupabaseQuery(
      [
        { id: 'post-1', user_id: 'user-2', content: 'Primeiro post!', created_at: new Date().toISOString(), forum_likes: [{ count: 2 }] }
      ],
      [
        { user_id: 'user-2', display_name: 'Usuário Teste' }
      ]
    );

    render(<ForumThread forum={mockForum} userId={mockUserId} onBack={() => {}} />);

    expect(screen.getByText('React JS')).toBeInTheDocument();
    expect(screen.getByText('Discussões sobre React')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Primeiro post!')).toBeInTheDocument();
      expect(screen.getByText('Usuário Teste')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); 
    });
  });

  it('permite criar um novo post', async () => {
    const user = userEvent.setup();
    mockSupabaseQuery([], []);

    render(<ForumThread forum={mockForum} userId={mockUserId} onBack={() => {}} />);

    const textarea = screen.getByPlaceholderText('Compartilhe suas ideias...');
    await user.type(textarea, 'Meu novo post!');

    const sendBtn = screen.getByRole('button', { name: /Enviar Post/i });
    await user.click(sendBtn);

    expect(supabase.from).toHaveBeenCalledWith('forum_posts');
    
  });

  it('chama onBack ao clicar em Voltar', async () => {
    const user = userEvent.setup();
    const onBackMock = vi.fn();
    mockSupabaseQuery([], []);

    render(<ForumThread forum={mockForum} userId={mockUserId} onBack={onBackMock} />);

    const backBtn = screen.getByRole('button', { name: /Voltar aos Fóruns/i });
    await user.click(backBtn);

    expect(onBackMock).toHaveBeenCalled();
  });

  it('curte um post', async () => {
    const user = userEvent.setup();
    mockSupabaseQuery(
      [{ id: 'post-1', user_id: 'user-2', content: 'Post para curtir', created_at: new Date().toISOString() }],
      [{ user_id: 'user-2', display_name: 'Bob' }]
    );

    render(<ForumThread forum={mockForum} userId={mockUserId} onBack={() => {}} />);

    await waitFor(() => {
      expect(screen.getByText('Post para curtir')).toBeInTheDocument();
    });

    
    
    const likeBtn = screen.getAllByRole('button')[1]; 
    await user.click(likeBtn);

    expect(supabase.from).toHaveBeenCalledWith('forum_likes');
  });
});
