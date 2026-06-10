import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { CafeTriggerButton } from '@/components/cafe/CafeTriggerButton';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('CafeTriggerButton', () => {
  it('renderiza o botão da cafeteria', () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <CafeTriggerButton />
        </TooltipProvider>
      </MemoryRouter>
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('navega para /cafe ao clicar no botão', () => {
    render(
      <MemoryRouter>
        <TooltipProvider>
          <CafeTriggerButton />
        </TooltipProvider>
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(mockNavigate).toHaveBeenCalledWith('/cafe');
  });
});
