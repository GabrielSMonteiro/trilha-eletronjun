import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { NotificationCenter } from '@/components/NotificationCenter';
import * as NotificationContext from '@/contexts/NotificationContext';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('NotificationCenter', () => {
  const mockNotifications = [
    {
      id: '1',
      title: 'Notificação 1',
      description: 'Descrição 1',
      type: 'info' as const,
      read: false,
      createdAt: new Date(),
    },
    {
      id: '2',
      title: 'Notificação 2',
      description: 'Descrição 2',
      type: 'success' as const,
      read: true,
      createdAt: new Date(),
      action: { label: 'Go', href: '/test' }
    }
  ];

  const mockContext = {
    notifications: mockNotifications,
    unreadCount: 1,
    addNotification: vi.fn(),
    markAsRead: vi.fn(),
    markAllAsRead: vi.fn(),
    clearNotification: vi.fn(),
    clearAll: vi.fn(),
  };

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <NotificationCenter />
      </MemoryRouter>
    );
  };

  it('renderiza o botão com a contagem de não lidas', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue(mockContext);
    renderComponent();
    
    const triggerBtn = screen.getByRole('button');
    expect(triggerBtn).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument(); 
  });

  it('abre o popover e exibe notificações', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue(mockContext);
    renderComponent();
    
    const triggerBtn = screen.getByRole('button');
    fireEvent.click(triggerBtn);
    
    expect(screen.getByText('Notificações')).toBeInTheDocument();
    expect(screen.getByText('Notificação 1')).toBeInTheDocument();
    expect(screen.getByText('Notificação 2')).toBeInTheDocument();
  });

  it('marca como lida ao clicar', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue(mockContext);
    renderComponent();
    
    fireEvent.click(screen.getByRole('button')); 
    fireEvent.click(screen.getByText('Notificação 1'));
    
    expect(mockContext.markAsRead).toHaveBeenCalledWith('1');
  });

  it('navega se a notificação tiver href', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue(mockContext);
    renderComponent();
    
    fireEvent.click(screen.getByRole('button')); 
    fireEvent.click(screen.getByText('Notificação 2'));
    
    expect(mockNavigate).toHaveBeenCalledWith('/test');
  });

  it('chama markAllAsRead', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue(mockContext);
    renderComponent();
    
    fireEvent.click(screen.getByRole('button')); 
    fireEvent.click(screen.getByText('Marcar lidas'));
    
    expect(mockContext.markAllAsRead).toHaveBeenCalled();
  });

  it('chama clearAll', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue(mockContext);
    renderComponent();
    
    fireEvent.click(screen.getByRole('button')); 
    fireEvent.click(screen.getByText('Limpar todas'));
    
    expect(mockContext.clearAll).toHaveBeenCalled();
  });

  it('exibe estado vazio', () => {
    vi.spyOn(NotificationContext, 'useNotifications').mockReturnValue({
      ...mockContext,
      notifications: [],
      unreadCount: 0,
    });
    renderComponent();
    
    fireEvent.click(screen.getByRole('button')); 
    expect(screen.getByText('Nenhuma notificação')).toBeInTheDocument();
  });
});
