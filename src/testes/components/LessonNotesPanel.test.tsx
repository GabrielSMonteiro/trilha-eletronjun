import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import LessonNotesPanel from '@/components/LessonNotesPanel';

describe('LessonNotesPanel', () => {
  const defaultProps = {
    notes: 'Minhas anotações',
    onNotesChange: vi.fn(),
    onSave: vi.fn(),
    isSaving: false,
  };

  it('renderiza textarea com o valor de notes', () => {
    render(<LessonNotesPanel {...defaultProps} />);
    const textarea = screen.getByPlaceholderText('Escreva suas anotações enquanto assiste...');
    expect(textarea).toHaveValue('Minhas anotações');
  });

  it('renderiza título "Anotações"', () => {
    render(<LessonNotesPanel {...defaultProps} />);
    expect(screen.getByText('Anotações')).toBeInTheDocument();
  });

  it('chama onNotesChange ao digitar', () => {
    const onNotesChange = vi.fn();
    render(<LessonNotesPanel {...defaultProps} onNotesChange={onNotesChange} />);
    const textarea = screen.getByPlaceholderText('Escreva suas anotações enquanto assiste...');
    fireEvent.change(textarea, { target: { value: 'Novo texto' } });
    expect(onNotesChange).toHaveBeenCalledWith('Novo texto');
  });

  it('chama onSave ao clicar Salvar', () => {
    const onSave = vi.fn();
    render(<LessonNotesPanel {...defaultProps} onSave={onSave} />);
    const saveBtn = screen.getByText('Salvar');
    fireEvent.click(saveBtn);
    expect(onSave).toHaveBeenCalledTimes(1);
  });

  it('exibe "Salvando..." quando isSaving=true', () => {
    render(<LessonNotesPanel {...defaultProps} isSaving={true} />);
    expect(screen.getByText('Salvando...')).toBeInTheDocument();
  });

  it('desabilita botão quando isSaving=true', () => {
    render(<LessonNotesPanel {...defaultProps} isSaving={true} />);
    const btn = screen.getByText('Salvando...');
    expect(btn.closest('button')).toBeDisabled();
  });

  it('mostra botão close quando isMobile + onClose', () => {
    const onClose = vi.fn();
    render(<LessonNotesPanel {...defaultProps} isMobile={true} onClose={onClose} />);
    // There should be a close button (X icon)
    const buttons = screen.getAllByRole('button');
    // First button should be close, second is save
    expect(buttons.length).toBeGreaterThanOrEqual(2);
  });

  it('não mostra botão close quando isMobile=false', () => {
    render(<LessonNotesPanel {...defaultProps} isMobile={false} />);
    const buttons = screen.getAllByRole('button');
    // Only save button
    expect(buttons.length).toBe(1);
  });

  it('chama onClose ao clicar no botão fechar', () => {
    const onClose = vi.fn();
    render(<LessonNotesPanel {...defaultProps} isMobile={true} onClose={onClose} />);
    const buttons = screen.getAllByRole('button');
    // Close button should be the first one
    fireEvent.click(buttons[0]);
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
