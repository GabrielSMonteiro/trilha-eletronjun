import { useState, useEffect } from "react";
import { Play, ExternalLink, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  url?: string;
  externalLink?: string;
  title?: string;
  className?: string;
}

// Allowed video domains for validation
const ALLOWED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'www.youtube.com',
  'vimeo.com',
  'player.vimeo.com',
  'drive.google.com',
  'docs.google.com',
  'onedrive.live.com',
  '1drv.ms',
  'dailymotion.com',
  'www.dailymotion.com',
  'loom.com',
  'www.loom.com',
];

type VideoSource = 
  | { type: 'youtube'; embedUrl: string }
  | { type: 'vimeo'; embedUrl: string }
  | { type: 'google-drive'; embedUrl: string }
  | { type: 'loom'; embedUrl: string }
  | { type: 'direct'; url: string }
  | { type: 'external'; url: string }
  | { type: 'invalid'; message: string }
  | { type: 'empty' };

/**
 * Validates if a URL is from an allowed domain
 */
export const isValidVideoUrl = (url: string): boolean => {
  if (!url) return false;
  
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    // Check if it's a direct video file URL (mp4, webm, etc.)
    const path = urlObj.pathname.toLowerCase();
    if (path.endsWith('.mp4') || path.endsWith('.webm') || path.endsWith('.ogg') || path.endsWith('.mov')) {
      return true;
    }
    
    // Check against allowed domains
    return ALLOWED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith('.' + domain)
    );
  } catch {
    return false;
  }
};

/**
 * Parses a video URL and returns the appropriate embed/playback source
 */
const parseVideoUrl = (url?: string, externalLink?: string): VideoSource => {
  if (!url && !externalLink) {
    return { type: 'empty' };
  }

  const videoUrl = url || '';

  // YouTube
  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    
    if (match && match[7] && match[7].length === 11) {
      return { 
        type: 'youtube', 
        embedUrl: `https://www.youtube.com/embed/${match[7]}?rel=0&modestbranding=1` 
      };
    }
    
    // Already an embed URL
    if (videoUrl.includes('youtube.com/embed/')) {
      return { type: 'youtube', embedUrl: videoUrl };
    }
  }

  // Vimeo
  if (videoUrl.includes('vimeo.com')) {
    const vimeoRegex = /vimeo\.com\/(?:video\/)?(\d+)/;
    const match = videoUrl.match(vimeoRegex);
    
    if (match && match[1]) {
      return { 
        type: 'vimeo', 
        embedUrl: `https://player.vimeo.com/video/${match[1]}?dnt=1` 
      };
    }
    
    // Already a player URL
    if (videoUrl.includes('player.vimeo.com')) {
      return { type: 'vimeo', embedUrl: videoUrl };
    }
  }

  // Google Drive
  if (videoUrl.includes('drive.google.com') || videoUrl.includes('docs.google.com')) {
    // Extract file ID from various Google Drive URL formats
    const driveRegex = /\/d\/([a-zA-Z0-9_-]+)/;
    const match = videoUrl.match(driveRegex);
    
    if (match && match[1]) {
      return { 
        type: 'google-drive', 
        embedUrl: `https://drive.google.com/file/d/${match[1]}/preview` 
      };
    }
  }

  // Loom
  if (videoUrl.includes('loom.com')) {
    const loomRegex = /loom\.com\/share\/([a-zA-Z0-9]+)/;
    const match = videoUrl.match(loomRegex);
    
    if (match && match[1]) {
      return { 
        type: 'loom', 
        embedUrl: `https://www.loom.com/embed/${match[1]}` 
      };
    }
  }

  // Direct video file (mp4, webm, etc.)
  const isDirectVideo = /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(videoUrl);
  if (isDirectVideo) {
    return { type: 'direct', url: videoUrl };
  }

  // HTTPS URL but not recognized provider - try as direct video
  if (videoUrl.startsWith('https://')) {
    return { type: 'direct', url: videoUrl };
  }

  // Fall back to external link if provided
  if (externalLink) {
    return { type: 'external', url: externalLink };
  }

  return { type: 'invalid', message: 'URL de vídeo não reconhecida' };
};

export const VideoPlayer = ({ url, externalLink, title, className }: VideoPlayerProps) => {
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const source = parseVideoUrl(url, externalLink);

  useEffect(() => {
    setError(false);
    setLoading(true);
  }, [url, externalLink]);

  const handleIframeLoad = () => {
    setLoading(false);
  };

  const handleIframeError = () => {
    setError(true);
    setLoading(false);
  };

  const containerClasses = cn(
    "aspect-video bg-muted rounded-xl flex items-center justify-center overflow-hidden relative",
    className
  );

  // Empty state
  if (source.type === 'empty') {
    return (
      <div className={containerClasses}>
        <div className="text-center p-4">
          <Play className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">Conteúdo em desenvolvimento</p>
        </div>
      </div>
    );
  }

  // Invalid URL
  if (source.type === 'invalid') {
    return (
      <div className={containerClasses}>
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">{source.message}</p>
        </div>
      </div>
    );
  }

  // External link (non-video content)
  if (source.type === 'external') {
    return (
      <div className={containerClasses}>
        <div className="text-center p-4">
          <ExternalLink className="h-12 w-12 mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground mb-4">Conteúdo externo</p>
          <Button asChild className="bg-gradient-primary">
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              Acessar Conteúdo
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Direct video file
  if (source.type === 'direct') {
    return (
      <div className={containerClasses}>
        <video
          src={source.url}
          className="w-full h-full rounded-xl"
          controls
          muted
          playsInline
          onError={() => setError(true)}
          onLoadedData={() => setLoading(false)}
        >
          <source src={source.url} />
          Seu navegador não suporta o elemento de vídeo.
        </video>
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-xl">
            <div className="text-center p-4">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive">Erro ao carregar vídeo</p>
              <p className="text-sm text-muted-foreground mt-2">Verifique se a URL é válida</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Embedded video (YouTube, Vimeo, Google Drive, Loom)
  const embedUrl = source.embedUrl;
  
  return (
    <div className={containerClasses}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-xl z-10">
          <div className="animate-pulse flex flex-col items-center">
            <Play className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mt-2">Carregando vídeo...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="text-center p-4">
          <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive">Erro ao carregar vídeo</p>
          <p className="text-sm text-muted-foreground mt-2">Verifique se a URL é válida</p>
        </div>
      ) : (
        <iframe
          src={embedUrl}
          className="w-full h-full rounded-xl"
          allowFullScreen
          title={title || 'Video player'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      )}
    </div>
  );
};
