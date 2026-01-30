import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Image, Upload, Loader2 } from "lucide-react";

interface BackgroundImage {
  id: string;
  image_url: string;
  title: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const SUPABASE_URL = "https://usmhbawkkfzhcpaiepbs.supabase.co";

export const AdminBackgroundImages = () => {
  const [images, setImages] = useState<BackgroundImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [newImageTitle, setNewImageTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("auth_background_images")
      .select("*")
      .order("display_order", { ascending: true });

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar imagens de fundo.",
        variant: "destructive",
      });
    } else {
      setImages(data || []);
    }
    setIsLoading(false);
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo de imagem.",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB.",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Gerar nome único para o arquivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `backgrounds/${fileName}`;

      // Upload para o Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('auth-backgrounds')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Construir URL pública
      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/auth-backgrounds/${filePath}`;

      // Calcular próxima ordem
      const maxOrder = images.length > 0 
        ? Math.max(...images.map(img => img.display_order)) 
        : -1;

      // Inserir registro no banco
      const { error: insertError } = await supabase
        .from("auth_background_images")
        .insert({
          image_url: publicUrl,
          title: newImageTitle.trim() || null,
          display_order: maxOrder + 1,
          is_active: true,
        });

      if (insertError) {
        // Se falhar a inserção, tentar deletar o arquivo
        await supabase.storage.from('auth-backgrounds').remove([filePath]);
        throw insertError;
      }

      toast({
        title: "Sucesso",
        description: "Imagem adicionada com sucesso.",
      });
      setNewImageTitle("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      loadImages();
    } catch (error: any) {
      console.error('Erro no upload:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao fazer upload da imagem.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deleteImage = async (id: string, imageUrl: string) => {
    try {
      // Extrair o path do arquivo da URL
      const urlParts = imageUrl.split('/auth-backgrounds/');
      const filePath = urlParts.length > 1 ? urlParts[1] : null;

      // Deletar do banco primeiro
      const { error } = await supabase
        .from("auth_background_images")
        .delete()
        .eq("id", id);

      if (error) {
        throw error;
      }

      // Se tiver path do storage, tentar deletar o arquivo também
      if (filePath) {
        await supabase.storage.from('auth-backgrounds').remove([filePath]);
      }

      toast({
        title: "Sucesso",
        description: "Imagem excluída com sucesso.",
      });
      loadImages();
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao excluir imagem.",
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    const { error } = await supabase
      .from("auth_background_images")
      .update({ is_active: isActive })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Erro ao atualizar imagem.",
        variant: "destructive",
      });
    } else {
      loadImages();
    }
  };

  const moveImage = async (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === images.length - 1)
    ) {
      return;
    }

    const newIndex = direction === "up" ? index - 1 : index + 1;
    const currentImage = images[index];
    const swapImage = images[newIndex];

    await supabase
      .from("auth_background_images")
      .update({ display_order: swapImage.display_order })
      .eq("id", currentImage.id);

    await supabase
      .from("auth_background_images")
      .update({ display_order: currentImage.display_order })
      .eq("id", swapImage.id);

    loadImages();
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Imagens de Fundo</h1>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Imagens de Fundo</h1>
        <p className="text-muted-foreground">
          Gerencie as imagens do carrossel de fundo da tela de login
        </p>
      </div>

      {/* Add New Image */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Enviar Nova Imagem
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="image-title">Título (opcional)</Label>
              <Input
                id="image-title"
                placeholder="Descrição da imagem"
                value={newImageTitle}
                onChange={(e) => setNewImageTitle(e.target.value)}
              />
            </div>
            <div className="flex items-end gap-2">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Imagem
                  </>
                )}
              </Button>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Formatos aceitos: JPG, PNG, GIF, WEBP. Tamanho máximo: 5MB.
          </p>
        </CardContent>
      </Card>

      {/* Images List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            Imagens Configuradas ({images.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {images.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma imagem configurada.</p>
              <p className="text-sm">Envie imagens usando o formulário acima.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {images.map((image, index) => (
                <div
                  key={image.id}
                  className="flex items-center gap-4 p-4 border rounded-lg bg-background"
                >
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(index, "up")}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveImage(index, "down")}
                      disabled={index === images.length - 1}
                    >
                      ↓
                    </Button>
                  </div>

                  <div className="w-32 h-20 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    <img
                      src={image.image_url}
                      alt={image.title || "Background"}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {image.title || "Sem título"}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">
                      {image.image_url.split('/').pop()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ordem: {image.display_order + 1}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={image.is_active}
                        onCheckedChange={(checked) => toggleActive(image.id, checked)}
                      />
                      <span className="text-sm text-muted-foreground">
                        {image.is_active ? "Ativa" : "Inativa"}
                      </span>
                    </div>

                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteImage(image.id, image.image_url)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
