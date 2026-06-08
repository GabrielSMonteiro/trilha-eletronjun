import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StudyTimer } from '@/components/cafe/StudyTimer';

// Mock Notification API for jsdom
beforeEach(() => {
  // Notification precisa ser uma classe (construtor) para que 'new Notification(...)' funcione
  class NotificationMock {
    static permission = 'granted';
    static requestPermission = vi.fn().mockResolvedValue('granted');
    constructor(public title: string, public options?: any) {}
  }
  Object.defineProperty(globalThis, 'Notification', {
    value: NotificationMock,
    writable: true,
    configurable: true,
  });
});

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('StudyTimer', () => {
  it('renderiza com 30:00 por padrão', () => {
    render(<StudyTimer onComplete={() => {}} />);
    expect(screen.getByText('30:00')).toBeInTheDocument();
  });

  it('alterna o status do timer ao clicar no botão de play', () => {
    render(<StudyTimer onComplete={() => {}} />);

    const playBtn = screen.getByText(/Iniciar/i);
    fireEvent.click(playBtn);

    expect(screen.getByText(/Pausar/i)).toBeInTheDocument();

    // Pausa
    fireEvent.click(screen.getByText(/Pausar/i));
    expect(screen.getByText(/Retomar/i)).toBeInTheDocument();
  });

  it('permite selecionar tempos predefinidos', () => {
    render(<StudyTimer onComplete={() => {}} />);

    expect(screen.getByText('30:00')).toBeInTheDocument();

    const btn15 = screen.getByRole('button', { name: '15m' });
    fireEvent.click(btn15);

    expect(screen.getByText('15:00')).toBeInTheDocument();
  });

  it('decrementa o timer ao avançar o tempo', () => {
    vi.useFakeTimers();

    render(<StudyTimer onComplete={() => {}} />);

    // Seleciona 5 min
    fireEvent.click(screen.getByRole('button', { name: '5m' }));

    // Inicia
    fireEvent.click(screen.getByText(/Iniciar/i));

    // Avança 1 segundo dentro de act para que React processe o setState
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(screen.getByText('04:59')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('conclui o timer e chama onComplete', () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();

    render(<StudyTimer onComplete={onComplete} />);

    // Seleciona 5 min
    fireEvent.click(screen.getByRole('button', { name: '5m' }));
    fireEvent.click(screen.getByText(/Iniciar/i));

    // Avança todo o tempo (5 min = 300s)
    act(() => {
      vi.advanceTimersByTime(300 * 1000);
    });

    expect(onComplete).toHaveBeenCalled();
    // Após completar, reseta para 05:00
    expect(screen.getByText('05:00')).toBeInTheDocument();

    vi.useRealTimers();
  });

  it('reseta o timer ao clicar em reset', () => {
    render(<StudyTimer onComplete={() => {}} />);

    // Seleciona 15m
    fireEvent.click(screen.getByRole('button', { name: '15m' }));
    expect(screen.getByText('15:00')).toBeInTheDocument();

    // Inicia o timer
    fireEvent.click(screen.getByText(/Iniciar/i));
    expect(screen.getByText(/Pausar/i)).toBeInTheDocument();

    // Clica no botão de reset (último botão na lista: play/pause vem primeiro, reset é icon-only)
    const buttons = screen.getAllByRole('button');
    const resetBtn = buttons[buttons.length - 1];
    fireEvent.click(resetBtn);

    // Deve voltar ao Iniciar e ao tempo original
    expect(screen.getByText('15:00')).toBeInTheDocument();
    expect(screen.getByText(/Iniciar/i)).toBeInTheDocument();
  });
});
