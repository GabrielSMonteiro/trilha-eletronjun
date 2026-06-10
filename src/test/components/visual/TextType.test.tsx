import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import TextType from '@/components/TextType';

describe('TextType', () => {
  it('renderiza o texto formatado no DOM', async () => {
    render(<TextType text="Digitando" />);
    
    await waitFor(() => {
      
      const letters = screen.getAllByText(/D|i|g|t|a|n|o/);
      expect(letters.length).toBeGreaterThan(0);
    });
  });
});
