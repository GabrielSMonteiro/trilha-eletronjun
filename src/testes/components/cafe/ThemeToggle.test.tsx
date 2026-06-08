import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from '@/components/cafe/ThemeToggle';

describe('ThemeToggle', () => {
  it('exibe o botão', () => {
    render(<ThemeToggle />);
    const btn = screen.getByLabelText('Alternar tema');
    expect(btn).toBeInTheDocument();
  });

  it('alterna o tema ao ser clicado', () => {
    render(<ThemeToggle />);
    const btn = screen.getByLabelText('Alternar tema');
    
    // Inicialmente é light
    expect(document.documentElement.getAttribute('data-cafe-theme')).toBe('light');
    
    // Clica para alterar para dark
    fireEvent.click(btn);
    expect(document.documentElement.getAttribute('data-cafe-theme')).toBe('dark');
    expect(localStorage.getItem('cafe-theme')).toBe('dark');
    
    // Clica para alterar de volta para light
    fireEvent.click(btn);
    expect(document.documentElement.getAttribute('data-cafe-theme')).toBe('light');
    expect(localStorage.getItem('cafe-theme')).toBe('light');
  });
});
