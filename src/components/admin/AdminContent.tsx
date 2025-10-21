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
  FormDescription,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Video, FileText, BookOpen, Edit, Trash, Search, Upload, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

// Video upload validation constants
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'];
const ALLOWED_EXTENSIONS = ['mp4', 'webm', 'ogg', 'mov'];
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

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
  option_e: z.string().min(1, "Opção E é obrigatória"),
  correct_answer: z.number().min(0).max(4),
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
  option_e: string;
  correct_answer: number;
  lesson_id: string;
  lessons?: { title: string; categories?: { display_name: string } };
}

export const AdminContent = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
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
      option_e: "",
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
      if (import.meta.env?.DEV) console.error("Error loading categories:", error);
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
      if (import.meta.env?.DEV) console.error("Error loading lessons:", error);
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
      if (import.meta.env?.DEV) console.error("Error loading lessons:", error);
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
      if (import.meta.env?.DEV) console.error("Error loading questions:", error);
    } else {
      setQuestions(data || []);
    }
  };

  const handleVideoUpload = async (file: File): Promise<string | null> => {
    try {
      setUploadingVideo(true);

      if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
        toast({
          title: "Tipo de arquivo inválido",
          description: `Apenas vídeos são permitidos. Tipo recebido: ${file.type}`,
          variant: "destructive",
        });
        return null;
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase();
      if (!fileExt || !ALLOWED_EXTENSIONS.includes(fileExt)) {
        toast({
          title: "Extensão inválida",
          description: "Extensões permitidas: mp4, webm, ogg, mov",
          variant: "destructive",
        });
        return null;
      }

      const mimeToExt: Record<string, string[]> = {
        'video/mp4': ['mp4'],
        'video/webm': ['webm'],
        'video/ogg': ['ogg'],
        'video/quicktime': ['mov']
      };

      if (!mimeToExt[file.type]?.includes(fileExt)) {
        toast({
          title: "Incompatibilidade detectada",
          description: "A extensão do arquivo não corresponde ao tipo de vídeo",
          variant: "destructive",
        });
        return null;
      }

      if (file.size === 0) {
        toast({
          title: "Arquivo vazio",
          description: "O arquivo selecionado está vazio",
          variant: "destructive",
        });
        return null;
      }

      if (file.size > MAX_FILE_SIZE) {
        const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
        toast({
          title: "Arquivo muito grande",
          description: `Tamanho: ${sizeMB}MB. Máximo permitido: 500MB`,
          variant: "destructive",
        });
        return null;
      }

      const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError, data } = await supabase.storage
        .from('lesson-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      return filePath;
    } catch (error) {
      if (import.meta.env?.DEV) console.error('Error uploading video:', error);
      toast({
        title: "Erro",
        description: "Erro ao fazer upload do vídeo. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingVideo(false);
    }
  };

  const onSubmitLesson = async (data: LessonForm) => {
    try {
      let videoUrl = data.video_url;

      if (videoFile) {
        const uploadedUrl = await handleVideoUpload(videoFile);
        if (uploadedUrl) {
          videoUrl = uploadedUrl;
        }
      }

      if (editingLesson) {
        const { error } = await supabase
          .from("lessons")
          .update({
            ...data,
            video_url: videoUrl || null,
          })
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
            video_url: videoUrl || null,
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
      setVideoFile(null);
      setIsLessonDialogOpen(false);
      setEditingLesson(null);
      loadLessonsWithQuestionCount();
    } catch (error) {
      if (import.meta.env?.DEV) console.error("Error saving lesson:", error);
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
            option_e: data.option_e,
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
      loadLessonsWithQuestionCount();
    } catch (error) {
      if (import.meta.env?.DEV) console.error("Error saving question:", error);
      toast({
        title: "Erro",
        description: "Erro ao salvar questão. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setVideoFile(null);
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
      option_e: question.option_e,
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
        loadLessonsWithQuestionCount();
      }
    }
  };

  const getFilteredLessons = () => {
    return lessons.filter(lesson => {
      const matchesCategory = selectedCategory === "all" || lesson.category_id === selectedCategory;
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
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Gerenciar Conteúdo</h1>
        <p className="text-sm md:text-base text-muted-foreground">Crie e gerencie lições e questões</p>
      </div>

      <Tabs defaultValue="lessons" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="lessons">Lições</TabsTrigger>
          <TabsTrigger value="questions">Questões</TabsTrigger>
        </TabsList>

        <TabsContent value="lessons" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar lições..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>

              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full sm:w-auto sm:min-w-[200px]">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
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
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setEditingLesson(null);
                    setVideoFile(null);
                    lessonForm.reset({
                      title: "",
                      description: "",
                      video_url: "",
                      external_link: "",
                      category_id: "",
                      order_index: 1,
                    });
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Lição
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingLesson ? "Editar Lição" : "Criar Nova Lição"}
                  </DialogTitle>
                </DialogHeader>

                <Form {...lessonForm}>
                  <form onSubmit={lessonForm.handleSubmit(onSubmitLesson)} className="space-y-4">
                    {/* Lesson form fields */}
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

                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-border rounded-lg p-6">
                        <FormLabel className="block mb-2">Vídeo da Lição</FormLabel>
                        <FormDescription className="mb-4">
                          Você pode fazer upload de um arquivo de vídeo ou inserir um link do YouTube/Vimeo
                        </FormDescription>
                        
                        <div className="space-y-4">
                          {/* Video file upload */}
                          <div>
                            <Label htmlFor="video-file" className="block text-sm mb-2">
                              Upload de Arquivo
                            </Label>
                            <div className="flex items-center gap-2">
                              <Input
                                id="video-file"
                                type="file"
                                accept="video/mp4,video/webm,video/ogg,video/quicktime"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setVideoFile(file);
                                    lessonForm.setValue('video_url', '');
                                  }
                                }}
                                disabled={uploadingVideo}
                                className="flex-1"
                              />
                              {videoFile && (
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setVideoFile(null)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                            {videoFile && (
                              <p className="text-sm text-muted-foreground mt-2">
                                Arquivo selecionado: {videoFile.name}
                              </p>
                            )}
                          </div>

                          {/* Or separator */}
                          <div className="flex items-center gap-4">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-sm text-muted-foreground">OU</span>
                            <div className="flex-1 h-px bg-border" />
                          </div>

                          {/* Video URL */}
                          <FormField
                            control={lessonForm.control}
                            name="video_url"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL do Vídeo (YouTube, Vimeo, etc.)</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="https://youtube.com/watch?v=..." 
                                    {...field}
                                    onChange={(e) => {
                                      field.onChange(e);
                                      if (e.target.value) {
                                        setVideoFile(null);
                                      }
                                    }}
                                    disabled={!!videoFile}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <FormField
                        control={lessonForm.control}
                        name="external_link"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link Externo (opcional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://..." {...field} />
                            </FormControl>
                            <FormDescription>
                              Link para material complementar, documentação, etc.
                            </FormDescription>
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
                        onClick={() => {
                          setIsLessonDialogOpen(false);
                          setVideoFile(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={uploadingVideo}>
                        {uploadingVideo ? (
                          <>
                            <Upload className="h-4 w-4 mr-2 animate-spin" />
                            Fazendo upload...
                          </>
                        ) : (
                          <>{editingLesson ? "Atualizar" : "Criar"} Lição</>
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg md:text-xl">Lições ({getFilteredLessons().length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0 sm:p-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Lição</TableHead>
                      <TableHead className="hidden md:table-cell">Trilha/Categoria</TableHead>
                      <TableHead className="hidden lg:table-cell">Tipo</TableHead>
                      <TableHead className="min-w-[80px]">Questões</TableHead>
                      <TableHead className="text-right min-w-[120px]">Ações</TableHead>
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
                            <div className="min-w-0">
                              <div className="font-medium truncate">{lesson.title}</div>
                              <div className="text-xs md:text-sm text-muted-foreground flex flex-wrap gap-2 mt-1">
                                <span>Ordem: {lesson.order_index}</span>
                                <span className="md:hidden">
                                  • {(lesson.categories as any)?.display_name}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <Badge variant="outline">
                              {(lesson.categories as any)?.display_name}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            <div className="flex items-center gap-2">
                              {getLessonIcon(lesson)}
                              <span className="text-sm">
                                {lesson.video_url ? "Vídeo" : lesson.external_link ? "Link" : "Texto"}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">
                              {lesson.questions_count || 0}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditLesson(lesson)}
                                className="h-8 px-2"
                              >
                                <Edit className="h-4 w-4 md:mr-1" />
                                <span className="hidden md:inline">Editar</span>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteLesson(lesson.id)}
                                className="h-8 w-8 p-0"
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
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="flex flex-col gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar questões..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full"
              />
            </div>

            <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  className="w-full sm:w-auto"
                  onClick={() => {
                    setEditingQuestion(null);
                    questionForm.reset();
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Questão
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
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

                    <div className="space-y-4">
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

                      <FormField
                        control={questionForm.control}
                        name="option_e"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Opção E</FormLabel>
                            <FormControl>
                              <Input placeholder="Opção E..." {...field} />
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
                              <SelectItem value="4">Opção E</SelectItem>
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
              <CardTitle className="text-lg md:text-xl">Questões ({getFilteredQuestions().length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {getFilteredQuestions().length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhuma questão encontrada</p>
                    <p className="text-sm mt-2">Crie questões para as lições cadastradas</p>
                  </div>
                ) : (
                  getFilteredQuestions().map((question) => (
                    <div key={question.id} className="border rounded-lg p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row gap-3 sm:justify-between sm:items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium break-words">{question.question_text}</p>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1 truncate">
                            Lição: {(question.lessons as any)?.title}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditQuestion(question)}
                            className="h-8"
                          >
                            <Edit className="h-4 w-4 md:mr-1" />
                            <span className="hidden md:inline">Editar</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteQuestion(question.id)}
                            className="h-8 w-8 p-0"
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {[
                          { label: "A", text: question.option_a, isCorrect: question.correct_answer === 0 },
                          { label: "B", text: question.option_b, isCorrect: question.correct_answer === 1 },
                          { label: "C", text: question.option_c, isCorrect: question.correct_answer === 2 },
                          { label: "D", text: question.option_d, isCorrect: question.correct_answer === 3 },
                          { label: "E", text: question.option_e, isCorrect: question.correct_answer === 4 },
                        ].map((option) => (
                          <div 
                            key={option.label} 
                            className={`text-sm p-2 rounded border break-words ${
                              option.isCorrect ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : 'bg-gray-50 dark:bg-gray-800/50'
                            }`}
                          >
                            <span className="font-medium">{option.label}:</span> {option.text}
                            {option.isCorrect && (
                              <Badge variant="secondary" className="ml-2 text-xs">Correta</Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
