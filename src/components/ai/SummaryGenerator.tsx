import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileText, RotateCw, Copy, Check } from "lucide-react";

export const SummaryGenerator = () => {
  const [content, setContent] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const generateSummary = async () => {
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o conteúdo para gerar o resumo.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-summary', {
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

      setSummary(data.summary);
      toast({
        title: "Sucesso!",
        description: "Resumo gerado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar resumo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copySummary = () => {
    navigator.clipboard.writeText(summary);
    setCopied(true);
    toast({
      title: "Copiado!",
      description: "Resumo copiado para a área de transferência.",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Gerar Resumo Automático
          </CardTitle>
          <CardDescription>
            Insira o conteúdo da lição e deixe a IA criar um resumo estruturado para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Lição</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui o conteúdo da lição para gerar um resumo..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
            />
          </div>

          <Button onClick={generateSummary} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-2" />
                Gerar Resumo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {summary && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Resumo Gerado</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={copySummary}
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copiado
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <div className="whitespace-pre-wrap bg-muted/30 p-4 rounded-lg border">
                {summary}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};