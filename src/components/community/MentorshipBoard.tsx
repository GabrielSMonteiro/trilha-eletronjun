import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, UserCheck, Clock, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MentorshipBoardProps {
  userId: string;
}

const MentorshipBoard = ({ userId }: MentorshipBoardProps) => {
  const [requests, setRequests] = useState<any[]>([]);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [myMentorships, setMyMentorships] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({ category_id: "", description: "" });
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
    fetchRequests();
    fetchMyRequests();
    fetchMyMentorships();
  }, [userId]);

  const fetchCategories = async () => {
    const { data } = await supabase
      .from("categories")
      .select("*")
      .order("name");
    if (data) setCategories(data);
  };

  const fetchRequests = async () => {
    const { data } = await supabase
      .from("mentorship_requests")
      .select(`
        *,
        categories(display_name),
        profiles!mentorship_requests_mentee_id_fkey(display_name, avatar_url)
      `)
      .eq("status", "open")
      .neq("mentee_id", userId)
      .order("created_at", { ascending: false });

    if (data) setRequests(data);
  };

  const fetchMyRequests = async () => {
    const { data } = await supabase
      .from("mentorship_requests")
      .select(`
        *,
        categories(display_name)
      `)
      .eq("mentee_id", userId)
      .order("created_at", { ascending: false });

    if (data) setMyRequests(data);
  };

  const fetchMyMentorships = async () => {
    const { data } = await supabase
      .from("mentorship_matches")
      .select(`
        *,
        mentorship_requests(*, categories(display_name)),
        mentor_profile:profiles!mentorship_matches_mentor_id_fkey(display_name, avatar_url),
        mentee_profile:profiles!mentorship_matches_mentee_id_fkey(display_name, avatar_url)
      `)
      .or(`mentor_id.eq.${userId},mentee_id.eq.${userId}`)
      .eq("status", "active");

    if (data) setMyMentorships(data);
  };

  const handleCreateRequest = async () => {
    if (!newRequest.category_id || !newRequest.description) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from("mentorship_requests")
      .insert({ ...newRequest, mentee_id: userId });

    if (error) {
      toast({ title: "Erro ao criar pedido", variant: "destructive" });
    } else {
      toast({ title: "Pedido de mentoria criado!" });
      setIsCreateDialogOpen(false);
      setNewRequest({ category_id: "", description: "" });
      fetchMyRequests();
    }
  };

  const handleAcceptRequest = async (requestId: string, menteeId: string) => {
    const { data: matchData, error: matchError } = await supabase
      .from("mentorship_matches")
      .insert({
        request_id: requestId,
        mentor_id: userId,
        mentee_id: menteeId
      })
      .select()
      .single();

    if (matchError) {
      toast({ title: "Erro ao aceitar pedido", variant: "destructive" });
      return;
    }

    await supabase
      .from("mentorship_requests")
      .update({ status: "matched" })
      .eq("id", requestId);

    toast({ title: "Mentoria iniciada com sucesso!" });
    fetchRequests();
    fetchMyMentorships();
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      open: { label: "Aberto", variant: "default" },
      matched: { label: "Pareado", variant: "secondary" },
      closed: { label: "Fechado", variant: "outline" }
    };
    const { label, variant } = variants[status] || variants.open;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Mentoria entre Pares</h2>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Pedir Mentoria
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Mentoria</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Categoria</label>
                <Select
                  value={newRequest.category_id}
                  onValueChange={(value) => setNewRequest({ ...newRequest, category_id: value })}
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
                <label className="text-sm font-medium mb-2 block">Descreva sua necessidade</label>
                <Textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Explique com o que você precisa de ajuda..."
                  rows={4}
                />
              </div>
              <Button onClick={handleCreateRequest} className="w-full">
                Enviar Pedido
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myMentorships.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Minhas Mentorias Ativas
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {myMentorships.map((match) => {
              const isMentor = match.mentor_id === userId;
              const otherProfile = isMentor ? match.mentee_profile : match.mentor_profile;
              
              return (
                <Card key={match.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {isMentor ? "Mentorando" : "Mentor"}: {otherProfile?.display_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {match.mentorship_requests?.categories?.display_name}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {match.mentorship_requests?.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {myRequests.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold mb-3 flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Meus Pedidos
          </h3>
          <div className="space-y-3">
            {myRequests.map((request) => (
              <Card key={request.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">
                        {request.categories?.display_name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(request.created_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                    {getStatusBadge(request.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{request.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3 className="text-xl font-semibold mb-3">Pedidos Disponíveis</h3>
        <div className="space-y-3">
          {requests.map((request) => (
            <Card key={request.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      {request.categories?.display_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Por {request.profiles?.display_name} •{" "}
                      {formatDistanceToNow(new Date(request.created_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptRequest(request.id, request.mentee_id)}
                  >
                    Aceitar Mentoria
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{request.description}</p>
              </CardContent>
            </Card>
          ))}
          {requests.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                Nenhum pedido de mentoria disponível no momento
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default MentorshipBoard;
