import { useState, useEffect } from 'react';
import { Settings, User, Mail, Briefcase, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Profile {
  display_name: string | null;
  position: string | null;
  avatar_url: string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  userEmail: string;
}

export const UserProfileModal = ({ isOpen, onClose, userId, userEmail }: UserProfileModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState<Profile>({
    display_name: '',
    position: '',
    avatar_url: ''
  });
  const [newEmail, setNewEmail] = useState(userEmail);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadProfile();
      setNewEmail(userEmail);
    }
  }, [isOpen, userId, userEmail]);

  const loadProfile = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('display_name, position, avatar_url')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading profile:', error);
      return;
    }

    if (data) {
      setProfile(data);
    }
  };

  const handleSave = async () => {
    setLoading(true);

    // Update profile
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        display_name: profile.display_name,
        position: profile.position,
        avatar_url: profile.avatar_url
      })
      .eq('user_id', userId);

    if (profileError) {
      toast.error('Erro ao atualizar perfil');
      setLoading(false);
      return;
    }

    // Update email if changed
    if (newEmail !== userEmail) {
      const { error: emailError } = await supabase.auth.updateUser({
        email: newEmail
      });

      if (emailError) {
        toast.error('Erro ao atualizar email');
        setLoading(false);
        return;
      }

      toast.success('Email atualizado! Verifique seu novo email para confirmar a mudança.');
    } else {
      toast.success('Perfil atualizado com sucesso!');
    }

    setLoading(false);
    setIsEditing(false);
  };

  if (!isEditing) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Perfil
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 w-8 p-0"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{profile.display_name || 'Usuário'}</p>
                <p className="text-sm text-muted-foreground">{profile.position || 'Sem cargo'}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">{userEmail}</span>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Editar Perfil
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="display_name">Nome</Label>
            <Input
              id="display_name"
              value={profile.display_name || ''}
              onChange={(e) => setProfile({ ...profile, display_name: e.target.value })}
              placeholder="Seu nome"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-muted-foreground" />
              <Input
                id="position"
                value={profile.position || ''}
                onChange={(e) => setProfile({ ...profile, position: e.target.value })}
                placeholder="Seu cargo"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="seu@email.com"
              />
            </div>
            {newEmail !== userEmail && (
              <p className="text-xs text-amber-600">
                ⚠️ Você receberá um email de confirmação no novo endereço
              </p>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
