import { render, screen, act, renderHook } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationProvider, useNotifications } from '@/contexts/NotificationContext';
import React from 'react';

// Componente de teste para consumir o contexto
const TestComponent = () => {
  const {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotification,
    clearAll
  } = useNotifications();

  return (
    <div>
      <span data-testid="unread-count">{unreadCount}</span>
      <span data-testid="notifications-count">{notifications.length}</span>
      
      <button onClick={() => addNotification({ title: 'Test', description: 'Desc', type: 'info' })}>
        Add
      </button>
      
      {notifications.map(n => (
        <div key={n.id} data-testid={`notification-${n.id}`}>
          <span data-testid={`status-${n.id}`}>{n.read ? 'read' : 'unread'}</span>
          <button onClick={() => markAsRead(n.id)}>Mark Read {n.id}</button>
          <button onClick={() => clearNotification(n.id)}>Clear {n.id}</button>
        </div>
      ))}
      
      <button onClick={markAllAsRead}>Mark All Read</button>
      <button onClick={clearAll}>Clear All</button>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lança erro quando useNotifications é usado fora do provider', () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Render the TestComponent directly without Provider - it should throw
    expect(() => render(<TestComponent />)).toThrow(
      'useNotifications must be used within a NotificationProvider'
    );
    
    consoleError.mockRestore();
  });

  it('inicia com 0 notificações', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  it('adiciona uma notificação', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add').click();
    });
    
    expect(screen.getByTestId('unread-count')).toHaveTextContent('1');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
  });

  it('marca uma notificação como lida', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add').click();
    });
    
    const markReadBtn = screen.getByText(/Mark Read/);
    act(() => {
      markReadBtn.click();
    });
    
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('1');
  });

  it('marca todas as notificações como lidas', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add').click();
      screen.getByText('Add').click();
    });
    
    expect(screen.getByTestId('unread-count')).toHaveTextContent('2');
    
    act(() => {
      screen.getByText('Mark All Read').click();
    });
    
    expect(screen.getByTestId('unread-count')).toHaveTextContent('0');
  });

  it('remove uma notificação específica', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add').click();
    });
    
    // Pega o primeiro botão que começa com "Clear " mas não é "Clear All"
    const clearBtns = screen.getAllByText(/^Clear (?!All)/);
    act(() => {
      clearBtns[0].click();
    });
    
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });

  it('remove todas as notificações', () => {
    render(
      <NotificationProvider>
        <TestComponent />
      </NotificationProvider>
    );
    
    act(() => {
      screen.getByText('Add').click();
      screen.getByText('Add').click();
    });
    
    act(() => {
      screen.getByText('Clear All').click();
    });
    
    expect(screen.getByTestId('notifications-count')).toHaveTextContent('0');
  });
});
