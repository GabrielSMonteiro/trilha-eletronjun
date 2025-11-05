import { useState, useEffect } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface LessonNotesProps {
  lessonId: string;
  userId: string;
}

export const LessonNotes = ({ lessonId, userId }: LessonNotesProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadNotes();
    }
  }, [isOpen, lessonId]);

  const loadNotes = async () => {
    try {
      const { data, error } = await supabase
        .from("lesson_notes" as any)
        .select("content")
        .eq("user_id", userId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading notes:", error);
      } else if (data) {
        setNotes((data as any).content || "");
      }
    } catch (error) {
      console.error("Error loading notes:", error);
    }
  };

  const saveNotes = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.from("lesson_notes" as any).upsert(
        {
          user_id: userId,
          lesson_id: lessonId,
          content: notes,
        },
        {
          onConflict: "user_id,lesson_id",
        }
      );

      if (error) {
        console.error("Error saving notes:", error);
        toast({
          title: "Erro",
          description: "Erro ao salvar anotações.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Salvo!",
          description: "Suas anotações foram salvas.",
        });
      }
    } catch (error) {
      console.error("Error saving notes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Don't render on mobile
  if (isMobile) return null;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-24 right-4 z-[60] w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        aria-label="Anotações"
      >
        <Pencil className="h-6 w-6 text-white" />
        <span className="absolute right-16 bg-card text-foreground px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
          Anotações
        </span>
      </button>

      {/* Notes Panel */}
      {isOpen && (
        <div className="fixed right-4 bottom-40 z-[60] w-80 bg-card border-2 border-border rounded-2xl shadow-strong overflow-hidden animate-scale-in">
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pencil className="h-5 w-5 text-white" />
              <h3 className="font-bold text-white">Minhas Anotações</h3>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-4 space-y-3">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Escreva suas anotações aqui..."
              className="min-h-[200px] resize-none"
            />
            <Button
              onClick={saveNotes}
              disabled={isSaving}
              className="w-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              {isSaving ? "Salvando..." : "Salvar Anotações"}
            </Button>
          </div>
        </div>
      )}
    </>
  );
};
