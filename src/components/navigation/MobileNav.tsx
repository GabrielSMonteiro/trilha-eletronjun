import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  Sparkles, 
  BarChart3, 
  Users, 
  Coffee,
  Settings,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  description?: string;
}

interface MobileNavProps {
  onSignOut?: () => void;
  userEmail?: string;
  userName?: string;
}

const navItems: NavItem[] = [
  { 
    label: "Início", 
    href: "/", 
    icon: <Home className="h-5 w-5" />,
    description: "Página inicial"
  },
  { 
    label: "Trilhas", 
    href: "/app", 
    icon: <BookOpen className="h-5 w-5" />,
    description: "Suas trilhas de aprendizado"
  },
  { 
    label: "Assistente IA", 
    href: "/ai", 
    icon: <Sparkles className="h-5 w-5" />,
    description: "Ferramentas de inteligência artificial"
  },
  { 
    label: "Estatísticas", 
    href: "/analytics", 
    icon: <BarChart3 className="h-5 w-5" />,
    description: "Seu progresso e métricas"
  },
  { 
    label: "Comunidade", 
    href: "/community", 
    icon: <Users className="h-5 w-5" />,
    description: "Fóruns e grupos de estudo"
  },
  { 
    label: "Café de Estudos", 
    href: "/cafe", 
    icon: <Coffee className="h-5 w-5" />,
    description: "Ambiente de foco com som ambiente"
  },
];

export const MobileNav = ({ onSignOut, userEmail, userName }: MobileNavProps) => {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="md:hidden h-9 w-9 p-0"
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      
      <SheetContent side="left" className="w-[300px] sm:w-[350px] p-0">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="flex items-center gap-3">
            <div className="bg-gradient-primary rounded-xl p-2">
              <img
                src="/Logo-EletronJun.png"
                alt="EletronJun Logo"
                className="w-6 h-6 object-contain"
              />
            </div>
            <div className="text-left">
              <p className="font-bold text-foreground">CapacitaJUN</p>
              <p className="text-xs text-muted-foreground font-normal">
                Sistema de Capacitações
              </p>
            </div>
          </SheetTitle>
        </SheetHeader>
        
        <nav className="flex-1 p-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-lg transition-colors",
                    "touch-manipulation active:scale-[0.98]",
                    isActive(item.href)
                      ? "bg-primary/10 text-primary font-medium"
                      : "hover:bg-muted text-foreground"
                  )}
                >
                  <span className={cn(
                    "shrink-0",
                    isActive(item.href) ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium">{item.label}</p>
                    {item.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {item.description}
                      </p>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User section */}
        <div className="mt-auto p-4 border-t border-border">
          {(userName || userEmail) && (
            <div className="mb-4 px-3">
              <p className="font-medium text-foreground truncate">
                {userName || 'Usuário'}
              </p>
              {userEmail && (
                <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
              )}
            </div>
          )}
          
          {onSignOut && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
            >
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
