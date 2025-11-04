import { useState } from 'react';
import { Music, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SpotifyPlayer = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-[var(--cafe-text-muted)] hover:text-[var(--cafe-accent)] hover:bg-[var(--cafe-accent)]/10"
        >
          <Music className="h-4 w-4" />
          Spotify
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-[var(--cafe-card)] border-[var(--cafe-border)] max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-[var(--cafe-text)]">Música de Fundo - Spotify</DialogTitle>
        </DialogHeader>
        
        <Alert className="bg-[var(--cafe-bg)] border-[var(--cafe-border)]">
          <AlertDescription className="text-[var(--cafe-text-muted)]">
            Para usar o Spotify Web Player, você precisa:
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Ter uma conta Spotify Premium</li>
              <li>Configurar o Spotify Web Playback SDK</li>
              <li>Obter credenciais da API do Spotify no <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[var(--cafe-accent)] hover:underline">Developer Dashboard</a></li>
            </ol>
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <p className="text-sm text-[var(--cafe-text-muted)]">
            A integração completa do Spotify requer configuração adicional com suas credenciais de API. 
            Por enquanto, você pode usar o player do Spotify em outra aba do navegador enquanto usa a cafeteria.
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={() => window.open('https://open.spotify.com', '_blank')}
              className="flex-1 bg-[#1DB954] hover:bg-[#1DB954]/80 text-white"
            >
              <Music className="h-4 w-4 mr-2" />
              Abrir Spotify Web
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              className="border-[var(--cafe-border)]"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
