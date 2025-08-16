import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, Folder } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Nome deve ter pelo menos 2 caracteres")
    .max(50, "Nome deve ter no máximo 50 caracteres")
    .regex(/^[a-z0-9-]+$/, "Use apenas letras minúsculas, números e hífens"),
  display_name: z
    .string()
    .min(2, "Nome de exibição deve ter pelo menos 2 caracteres")
    .max(100, "Nome de exibição deve ter no máximo 100 caracteres"),
  description: z.string().optional(),
});

type CategoryForm = z.infer<typeof categorySchema>;

interface Category {
  id: string;
  name: string;
  display_name: string;
  description?: string;
  lessons_count?: number;
}

export const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const form = useForm<CategoryForm>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      display_name: "",
      description: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      // Load categories with lesson count
      const { data: categoriesData, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_name");

      if (error) {
        console.error("Error loading categories:", error);
        toast({
          title: "Erro",
          description: "Erro ao carregar categorias",
          variant: "destructive",
        });
        return;
      }

      // Get lesson counts for each category
      const categoriesWithCounts = await Promise.all(
        (categoriesData || []).map(async (category) => {
          const { data: lessonsData } = await supabase
            .from("lessons")
            .select("id")
            .eq("category_id", category.id);

          return {
            ...category,
            lessons_count: lessonsData?.length || 0,
          };
        })
      );

      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error("Error loading categories:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar categorias",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCategory = async (data: CategoryForm) => {
    try {
      // Check if name already exists
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("name")
        .eq("name", data.name)
        .single();

      if (existingCategory) {
        toast({
          title: "Erro",
          description: "Já existe uma categoria com este nome",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.from("categories").insert([{
        name: data.name,
        display_name: data.display_name,
        description: data.description || null,
      }]);

      if (error) {
        console.error("Error creating category:", error);
        toast({
          title: "Erro",
          description: "Erro ao criar categoria",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });

      setIsDialogOpen(false);
      form.reset();
      loadCategories();
    } catch (error) {
      console.error("Error creating category:", error);
      toast({
        title: "Erro",
        description: "Erro ao criar categoria",
        variant: "destructive",
      });
    }
  };

  const handleUpdateCategory = async (data: CategoryForm) => {
    if (!editingCategory) return;

    try {
      // Check if name already exists (excluding current category)
      const { data: existingCategory } = await supabase
        .from("categories")
        .select("name")
        .eq("name", data.name)
        .neq("id", editingCategory.id)
        .single();

      if (existingCategory) {
        toast({
          title: "Erro",
          description: "Já existe uma categoria com este nome",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("categories")
        .update(data)
        .eq("id", editingCategory.id);

      if (error) {
        console.error("Error updating category:", error);
        toast({
          title: "Erro",
          description: "Erro ao atualizar categoria",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });

      setIsDialogOpen(false);
      setEditingCategory(null);
      form.reset();
      loadCategories();
    } catch (error) {
      console.error("Error updating category:", error);
      toast({
        title: "Erro",
        description: "Erro ao atualizar categoria",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCategory) return;

    try {
      // Check if category has lessons
      if (deleteCategory.lessons_count! > 0) {
        toast({
          title: "Erro",
          description: "Não é possível excluir categoria que possui lições",
          variant: "destructive",
        });
        setDeleteCategory(null);
        return;
      }

      const { error } = await supabase
        .from("categories")
        .delete()
        .eq("id", deleteCategory.id);

      if (error) {
        console.error("Error deleting category:", error);
        toast({
          title: "Erro",
          description: "Erro ao excluir categoria",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });

      setDeleteCategory(null);
      loadCategories();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (category: Category) => {
    setEditingCategory(category);
    form.reset({
      name: category.name,
      display_name: category.display_name,
      description: category.description || "",
    });
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    setEditingCategory(null);
    form.reset({
      name: "",
      display_name: "",
      description: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (data: CategoryForm) => {
    if (editingCategory) {
      handleUpdateCategory(data);
    } else {
      handleCreateCategory(data);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gerenciar Categorias</h1>
          <p className="text-muted-foreground">
            Organize o conteúdo do sistema em categorias
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? "Editar Categoria" : "Nova Categoria"}
              </DialogTitle>
              <DialogDescription>
                {editingCategory
                  ? "Edite os dados da categoria"
                  : "Crie uma nova categoria para organizar as lições"}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome (slug)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: software, eletronica"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Usado na URL, apenas letras minúsculas, números e hífens
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de Exibição</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="ex: Desenvolvimento de Software"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Nome amigável mostrado aos usuários
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição da categoria..."
                          className="resize-none"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingCategory ? "Atualizar" : "Criar"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Folder className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma categoria encontrada
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie a primeira categoria para organizar o conteúdo do sistema
            </p>
            <Button onClick={openCreateDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeira Categoria
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">
                      {category.display_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground font-mono">
                      {category.name}
                    </p>
                  </div>
                  <Badge variant="secondary" className="ml-2">
                    {category.lessons_count} lições
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {category.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {category.description}
                  </p>
                )}
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(category)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDeleteCategory(category)}
                    className="hover:border-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCategory}
        onOpenChange={() => setDeleteCategory(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir a categoria{" "}
              <strong>{deleteCategory?.display_name}</strong>?
              {deleteCategory?.lessons_count! > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Esta categoria possui {deleteCategory?.lessons_count} lições e
                  não pode ser excluída.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCategory}
              className="bg-destructive hover:bg-destructive/90"
              disabled={deleteCategory?.lessons_count! > 0}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};