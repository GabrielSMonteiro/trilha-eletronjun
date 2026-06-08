import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminUsers } from '@/components/admin/AdminUsers';
import { supabase } from '@/integrations/supabase/client';

const mockProfiles = [
  { id: '1', user_id: 'user1', display_name: 'Gabriel', position: 'Dev', created_at: new Date().toISOString() },
  { id: '2', user_id: 'user2', display_name: 'AdminUser', position: 'Manager', created_at: new Date().toISOString() }
];

vi.mock('@/integrations/supabase/client', () => {
  return {
    supabase: {
      from: vi.fn((table) => {
        if (table === 'profiles') {
          return {
            select: vi.fn().mockReturnThis(),
            order: vi.fn().mockResolvedValue({
              data: [
                { id: '1', user_id: 'user1', display_name: 'Gabriel', position: 'Dev', created_at: '2023-01-01' },
                { id: '2', user_id: 'user2', display_name: 'AdminUser', position: 'Manager', created_at: '2023-01-01' }
              ],
              error: null
            }),
            update: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({ error: null })
          };
        }
        if (table === 'user_roles') {
          return {
            select: vi.fn().mockResolvedValue({
              data: [{ user_id: 'user2', role: 'admin' }],
              error: null
            })
          };
        }
        return { select: vi.fn().mockResolvedValue({ data: [], error: null }) };
      })
    }
  };
});

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: vi.fn() })
}));

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('carrega e exibe a lista de usuários', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
      expect(screen.getByText('AdminUser')).toBeInTheDocument();
    });
    
    expect(screen.getByText('Dev')).toBeInTheDocument(); 
    expect(screen.getByText('Manager')).toBeInTheDocument();
  });

  it('filtra usuários pela busca', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
    });
    
    const searchInput = screen.getByPlaceholderText('Buscar por nome ou cargo...');
    fireEvent.change(searchInput, { target: { value: 'AdminUser' } });
    
    expect(screen.queryByText('Gabriel')).not.toBeInTheDocument();
    expect(screen.getByText('AdminUser')).toBeInTheDocument();
  });

  it('abre modal de edição ao clicar no botão editar', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
    });
    
    const editBtns = screen.getAllByRole('button').filter(btn => btn.className.includes('h-8 w-8'));
    fireEvent.click(editBtns[0]); // Editar o Gabriel
    
    expect(screen.getByText('Editar Usuário')).toBeInTheDocument();
    
    // Procura os inputs
    expect(screen.getByLabelText('Nome Completo')).toHaveValue('Gabriel');
    expect(screen.getByLabelText('Cargo')).toHaveValue('Dev');
  });

  it('salva alterações do usuário', async () => {
    render(<AdminUsers />);
    
    await waitFor(() => {
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
    });
    
    const editBtns = screen.getAllByRole('button').filter(btn => btn.className.includes('h-8 w-8'));
    fireEvent.click(editBtns[0]);
    
    const nameInput = screen.getByLabelText('Nome Completo');
    fireEvent.change(nameInput, { target: { value: 'Gabriel Editado' } });
    
    const saveBtn = screen.getByText('Salvar Alterações');
    fireEvent.click(saveBtn);
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });
});
