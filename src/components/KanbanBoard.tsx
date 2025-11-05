import { useState, useEffect } from "react";
import { KanbanSquare, X, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

interface KanbanTask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
}

interface KanbanBoardProps {
  userId: string;
}

export const KanbanBoard = ({ userId }: KanbanBoardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadTasks();
    }
  }, [isOpen]);

  const loadTasks = async () => {
    try {
      const { data, error } = await supabase
        .from("kanban_tasks")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error loading tasks:", error);
      } else {
        setTasks(data || []);
      }
    } catch (error) {
      console.error("Error loading tasks:", error);
    }
  };

  const addTask = async () => {
    if (!newTaskTitle.trim()) return;

    try {
      const { error } = await supabase.from("kanban_tasks").insert({
        user_id: userId,
        title: newTaskTitle,
        status: "todo",
      });

      if (error) {
        console.error("Error adding task:", error);
        toast({
          title: "Erro",
          description: "Erro ao adicionar tarefa.",
          variant: "destructive",
        });
      } else {
        setNewTaskTitle("");
        loadTasks();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: "todo" | "in_progress" | "done") => {
    try {
      const { error } = await supabase
        .from("kanban_tasks")
        .update({ status: newStatus })
        .eq("id", taskId);

      if (error) {
        console.error("Error updating task:", error);
      } else {
        // Celebration animation when task is completed
        if (newStatus === "done") {
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ["#10b981", "#34d399", "#6ee7b7"],
          });
          toast({
            title: "🎉 Parabéns!",
            description: "Tarefa concluída com sucesso!",
          });
        }
        loadTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from("kanban_tasks")
        .delete()
        .eq("id", taskId);

      if (error) {
        console.error("Error deleting task:", error);
      } else {
        loadTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const getTasksByStatus = (status: "todo" | "in_progress" | "done") => {
    return tasks.filter((task) => task.status === status);
  };

  const columns = [
    { id: "todo", title: "A Fazer", color: "from-blue-500 to-blue-600" },
    { id: "in_progress", title: "Em Andamento", color: "from-yellow-500 to-orange-500" },
    { id: "done", title: "Concluído", color: "from-green-500 to-emerald-600" },
  ] as const;

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-20 right-4 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center group hover:scale-110"
        aria-label="Kanban"
      >
        <KanbanSquare className="h-6 w-6 text-white" />
        <span className="absolute right-16 bg-card text-foreground px-3 py-1 rounded-lg text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md">
          Meu Progresso
        </span>
      </button>

      {/* Kanban Panel */}
      {isOpen && (
        <div className="fixed inset-4 z-50 bg-card border-2 border-border rounded-2xl shadow-strong overflow-hidden animate-scale-in flex flex-col">
          <div className="bg-gradient-to-br from-purple-500 to-indigo-600 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <KanbanSquare className="h-5 w-5 text-white" />
              <h3 className="font-bold text-white">Meu Progresso</h3>
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

          <div className="p-4 space-y-4 flex-1 overflow-y-auto">
            {/* Add Task */}
            <div className="flex gap-2">
              <Input
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="Nova tarefa..."
                onKeyPress={(e) => e.key === "Enter" && addTask()}
              />
              <Button
                onClick={addTask}
                className="bg-gradient-to-br from-purple-500 to-indigo-600"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>

            {/* Kanban Columns */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {columns.map((column) => (
                <div
                  key={column.id}
                  className="bg-muted/50 rounded-lg p-4 space-y-3"
                >
                  <div
                    className={`bg-gradient-to-br ${column.color} text-white px-3 py-2 rounded-lg font-semibold text-sm text-center`}
                  >
                    {column.title}
                  </div>

                  <div className="space-y-2">
                    {getTasksByStatus(column.id).map((task) => (
                      <div
                        key={task.id}
                        className="bg-card border border-border rounded-lg p-3 space-y-2"
                      >
                        <p className="text-sm font-medium">{task.title}</p>
                        <div className="flex gap-1">
                          {column.id !== "todo" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateTaskStatus(
                                  task.id,
                                  column.id === "done" ? "in_progress" : "todo"
                                )
                              }
                              className="flex-1 text-xs"
                            >
                              ←
                            </Button>
                          )}
                          {column.id !== "done" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateTaskStatus(
                                  task.id,
                                  column.id === "todo" ? "in_progress" : "done"
                                )
                              }
                              className="flex-1 text-xs"
                            >
                              →
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => deleteTask(task.id)}
                            className="text-xs"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
