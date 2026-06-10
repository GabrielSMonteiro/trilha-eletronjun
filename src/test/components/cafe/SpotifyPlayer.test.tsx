import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SpotifyPlayer } from '@/components/cafe/SpotifyPlayer';

describe('SpotifyPlayer', () => {
  it('renderiza o botão inicial do Spotify', () => {
    render(<SpotifyPlayer />);
    expect(screen.getByRole('button', { name: /Spotify/i })).toBeInTheDocument();
  });

  it('abre o modal ao clicar', () => {
    render(<SpotifyPlayer />);

    const btn = screen.getByRole('button', { name: /Spotify/i });
    fireEvent.click(btn);

    expect(screen.getByText('Música de Fundo - Spotify')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Abrir Spotify Web/i })).toBeInTheDocument();
  });

  it('abre o Spotify Web ao clicar no botão correspondente', () => {
    const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<SpotifyPlayer />);

    fireEvent.click(screen.getByRole('button', { name: /Spotify/i }));

    const openBtn = screen.getByRole('button', { name: /Abrir Spotify Web/i });
    fireEvent.click(openBtn);

    expect(windowOpenSpy).toHaveBeenCalledWith('https://open.spotify.com', '_blank');

    windowOpenSpy.mockRestore();
  });

  it('fecha o modal ao clicar no botão fechar (X)', async () => {
    render(<SpotifyPlayer />);

    
    fireEvent.click(screen.getByRole('button', { name: /Spotify/i }));
    expect(screen.getByText('Música de Fundo - Spotify')).toBeInTheDocument();

    
    
    
    
    const buttons = screen.getAllByRole('button');
    
    
    
    
    const customCloseBtn = buttons[buttons.length - 2]; 
    fireEvent.click(customCloseBtn);

    await waitFor(() => {
      expect(screen.queryByText('Música de Fundo - Spotify')).not.toBeInTheDocument();
    });
  });
});
