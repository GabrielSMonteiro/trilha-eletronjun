import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import MagicButton from '@/components/MagicButton';

describe('MagicButton', () => {
  it('renderiza o botão com o texto correto e trata onClick', () => {
    const onClickMock = vi.fn();
    render(<MagicButton onClick={onClickMock}>Mágico</MagicButton>);
    
    const btn = screen.getByText('Mágico');
    expect(btn).toBeInTheDocument();
    
    fireEvent.click(btn);
    expect(onClickMock).toHaveBeenCalled();
  });
});
