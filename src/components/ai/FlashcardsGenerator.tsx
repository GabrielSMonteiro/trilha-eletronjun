import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, RotateCw, ChevronLeft, ChevronRight } from "lucide-react";

interface Flashcard {
  front: string;
  back: string;
}

export const FlashcardsGenerator = () => {
  const [content, setContent] = useState("");
  const [count, setCount] = useState(5);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const generateFlashcards = async () => {
    if (!content.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o conteúdo para gerar flashcards.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-flashcards', {
        body: { content, count }
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

      setFlashcards(data.flashcards);
      setCurrentCard(0);
      setIsFlipped(false);
      toast({
        title: "Sucesso!",
        description: `${data.flashcards.length} flashcards gerados com sucesso.`,
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao gerar flashcards.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev + 1) % flashcards.length);
  };

  const prevCard = () => {
    setIsFlipped(false);
    setCurrentCard((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Gerar Flashcards Automáticos
          </CardTitle>
          <CardDescription>
            Insira o conteúdo da lição e deixe a IA criar flashcards educacionais para você.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="content">Conteúdo da Lição</Label>
            <Textarea
              id="content"
              placeholder="Cole aqui o conteúdo da lição para gerar flashcards..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="count">Número de Flashcards</Label>
            <Input
              id="count"
              type="number"
              min="1"
              max="20"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
            />
          </div>

          <Button onClick={generateFlashcards} disabled={loading} className="w-full">
            {loading ? (
              <>
                <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Gerar Flashcards
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {flashcards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Flashcards Gerados</CardTitle>
            <CardDescription>
              Cartão {currentCard + 1} de {flashcards.length}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="relative h-64 cursor-pointer perspective-1000"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              <div
                className={`absolute inset-0 transition-transform duration-500 transform-style-3d ${
                  isFlipped ? 'rotate-y-180' : ''
                }`}
              >
                {/* Front */}
                <div className="absolute inset-0 backface-hidden">
                  <Card className="h-full flex items-center justify-center bg-primary/5 border-2 border-primary">
                    <CardContent className="text-center p-6">
                      <p className="text-lg font-medium">{flashcards[currentCard].front}</p>
                      <p className="text-sm text-muted-foreground mt-4">
                        Clique para ver a resposta
                      </p>
                    </CardContent>
                  </Card>
                </div>

                {/* Back */}
                <div className="absolute inset-0 backface-hidden rotate-y-180">
                  <Card className="h-full flex items-center justify-center bg-secondary/5 border-2 border-secondary">
                    <CardContent className="text-center p-6">
                      <p className="text-lg">{flashcards[currentCard].back}</p>
                      <p className="text-sm text-muted-foreground mt-4">
                        Clique para ver a pergunta
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevCard}
                disabled={flashcards.length <= 1}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Anterior
              </Button>
              <Button
                variant="outline"
                onClick={nextCard}
                disabled={flashcards.length <= 1}
              >
                Próximo
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};