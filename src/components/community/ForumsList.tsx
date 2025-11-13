import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, MessageCircle, ThumbsUp, Pin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ForumThread from "./ForumThread";

interface ForumsListProps {
  userId: string;
}

const ForumsList = ({ userId }: ForumsListProps) => {
  const [forums, setForums] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedForum, setSelectedForum] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newForum, setNewForum] = useState({ title: "", description: "", category_id: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchForums();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    
    if (!error && data) setCategories(data);
  };

  const fetchForums = async () => {
    const { data, error } = await supabase
      .from("forums")
      .select(`
        *,
        categories(display_name),
        forum_posts(count)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (!error && data) setForums(data);
  };

  const handleCreateForum = async () => {
    if (!newForum.title || !newForum.category_id) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("forums")
      .insert({ ...newForum, created_by: userId });

    if (error) {
      toast({ title: "Erro ao criar fórum", variant: "destructive" });
    } else {
      toast({ title: "Fórum criado com sucesso!" });
      setIsCreateDialogOpen(false);
      setNewForum({ title: "", description: "", category_id: "" });
      fetchForums();
    }
  };

  if (selectedForum) {
    return (
      <ForumThread
        forum={selectedForum}
        userId={userId}
        onBack={() => setSelectedForum(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Fóruns de Discussão</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Novo Fórum
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Fórum</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Título</label>
                <Input
                  value={newForum.title}
                  onChange={(e) => setNewForum({ ...newForum, title: e.target.value })}
                  placeholder="Ex: Dúvidas sobre Resistores"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select
                  value={newForum.category_id}
                  onValueChange={(value) => setNewForum({ ...newForum, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Descrição</label>
                <Textarea
                  value={newForum.description}
                  onChange={(e) => setNewForum({ ...newForum, description: e.target.value })}
                  placeholder="Descreva o propósito deste fórum..."
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateForum} className="w-full">
                Criar Fórum
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {forums.map((forum) => (
          <Card
            key={forum.id}
            className="hover:shadow-lg transition-shadow cursor-pointer"
            onClick={() => setSelectedForum(forum)}
          >
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {forum.is_pinned && <Pin className="h-4 w-4 text-primary" />}
                    <CardTitle className="text-lg">{forum.title}</CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {forum.categories?.display_name}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {forum.description && (
                <p className="text-sm text-muted-foreground mb-3">{forum.description}</p>
              )}
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MessageCircle className="h-4 w-4" />
                  <span>{forum.forum_posts?.[0]?.count || 0} posts</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ForumsList;
