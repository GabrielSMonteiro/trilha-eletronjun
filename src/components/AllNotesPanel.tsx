import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { X, FileText, ChevronDown, ChevronUp, Pencil } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface LessonNote {
  id: string;
  lesson_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  lesson?: {
    title: string;
    category?: {
      display_name: string;
    };
  };
}

interface AllNotesPanelProps {
  userId: string;
  onClose: () => void;
}

export const AllNotesPanel = ({ userId, onClose }: AllNotesPanelProps) => {
  const [notes, setNotes] = useState<LessonNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadNotes();
  }, [userId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      // Load notes with lesson info
      const { data: notesData, error } = await supabase
        .from("lesson_notes")
        .select(`
          id,
          lesson_id,
          content,
          created_at,
          updated_at
        `)
        .eq("user_id", userId)
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Error loading notes:", error);
        setNotes([]);
        return;
      }

      // Load lesson titles for each note
      const notesWithLessons = await Promise.all(
        (notesData || []).map(async (note) => {
          const { data: lessonData } = await supabase
            .from("lessons")
            .select(`
              title,
              categories(display_name)
            `)
            .eq("id", note.lesson_id)
            .single();

          return {
            ...note,
            lesson: lessonData ? {
              title: lessonData.title,
              category: lessonData.categories ? {
                display_name: (lessonData.categories as any).display_name
              } : undefined
            } : undefined
          };
        })
      );

      setNotes(notesWithLessons);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (noteId: string) => {
    const newExpanded = new Set(expandedNotes);
    if (newExpanded.has(noteId)) {
      newExpanded.delete(noteId);
    } else {
      newExpanded.add(noteId);
    }
    setExpandedNotes(newExpanded);
  };

  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pencil className="h-5 w-5 text-white" />
          <h3 className="font-semibold text-white text-lg">Minhas Anotações</h3>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="hover:bg-white/20 text-white h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : notes.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma anotação ainda
            </h4>
            <p className="text-sm text-muted-foreground">
              Suas anotações aparecerão aqui quando você criar enquanto assiste os vídeos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground mb-4">
              {notes.length} anotação{notes.length !== 1 ? 'ões' : ''} encontrada{notes.length !== 1 ? 's' : ''}
            </p>
            
            {notes.map((note) => {
              const isExpanded = expandedNotes.has(note.id);
              const previewText = note.content.length > 100 
                ? note.content.substring(0, 100) + "..."
                : note.content;
              
              return (
                <Card 
                  key={note.id} 
                  className="border border-border hover:border-amber-500/30 transition-colors cursor-pointer"
                  onClick={() => toggleExpand(note.id)}
                >
                  <CardHeader className="pb-2 pt-3 px-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-medium truncate">
                          {note.lesson?.title || "Lição desconhecida"}
                        </CardTitle>
                        {note.lesson?.category && (
                          <Badge variant="secondary" className="mt-1 text-[10px]">
                            {note.lesson.category.display_name}
                          </Badge>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(note.id);
                        }}
                      >
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 pt-0">
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {isExpanded ? note.content : previewText}
                    </p>
                    <p className="text-[10px] text-muted-foreground/60 mt-2">
                      Atualizado em {formatDate(note.updated_at)}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
