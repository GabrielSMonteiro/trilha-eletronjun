import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { VideoPlayer } from '@/components/VideoPlayer';

describe('VideoPlayer', () => {
  it('renderiza o estado vazio quando nenhuma url é fornecida', () => {
    render(<VideoPlayer videoUrl="" />);
    expect(screen.getByText('Conteúdo em desenvolvimento')).toBeInTheDocument();
  });

  it('renderiza iframe do YouTube quando URL é válida', () => {
    render(<VideoPlayer url="https://www.youtube.com/watch?v=dQw4w9WgXcQ" />);
    const iframe = screen.getByTitle('Video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com/embed/dQw4w9WgXcQ'));
  });

  it('renderiza iframe do YouTube com URL youtu.be', () => {
    render(<VideoPlayer url="https://youtu.be/dQw4w9WgXcQ" />);
    const iframe = screen.getByTitle('Video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', expect.stringContaining('youtube.com/embed/dQw4w9WgXcQ'));
  });

  it('renderiza iframe do Vimeo quando URL é válida', () => {
    render(<VideoPlayer url="https://vimeo.com/123456789" />);
    const iframe = screen.getByTitle('Video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', expect.stringContaining('player.vimeo.com/video/123456789'));
  });

  it('renderiza link externo quando a prop externalLink é fornecida', () => {
    render(<VideoPlayer externalLink="https://example.com/link-externo" />);
    expect(screen.getByText('Acessar Conteúdo')).toBeInTheDocument();
    expect(screen.getByRole('link')).toHaveAttribute('href', 'https://example.com/link-externo');
  });

  it('renderiza iframe para Loom', () => {
    render(<VideoPlayer url="https://www.loom.com/share/123456" />);
    const iframe = screen.getByTitle('Video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', expect.stringContaining('loom.com/embed/123456'));
  });

  it('renderiza iframe do Google Drive quando um URL do Drive é fornecido', () => {
    render(<VideoPlayer url="https://drive.google.com/file/d/123/view" />);
    const iframe = screen.getByTitle('Video player');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('src', 'https://drive.google.com/file/d/123/preview');
  });

  it('renderiza video tag para MP4 direto', () => {
    render(<VideoPlayer url="https://example.com/video.mp4" />);
    
    
    const videoSource = document.querySelector('source[src="https://example.com/video.mp4"]');
    expect(videoSource).toBeInTheDocument();
  });

  it('renderiza estado de erro para URL inválida que não encaixa em nenhum padrão', () => {
    render(<VideoPlayer url="not-a-url" />);
    expect(screen.getByText('URL de vídeo não reconhecida')).toBeInTheDocument();
  });
});
