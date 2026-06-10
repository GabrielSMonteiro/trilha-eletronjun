import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RotatingText from '@/components/RotatingText';

describe('RotatingText', () => {
  it('renderiza o componente e pelo menos o primeiro texto', () => {
    render(<RotatingText texts={['Texto1', 'Texto2']} />);
    
    expect(screen.getByText(/Texto1/i)).toBeInTheDocument();
  });
});
