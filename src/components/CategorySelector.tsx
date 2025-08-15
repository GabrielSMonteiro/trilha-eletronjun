import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Code, Zap, Users, Target, Briefcase, Building2 } from "lucide-react";

interface Category {
  id: string;
  name: string;
  display_name: string;
  description: string;
}

const categoryIcons: Record<string, React.ReactNode> = {
  software: <Code className="h-4 w-4" />,
  eletronica: <Zap className="h-4 w-4" />,
  lideranca: <Users className="h-4 w-4" />,
  "gestao-pessoas": <Users className="h-4 w-4" />,
  "gestao-projetos": <Target className="h-4 w-4" />,
  mej: <Building2 className="h-4 w-4" />,
};

const categoryColors: Record<string, string> = {
  software: "text-blue-500",
  eletronica: "text-yellow-500",
  lideranca: "text-purple-500",
  "gestao-pessoas": "text-green-500",
  "gestao-projetos": "text-red-500",
  mej: "text-indigo-500",
};

interface CategorySelectorProps {
  categories: Category[];
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategorySelector = ({ categories, selectedCategory, onCategoryChange }: CategorySelectorProps) => {
  const selected = categories.find(cat => cat.name === selectedCategory) || categories[0];

  if (categories.length === 0) {
    return (
      <Button 
        variant="outline" 
        className="bg-card border-2 border-border h-12 px-4 min-w-[180px]"
        disabled
      >
        <div className="flex items-center gap-2">
          <Code className="h-4 w-4" />
          <span className="font-medium">Carregando...</span>
        </div>
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-card border-2 border-border hover:border-primary/20 shadow-soft h-12 px-4 min-w-[180px]"
        >
          <div className="flex items-center gap-2">
            <span className={categoryColors[selected.name] || "text-foreground"}>
              {categoryIcons[selected.name] || <Code className="h-4 w-4" />}
            </span>
            <span className="font-medium">{selected.display_name}</span>
            <ChevronDown className="h-4 w-4 ml-auto opacity-50" />
          </div>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-56 bg-card border-2 border-border shadow-medium rounded-xl p-2"
      >
        {categories.map((category) => (
          <DropdownMenuItem
            key={category.id}
            onClick={() => onCategoryChange(category.name)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <span className={categoryColors[category.name] || "text-foreground"}>
              {categoryIcons[category.name] || <Code className="h-4 w-4" />}
            </span>
            <span className="font-medium">{category.display_name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};