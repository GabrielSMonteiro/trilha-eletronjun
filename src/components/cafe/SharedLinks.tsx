import { useState, useEffect } from 'react';
import { Plus, Link2, Youtube, FileText, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface SharedLink {
  id: string;
  title: string;
  url: string;
  description: string | null;
  link_type: string;
  user_id: string;
  created_at: string;
}

interface Profile {
  display_name: string;
}

export const SharedLinks = () => {
  const [links, setLinks] = useState<SharedLink[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    title: '',
    url: '',
    description: '',
    link_type: 'other'
  });
  const [userProfiles, setUserProfiles] = useState<Record<string, Profile>>({});

  useEffect(() => {
    loadLinks();
  }, []);

  const loadLinks = async () => {
    // Use the public view that doesn't expose user_id
    const { data, error } = await supabase
      .from('shared_links_public')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading links:', error);
      toast.error('Erro ao carregar links');
      return;
    }

    // Map the public view data to our interface (user_id won't be available)
    const linksWithPlaceholder = (data || []).map(link => ({
      ...link,
      user_id: '', // user_id is not exposed in public view
      description: link.description || null,
    }));

    setLinks(linksWithPlaceholder);
    
    // Since user_id is not exposed in the public view, we can't load profiles
    // Display "Comunidade" instead of individual usernames for privacy
    setUserProfiles({});
  };

  const handleAddLink = async () => {
    if (!newLink.title || !newLink.url) {
      toast.error('Preencha título e URL');
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('shared_links').insert({
      ...newLink,
      user_id: user.id
    });

    if (error) {
      toast.error('Erro ao adicionar link');
      return;
    }

    toast.success('Link adicionado!');
    setNewLink({ title: '', url: '', description: '', link_type: 'other' });
    setIsOpen(false);
    loadLinks();
  };

  const handleDeleteLink = async (id: string) => {
    const { error } = await supabase
      .from('shared_links')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao deletar link');
      return;
    }

    toast.success('Link removido');
    loadLinks();
  };

  const getLinkIcon = (type: string) => {
    switch (type) {
      case 'youtube': return <Youtube className="h-4 w-4" />;
      case 'drive': return <FileText className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'docs': return <FileText className="h-4 w-4" />;
      default: return <Link2 className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-[var(--cafe-card)] rounded-xl p-6 border border-[var(--cafe-border)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--cafe-text)]">Links de Estudo</h2>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="bg-[var(--cafe-accent)] hover:bg-[var(--cafe-accent)]/80">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-[var(--cafe-card)] border-[var(--cafe-border)]">
            <DialogHeader>
              <DialogTitle className="text-[var(--cafe-text)]">Novo Link</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Input
                placeholder="Título"
                value={newLink.title}
                onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                className="bg-[var(--cafe-bg)] border-[var(--cafe-border)] text-[var(--cafe-text)]"
              />
              <Input
                placeholder="URL"
                value={newLink.url}
                onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                className="bg-[var(--cafe-bg)] border-[var(--cafe-border)] text-[var(--cafe-text)]"
              />
              <Textarea
                placeholder="Descrição (opcional)"
                value={newLink.description}
                onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                className="bg-[var(--cafe-bg)] border-[var(--cafe-border)] text-[var(--cafe-text)]"
              />
              <Select value={newLink.link_type} onValueChange={(value) => setNewLink({ ...newLink, link_type: value })}>
                <SelectTrigger className="bg-[var(--cafe-bg)] border-[var(--cafe-border)] text-[var(--cafe-text)]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube</SelectItem>
                  <SelectItem value="drive">Google Drive</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="docs">Google Docs</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleAddLink} className="w-full bg-[var(--cafe-accent)] hover:bg-[var(--cafe-accent)]/80">
                Adicionar Link
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {links.length === 0 ? (
          <p className="text-[var(--cafe-text-muted)] text-center py-8">Nenhum link compartilhado ainda</p>
        ) : (
          links.map((link) => (
            <div key={link.id} className="bg-[var(--cafe-bg)] rounded-lg p-4 border border-[var(--cafe-border)] hover:border-[var(--cafe-accent)] transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1 text-[var(--cafe-accent)]">
                    {getLinkIcon(link.link_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-[var(--cafe-text)] mb-1">{link.title}</h3>
                    {link.description && (
                      <p className="text-sm text-[var(--cafe-text-muted)] mb-2">{link.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[var(--cafe-text-muted)]">
                      <span>Compartilhado pela comunidade</span>
                      <span>•</span>
                      <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--cafe-accent)]">
                        Abrir <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteLink(link.id)}
                  className="text-[var(--cafe-text-muted)] hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
