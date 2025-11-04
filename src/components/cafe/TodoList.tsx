import { useState, useEffect } from 'react';
import { Plus, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  created_at: string;
}

export const TodoList = () => {
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [newTodo, setNewTodo] = useState('');

  useEffect(() => {
    loadTodos();
  }, []);

  const loadTodos = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('todo_items')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading todos:', error);
      return;
    }

    setTodos(data || []);
  };

  const handleAddTodo = async () => {
    if (!newTodo.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('todo_items').insert({
      title: newTodo,
      user_id: user.id,
      completed: false
    });

    if (error) {
      toast.error('Erro ao adicionar tarefa');
      return;
    }

    setNewTodo('');
    loadTodos();
  };

  const handleToggleTodo = async (id: string, completed: boolean) => {
    const { error } = await supabase
      .from('todo_items')
      .update({ completed: !completed })
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar tarefa');
      return;
    }

    loadTodos();
  };

  const handleDeleteTodo = async (id: string) => {
    const { error } = await supabase
      .from('todo_items')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao deletar tarefa');
      return;
    }

    loadTodos();
  };

  return (
    <div className="bg-[var(--cafe-card)] rounded-xl p-6 border border-[var(--cafe-border)]">
      <h2 className="text-xl font-semibold text-[var(--cafe-text)] mb-4">TODO</h2>
      
      <div className="flex gap-2 mb-4">
        <Input
          placeholder="add a todo item"
          value={newTodo}
          onChange={(e) => setNewTodo(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddTodo()}
          className="bg-[var(--cafe-bg)] border-[var(--cafe-border)] text-[var(--cafe-text)] placeholder:text-[var(--cafe-text-muted)]"
        />
        <Button onClick={handleAddTodo} size="icon" className="bg-[var(--cafe-accent)] hover:bg-[var(--cafe-accent)]/80 shrink-0">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2 max-h-80 overflow-y-auto">
        {todos.length === 0 ? (
          <p className="text-[var(--cafe-text-muted)] text-center py-8 text-sm italic">what to do?</p>
        ) : (
          todos.map((todo) => (
            <div
              key={todo.id}
              className="flex items-center gap-3 bg-[var(--cafe-bg)] rounded-lg p-3 border border-[var(--cafe-border)] group"
            >
              <Checkbox
                checked={todo.completed}
                onCheckedChange={() => handleToggleTodo(todo.id, todo.completed)}
                className="border-[var(--cafe-border)]"
              />
              <span className={`flex-1 text-[var(--cafe-text)] ${todo.completed ? 'line-through opacity-50' : ''}`}>
                {todo.title}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDeleteTodo(todo.id)}
                className="text-[var(--cafe-text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))
        )}
      </div>

      {todos.length > 0 && (
        <div className="mt-4 pt-4 border-t border-[var(--cafe-border)]">
          <Button
            variant="ghost"
            size="sm"
            className="text-[var(--cafe-text-muted)] hover:text-[var(--cafe-accent)] text-xs"
          >
            <Check className="h-3 w-3 mr-1" />
            save list
          </Button>
        </div>
      )}
    </div>
  );
};
