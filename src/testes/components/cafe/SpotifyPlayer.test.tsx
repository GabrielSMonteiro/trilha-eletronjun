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

    // Abre o modal
    fireEvent.click(screen.getByRole('button', { name: /Spotify/i }));
    expect(screen.getByText('Música de Fundo - Spotify')).toBeInTheDocument();

    // O shadcn Dialog coloca um botão "Close" padrão (ícone X) e nós adicionamos outro.
    // O nosso botão customizado chama setIsOpen(false) e fica ao lado do "Abrir Spotify Web".
    // Encontramos o botão que não é o "Abrir Spotify Web" nem o botão de fechar padrão do shadcn.
    // O nosso botão é o penúltimo botão (o último é o padrão do shadcn "Close").
    const buttons = screen.getAllByRole('button');
    // buttons[0] = "Spotify" (trigger - pode não estar visível no portal)
    // buttons dentro do Dialog:
    //   "Abrir Spotify Web", nosso botão X (variante outline), e o Close padrão do shadcn
    // O nosso botão personalizado de fechar chama setIsOpen(false)
    const customCloseBtn = buttons[buttons.length - 2]; // penúltimo: nosso botão X (o último é o shadcn Close)
    fireEvent.click(customCloseBtn);

    await waitFor(() => {
      expect(screen.queryByText('Música de Fundo - Spotify')).not.toBeInTheDocument();
    });
  });
});
