import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Video, FileText, BookOpen, Edit, Trash, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Schemas
const lessonSchema = z.object({
  title: z.string().min(5, "Título deve ter pelo menos 5 caracteres"),
  description: z.string().optional(),
  video_url: z.string().url().optional().or(z.literal("")),
  external_link: z.string().url().optional().or(z.literal("")),
  category_id: z.string().min(1, "Selecione uma categoria"),
  order_index: z.number().min(1, "Ordem deve ser maior que 0"),
});

const questionSchema = z.object({
  lesson_id: z.string().min(1, "Selecione uma lição"),
  question_text: z.string().min(10, "Pergunta deve ter pelo menos 10 caracteres"),
  option_a: z.string().min(1, "Opção A é obrigatória"),
  option_b: z.string().min(1, "Opção B é obrigatória"),
  option_c: z.string().min(1, "Opção C é obrigatória"),
  option_d: z.string().min(1, "Opção D é obrigatória"),
  correct_answer: z.number().min(0).max(3),
});

type LessonForm = z.infer<typeof lessonSchema>;
type QuestionForm = z.infer<typeof questionSchema>;

interface Category {
  id: string;
  name: string;
  display_name: string;
}

interface Lesson {
  id: string;
  title: string;
  description?: string;
  video_url?: string;
  external_link?: string;
  order_index: number;
  category_id: string;
  categories?: { display_name: string };
  questions_count?: number;
}

interface Question {
  id: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: number;
  lesson_id: string;
  lessons?: { title: string; categories?: { display_name: string } };
}

export const AdminContent = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const { toast } = useToast();

  const lessonForm = useForm<LessonForm>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      title: "",
      description: "",
      video_url: "",
      external_link: "",
      category_id: "",
      order_index: 1,
    },
    mode: "onChange",
  });

  const questionForm = useForm<QuestionForm>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      lesson_id: "",
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_answer: 0,
    },
    mode: "onChange",
  });

  useEffect(() => {
    loadCategories();
    loadLessonsWithQuestionCount();
    loadQuestions();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_name");

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as categorias.",
        variant: "destructive",
      });
    }
  };

  const loadLessonsWithQuestionCount = async () => {
    try {
      const { data: lessonsData, error: lessonsError } = await supabase
        .from("lessons")
        .select(`
          *,
          categories!inner(display_name)
        `)
        .order("order_index");

      if (lessonsError) throw lessonsError;

      // Para cada lição, contar o número de questões
      const lessonsWithCount = await Promise.all(
        (lessonsData || []).map(async (lesson) => {
          const { data: questionsData } = await supabase
            .from("questions")
            .select("id")
            .eq("lesson_id", lesson.id);

          return {
            ...lesson,
            questions_count: questionsData?.length || 0,
          };
        })
      );

      setLessons(lessonsWithCount);
    } catch (error) {
      console.error("Error loading lessons:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as lições. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const loadLessons = async () => {
    try {
      const { data, error } = await supabase
        .from("lessons")
        .select(`
          *,
          categories!inner(display_name)
        `)
        .order("order_index");

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error("Error loading lessons:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as lições. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const loadQuestions = async () => {
    const { data, error } = await supabase
      .from("questions")
      .select(`
        *,
        lessons!inner(title, categories!inner(display_name))
      `)
      .order("created_at");

    if (error) {
      console.error("Error loading questions:", error);
    } else {
      setQuestions(data || []);
    }
  };

  const onSubmitLesson = async (data: LessonForm) => {
    try {
      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update(data)
          .eq("id", editingLesson.id);

        if (error) throw error;

        toast({
          title: "Lição atualizada!",
          description: "A lição foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("lessons")
          .insert({
            title: data.title,
            description: data.description || null,
            video_url: data.video_url || null,
            external_link: data.external_link || null,
            category_id: data.category_id,
            order_index: data.order_index,
          });

        if (error) throw error;

        toast({
          title: "Lição criada!",
          description: "A lição foi criada com sucesso.",
        });
      }

      lessonForm.reset();
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
      loadLessonsWithQuestionCount();
    } catch (error) {
      console.error("Error saving lesson:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar lição. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const onSubmitQuestion = async (data: QuestionForm) => {
    try {
      if (editingQuestion) {
        const { error } = await supabase
          .from("questions")
          .update(data)
          .eq("id", editingQuestion.id);

        if (error) throw error;

        toast({
          title: "Questão atualizada!",
          description: "A questão foi atualizada com sucesso.",
        });
      } else {
        const { error } = await supabase
          .from("questions")
          .insert({
            lesson_id: data.lesson_id,
            question_text: data.question_text,
            option_a: data.option_a,
            option_b: data.option_b,
            option_c: data.option_c,
            option_d: data.option_d,
            correct_answer: data.correct_answer,
          });

        if (error) throw error;

        toast({
          title: "Questão criada!",
          description: "A questão foi criada com sucesso.",
        });
      }

      questionForm.reset();
      setIsQuestionDialogOpen(false);
      setEditingQuestion(null);
      loadQuestions();
    } catch (error) {
      console.error("Error saving question:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar questão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    lessonForm.reset({
      title: lesson.title,
      description: lesson.description || "",
      video_url: lesson.video_url || "",
      external_link: lesson.external_link || "",
      category_id: lesson.category_id,
      order_index: lesson.order_index,
    });
    setIsLessonDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    questionForm.reset({
      lesson_id: question.lesson_id,
      question_text: question.question_text,
      option_a: question.option_a,
      option_b: question.option_b,
      option_c: question.option_c,
      option_d: question.option_d,
      correct_answer: question.correct_answer,
    });
    setIsQuestionDialogOpen(true);
  };

  const handleDeleteLesson = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta lição?")) {
      const { error } = await supabase
        .from("lessons")
        .delete()
        .eq("id", id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir lição. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Lição excluída!",
          description: "A lição foi excluída com sucesso.",
        });
        loadLessonsWithQuestionCount();
      }
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir esta questão?")) {
      const { error } = await supabase
        .from("questions")
        .delete()
        .eq("id", id);

      if (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir questão. Tente novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Questão excluída!",
          description: "A questão foi excluída com sucesso.",
        });
        loadQuestions();
      }
    }
  };

  const getFilteredLessons = () => {
    return lessons.filter(lesson => {
      const matchesCategory = !selectedCategory || lesson.category_id === selectedCategory;
      const matchesSearch = !searchTerm || 
        lesson.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const getFilteredQuestions = () => {
    return questions.filter(question => {
      const matchesSearch = !searchTerm || 
        question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (question.lessons as any)?.title?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  };

  const getLessonIcon = (lesson: Lesson) => {
    if (lesson.video_url) return <Video className="h-4 w-4" />;
    if (lesson.external_link) return <FileText className="h-4 w-4" />;
    return <BookOpen className="h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Gerenciar Conteúdo</h1>
        <p className="text-muted-foreground">Crie e gerencie lições e questões</p>
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList>
          <TabsTrigger value="lessons">Lições</TabsTrigger>
          <TabsTrigger value="questions">Questões</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lições..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full sm:w-80"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as categorias</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingLesson(null);
                  lessonForm.reset({
                    title: "",
                    description: "",
                    video_url: "",
                    external_link: "",
                    category_id: "",
                    order_index: 1,
                  });
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Lição
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingLesson ? "Editar Lição" : "Criar Nova Lição"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...lessonForm}>
                  <form onSubmit={lessonForm.handleSubmit(onSubmitLesson)} className="space-y-4">
                    <FormField
                      control={lessonForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Título da lição..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={lessonForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descrição da lição..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={lessonForm.control}
                        name="video_url"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>URL do Vídeo (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://youtube.com/..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={lessonForm.control}
                        name="external_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link Externo (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={lessonForm.control}
                        name="category_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Categoria</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione uma categoria" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {categories.map((category) => (
                                  <SelectItem key={category.id} value={category.id}>
                                    {category.display_name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={lessonForm.control}
                        name="order_index"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Ordem</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="1"
                                {...field}
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsLessonDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingLesson ? "Atualizar" : "Criar"} Lição
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Lições ({getFilteredLessons().length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Lição</TableHead>
                    <TableHead>Trilha/Categoria</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Questões</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredLessons().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhuma lição encontrada
                      </TableCell>
                    </TableRow>
                  ) : (
                    getFilteredLessons().map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{lesson.title}</div>
                            <div className="text-sm text-muted-foreground">Ordem: {lesson.order_index}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {(lesson.categories as any)?.display_name}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getLessonIcon(lesson)}
                            <span className="text-sm">
                              {lesson.video_url ? "Vídeo" : lesson.external_link ? "Link" : "Texto"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {lesson.questions_count || 0} questões
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditLesson(lesson)}
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson.id)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar questões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full sm:w-80"
              />
            </div>

            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  setEditingQuestion(null);
                  questionForm.reset();
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Questão
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>
                    {editingQuestion ? "Editar Questão" : "Criar Nova Questão"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...questionForm}>
                  <form onSubmit={questionForm.handleSubmit(onSubmitQuestion)} className="space-y-4">
                    <FormField
                      control={questionForm.control}
                      name="lesson_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lição</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione uma lição" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {lessons.map((lesson) => (
                                <SelectItem key={lesson.id} value={lesson.id}>
                                  {lesson.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={questionForm.control}
                      name="question_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pergunta</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Qual é a pergunta..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={questionForm.control}
                        name="option_a"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opção A</FormLabel>
                            <FormControl>
                              <Input placeholder="Opção A..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={questionForm.control}
                        name="option_b"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opção B</FormLabel>
                            <FormControl>
                              <Input placeholder="Opção B..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={questionForm.control}
                        name="option_c"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opção C</FormLabel>
                            <FormControl>
                              <Input placeholder="Opção C..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={questionForm.control}
                        name="option_d"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opção D</FormLabel>
                            <FormControl>
                              <Input placeholder="Opção D..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={questionForm.control}
                      name="correct_answer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Resposta Correta</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a opção correta" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Opção A</SelectItem>
                              <SelectItem value="1">Opção B</SelectItem>
                              <SelectItem value="2">Opção C</SelectItem>
                              <SelectItem value="3">Opção D</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsQuestionDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit">
                        {editingQuestion ? "Atualizar" : "Criar"} Questão
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Questões ({getFilteredQuestions().length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredQuestions().map((question) => (
                  <div key={question.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="font-medium">{question.question_text}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Lição: {(question.lessons as any)?.title}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditQuestion(question)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {[
                        { label: "A", text: question.option_a, isCorrect: question.correct_answer === 0 },
                        { label: "B", text: question.option_b, isCorrect: question.correct_answer === 1 },
                        { label: "C", text: question.option_c, isCorrect: question.correct_answer === 2 },
                        { label: "D", text: question.option_d, isCorrect: question.correct_answer === 3 },
                      ].map((option) => (
                        <div 
                          key={option.label} 
                          className={`text-sm p-2 rounded border ${
                            option.isCorrect ? 'bg-green-50 border-green-200' : 'bg-gray-50'
                          }`}
                        >
                          <span className="font-medium">{option.label}:</span> {option.text}
                          {option.isCorrect && (
                            <Badge variant="secondary" className="ml-2">Correta</Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};