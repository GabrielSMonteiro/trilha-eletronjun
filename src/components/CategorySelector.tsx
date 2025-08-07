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
  icon: React.ReactNode;
  color: string;
}

const categories: Category[] = [
  { id: "software", name: "Software", icon: <Code className="h-4 w-4" />, color: "text-blue-500" },
  { id: "eletronica", name: "Eletrônica", icon: <Zap className="h-4 w-4" />, color: "text-yellow-500" },
  { id: "lideranca", name: "Liderança", icon: <Users className="h-4 w-4" />, color: "text-purple-500" },
  { id: "gestao-pessoas", name: "Gestão de Pessoas", icon: <Users className="h-4 w-4" />, color: "text-green-500" },
  { id: "gestao-projetos", name: "Gestão de Projetos", icon: <Target className="h-4 w-4" />, color: "text-red-500" },
  { id: "mej", name: "MEJ", icon: <Building2 className="h-4 w-4" />, color: "text-indigo-500" },
];

interface CategorySelectorProps {
  selectedCategory: string;
  onCategoryChange: (categoryId: string) => void;
}

export const CategorySelector = ({ selectedCategory, onCategoryChange }: CategorySelectorProps) => {
  const selected = categories.find(cat => cat.id === selectedCategory) || categories[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-card border-2 border-border hover:border-primary/20 shadow-soft h-12 px-4 min-w-[180px]"
        >
          <div className="flex items-center gap-2">
            <span className={selected.color}>{selected.icon}</span>
            <span className="font-medium">{selected.name}</span>
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
            onClick={() => onCategoryChange(category.id)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors cursor-pointer"
          >
            <span className={category.color}>{category.icon}</span>
            <span className="font-medium">{category.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};