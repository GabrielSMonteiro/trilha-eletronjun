import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Save, Trash2, Download } from 'lucide-react';
import { PresetConfig, DEFAULT_PRESETS } from '@/types/cafe';
import { cafeService } from '@/services/cafeService';
import { toast } from 'sonner';

interface PresetManagerProps {
  onLoadPreset: (preset: PresetConfig) => void;
  getCurrentConfig: () => Omit<PresetConfig, 'id'>;
}

export const PresetManager = ({ onLoadPreset, getCurrentConfig }: PresetManagerProps) => {
  const [userPresets, setUserPresets] = useState<PresetConfig[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    const presets = await cafeService.loadUserPresets();
    setUserPresets(presets);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) {
      toast.error('Digite um nome para o preset');
      return;
    }

    const currentConfig = getCurrentConfig();
    const preset = await cafeService.savePreset({
      name: presetName,
      description: presetDescription,
      soundLevels: currentConfig.soundLevels,
      isDefault: false,
    });

    if (preset) {
      toast.success('Preset salvo com sucesso!');
      setUserPresets(prev => [preset, ...prev]);
      setIsDialogOpen(false);
      setPresetName('');
      setPresetDescription('');
    } else {
      toast.error('Erro ao salvar preset');
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    const success = await cafeService.deletePreset(presetId);
    if (success) {
      toast.success('Preset removido');
      setUserPresets(prev => prev.filter(p => p.id !== presetId));
    } else {
      toast.error('Erro ao remover preset');
    }
  };

  const allPresets = [...DEFAULT_PRESETS, ...userPresets];

  return (
    <Card className="bg-gradient-to-br from-purple-900/60 to-purple-950/80 border-purple-700/40">
      <CardHeader>
        <CardTitle className="text-lg text-foreground flex items-center justify-between">
          Presets
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Salvar
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Salvar Preset</DialogTitle>
                <DialogDescription>
                  Salve sua configuração atual para usar depois
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Nome</label>
                  <Input
                    placeholder="Meu preset favorito"
                    value={presetName}
                    onChange={(e) => setPresetName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Descrição (opcional)</label>
                  <Textarea
                    placeholder="Para quando preciso de foco total..."
                    value={presetDescription}
                    onChange={(e) => setPresetDescription(e.target.value)}
                  />
                </div>
                <Button onClick={handleSavePreset} className="w-full">
                  Salvar Preset
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {allPresets.map((preset) => (
          <div
            key={preset.id}
            className="flex items-center justify-between p-3 rounded-lg bg-card/50 hover:bg-card/70 transition-colors"
          >
            <div className="flex-1">
              <h4 className="font-medium text-sm text-foreground">{preset.name}</h4>
              {preset.description && (
                <p className="text-xs text-muted-foreground">{preset.description}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onLoadPreset(preset)}
              >
                <Download className="h-4 w-4" />
              </Button>
              {!preset.isDefault && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDeletePreset(preset.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
