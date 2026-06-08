import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserProfileModal } from '@/components/UserProfileModal';
import { supabase } from '@/integrations/supabase/client';

vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    auth: {
      updateUser: vi.fn().mockResolvedValue({ error: null })
    },
    from: vi.fn(() => ({
      update: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: { display_name: 'Gabriel', position: 'Dev' }, error: null })
    }))
  }
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn()
  })
}));

describe('UserProfileModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    userId: 'user-123',
    userEmail: 'gabriel@example.com'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renderiza os dados de visualização corretamente', async () => {
    render(<UserProfileModal {...defaultProps} />);
    
    // View mode by default
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    
    await waitFor(() => {
      // As in UserProfileModal, name and position are displayed
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
      expect(screen.getByText('Dev')).toBeInTheDocument();
    });
    
    expect(screen.getByText('gabriel@example.com')).toBeInTheDocument();
  });

  it('permite alternar para o modo de edição', async () => {
    render(<UserProfileModal {...defaultProps} />);
    
    // The edit button has a Settings icon but no text, we can find it via role
    const buttons = screen.getAllByRole('button');
    // The edit button is the first button inside the dialog header, or we can look for it by clicking all buttons
    // Since there is only one button in view mode, let's just use it
    fireEvent.click(buttons[0]);
    
    // Now it should show inputs
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Gabriel')).toBeInTheDocument();
    });
  });

  it('salva alterações de perfil', async () => {
    render(<UserProfileModal {...defaultProps} />);
    
    // Alternar para edição
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Mudar valores
    await waitFor(() => {
      expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    });
    const nameInput = screen.getByLabelText(/Nome/i);
    fireEvent.change(nameInput, { target: { value: 'Novo Nome' } });
    
    // Salvar
    fireEvent.click(screen.getByText('Salvar Alterações'));
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  it('cancela edição voltando para modo visualização', () => {
    render(<UserProfileModal {...defaultProps} />);
    
    // Botão editar
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    // Verifica que está no modo de edição (exibe Cancelar)
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    
    // Cancela a edição
    fireEvent.click(screen.getByText('Cancelar'));
    
    // A modal volta para o modo visualização (exibe Perfil e não tem botão Cancelar)
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
  });
});
