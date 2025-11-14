import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Network, RotateCw } from "lucide-react";

interface MindMapNode {
  title: string;
  children?: MindMapNode[];
}

interface MindMap {
  title: string;
  children: MindMapNode[];
}

export const MindMapGenerator = () => {
  const [content, setContent] = useState("");
  const [mindmap, setMindmap] = useState<MindMap | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateMindMap = async () => {
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o conteúdo para gerar o mapa mental.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-mindmap', {
        body: { content }
      });

      if (error) throw error;

      if (data.error) {
        toast({
          title: "Erro",
          description: data.error,
          variant: "destructive",
        });
        return;
      }

      setMindmap(data.mindmap);
      toast({
        title: "Sucesso!",
        description: "Mapa mental gerado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar mapa mental.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderNode = (node: MindMapNode, level: number = 0) => {
    const colors = ['bg-primary/10 border-primary', 'bg-secondary/10 border-secondary', 'bg-accent/10 border-accent'];
    const colorClass = colors[level % colors.length];

    return (
      <div key={node.title} className={`ml-${level * 4} mb-3`}>
        <div className={`inline-block px-4 py-2 rounded-lg border-2 ${colorClass}`}>
          <span className="font-medium">{node.title}</span>
        </div>
        {node.children && node.children.length > 0 && (
          <div className="ml-8 mt-2 border-l-2 border-muted pl-4 space-y-2">
            {node.children.map(child => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-primary" />
            Gerar Mapa Mental Automático
          </CardTitle>
          <CardDescription>
            Insira o conteúdo da lição e deixe a IA criar um mapa mental estruturado para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Lição</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui o conteúdo da lição para gerar um mapa mental..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>

          <Button onClick={generateMindMap} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Network className="h-4 w-4 mr-2" />
                Gerar Mapa Mental
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {mindmap && (
        <Card>
          <CardHeader>
            <CardTitle>Mapa Mental Gerado</CardTitle>
            <CardDescription>Estrutura hierárquica dos conceitos principais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Central Node */}
              <div className="flex justify-center mb-6">
                <div className="px-6 py-3 rounded-lg bg-primary text-primary-foreground font-bold text-lg border-4 border-primary">
                  {mindmap.title}
                </div>
              </div>

              {/* Children Nodes */}
              <div className="space-y-4">
                {mindmap.children.map(child => renderNode(child, 0))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};