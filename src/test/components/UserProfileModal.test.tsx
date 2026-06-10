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
    
    
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    
    await waitFor(() => {
      
      expect(screen.getByText('Gabriel')).toBeInTheDocument();
      expect(screen.getByText('Dev')).toBeInTheDocument();
    });
    
    expect(screen.getByText('gabriel@example.com')).toBeInTheDocument();
  });

  it('permite alternar para o modo de edição', async () => {
    render(<UserProfileModal {...defaultProps} />);
    
    
    const buttons = screen.getAllByRole('button');
    
    
    fireEvent.click(buttons[0]);
    
    
    expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByDisplayValue('Gabriel')).toBeInTheDocument();
    });
  });

  it('salva alterações de perfil', async () => {
    render(<UserProfileModal {...defaultProps} />);
    
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    
    await waitFor(() => {
      expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
    });
    const nameInput = screen.getByLabelText(/Nome/i);
    fireEvent.change(nameInput, { target: { value: 'Novo Nome' } });
    
    
    fireEvent.click(screen.getByText('Salvar Alterações'));
    
    await waitFor(() => {
      expect(supabase.from).toHaveBeenCalledWith('profiles');
    });
  });

  it('cancela edição voltando para modo visualização', () => {
    render(<UserProfileModal {...defaultProps} />);
    
    
    const buttons = screen.getAllByRole('button');
    fireEvent.click(buttons[0]);
    
    
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    
    
    fireEvent.click(screen.getByText('Cancelar'));
    
    
    expect(screen.getByText('Perfil')).toBeInTheDocument();
    expect(screen.queryByText('Cancelar')).not.toBeInTheDocument();
  });
});
