import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Users, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import GroupChat from "./GroupChat";

interface StudyGroupsListProps {
  userId: string;
}

const StudyGroupsList = ({ userId }: StudyGroupsListProps) => {
  const [groups, setGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    category_id: "",
    max_members: 10,
    is_private: false
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchGroups();
    fetchMyGroups();
  }, [userId]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  };

  const fetchGroups = async () => {
    const { data } = await supabase
      .from("study_groups")
      .select(`
        *,
        categories(display_name),
        study_group_members(count)
      `)
      .eq("is_private", false)
      .order("created_at", { ascending: false });

    if (data) setGroups(data);
  };

  const fetchMyGroups = async () => {
    const { data } = await supabase
      .from("study_group_members")
      .select(`
        *,
        study_groups(*, categories(display_name))
      `)
      .eq("user_id", userId);

    if (data) {
      setMyGroups(data.map(m => m.study_groups));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name || !newGroup.category_id) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }

    const { data: groupData, error: groupError } = await supabase
      .from("study_groups")
      .insert({ ...newGroup, created_by: userId })
      .select()
      .single();

    if (groupError) {
      toast({ title: "Erro ao criar grupo", variant: "destructive" });
      return;
    }

    // Add creator as admin member
    await supabase
      .from("study_group_members")
      .insert({
        group_id: groupData.id,
        user_id: userId,
        role: "admin"
      });

    toast({ title: "Grupo criado com sucesso!" });
    setIsCreateDialogOpen(false);
    setNewGroup({ name: "", description: "", category_id: "", max_members: 10, is_private: false });
    fetchGroups();
    fetchMyGroups();
  };

  const handleJoinGroup = async (groupId: string) => {
    const { error } = await supabase
      .from("study_group_members")
      .insert({
        group_id: groupId,
        user_id: userId
      });

    if (error) {
      toast({ title: "Erro ao entrar no grupo", variant: "destructive" });
    } else {
      toast({ title: "Você entrou no grupo!" });
      fetchGroups();
      fetchMyGroups();
    }
  };

  if (selectedGroup) {
    return (
      <GroupChat
        group={selectedGroup}
        userId={userId}
        onBack={() => setSelectedGroup(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Grupos de Estudo</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Criar Grupo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Grupo de Estudo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Nome do Grupo</label>
                <Input
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  placeholder="Ex: Estudos de Eletrônica"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select
                  value={newGroup.category_id}
                  onValueChange={(value) => setNewGroup({ ...newGroup, category_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
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
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  placeholder="Descreva o objetivo do grupo..."
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Grupo Privado</label>
                <Switch
                  checked={newGroup.is_private}
                  onCheckedChange={(checked) => setNewGroup({ ...newGroup, is_private: checked })}
                />
              </div>
              <Button onClick={handleCreateGroup} className="w-full">
                Criar Grupo
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myGroups.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3">Meus Grupos</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {myGroups.map((group) => (
              <Card
                key={group.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedGroup(group)}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <span>{group.name}</span>
                    {group.is_private && <Lock className="h-4 w-4" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.categories?.display_name}
                  </p>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span>{group.study_group_members?.[0]?.count || 0} membros</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-3">Grupos Públicos</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((group) => {
            const isMember = myGroups.some(g => g.id === group.id);
            const memberCount = group.study_group_members?.[0]?.count || 0;
            const isFull = memberCount >= group.max_members;

            return (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {group.categories?.display_name}
                  </p>
                </CardHeader>
                <CardContent>
                  {group.description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{memberCount}/{group.max_members}</span>
                    </div>
                    {!isMember && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinGroup(group.id)}
                        disabled={isFull}
                      >
                        {isFull ? "Cheio" : "Entrar"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StudyGroupsList;
