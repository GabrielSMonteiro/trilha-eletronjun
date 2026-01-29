import { memo } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Pencil, X } from "lucide-react";

interface LessonNotesPanelProps {
  notes: string;
  onNotesChange: (value: string) => void;
  onSave: () => void;
  isSaving: boolean;
  isMobile?: boolean;
  onClose?: () => void;
}

const LessonNotesPanel = memo(function LessonNotesPanel({
  notes,
  onNotesChange,
  onSave,
  isSaving,
  isMobile = false,
  onClose,
}: LessonNotesPanelProps) {
  return (
    <div 
      className="flex flex-col h-full min-h-[300px]"
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className="bg-gradient-to-br from-amber-500 to-orange-600 p-3 flex items-center justify-between rounded-t-xl">
        <div className="flex items-center gap-2">
          <Pencil className="h-4 w-4 text-white" />
          <h3 className="font-semibold text-white text-sm">Anotações</h3>
        </div>
        {isMobile && onClose && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="hover:bg-white/20 text-white h-7 w-7 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="p-3 space-y-3 flex-1 flex flex-col bg-muted/30 rounded-b-xl">
        <Textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Escreva suas anotações enquanto assiste..."
          className="min-h-[150px] flex-1 resize-none text-sm"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onFocus={(e) => e.stopPropagation()}
        />
        <Button
          onClick={(e) => {
            e.stopPropagation();
            onSave();
          }}
          disabled={isSaving}
          size="sm"
          className="w-full bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
});

export default LessonNotesPanel;
