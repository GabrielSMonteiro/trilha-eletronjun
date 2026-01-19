import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
  showHome?: boolean;
}

// Route to label mapping
const routeLabels: Record<string, string> = {
  '': 'Início',
  'app': 'Trilhas',
  'ai': 'Assistente IA',
  'analytics': 'Estatísticas',
  'community': 'Comunidade',
  'cafe': 'Café de Estudos',
  'admin': 'Administração',
  'auth': 'Login',
};

/**
 * Auto-generates breadcrumb items from current route
 */
const generateBreadcrumbsFromRoute = (pathname: string): BreadcrumbItem[] => {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) {
    return [];
  }
  
  const items: BreadcrumbItem[] = [];
  let currentPath = '';
  
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const isLast = index === segments.length - 1;
    
    items.push({
      label: routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1),
      href: isLast ? undefined : currentPath,
    });
  });
  
  return items;
};

export const Breadcrumbs = ({ items, className, showHome = true }: BreadcrumbsProps) => {
  const location = useLocation();
  
  // Use provided items or auto-generate from route
  const breadcrumbItems = items || generateBreadcrumbsFromRoute(location.pathname);
  
  // Don't render if we're at the root or have no items
  if (breadcrumbItems.length === 0) {
    return null;
  }
  
  return (
    <nav 
      aria-label="Navegação de breadcrumb" 
      className={cn(
        "flex items-center text-sm text-muted-foreground overflow-x-auto scrollbar-hide",
        className
      )}
    >
      <ol className="flex items-center gap-1 sm:gap-1.5 flex-nowrap min-w-0">
        {/* Home link */}
        {showHome && (
          <>
            <li className="flex items-center shrink-0">
              <Link 
                to="/"
                className="flex items-center gap-1 hover:text-foreground transition-colors p-1 -m-1 rounded-md hover:bg-muted/50"
                aria-label="Ir para página inicial"
              >
                <Home className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Início</span>
              </Link>
            </li>
            <li role="presentation" aria-hidden="true" className="shrink-0">
              <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/50" />
            </li>
          </>
        )}
        
        {/* Breadcrumb items */}
        {breadcrumbItems.map((item, index) => {
          const isLast = index === breadcrumbItems.length - 1;
          
          return (
            <li key={index} className="flex items-center shrink-0 min-w-0">
              {index > 0 && (
                <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/50 mr-1 sm:mr-1.5 shrink-0" />
              )}
              
              {isLast || !item.href ? (
                <span 
                  className={cn(
                    "truncate max-w-[120px] sm:max-w-none",
                    isLast && "text-foreground font-medium"
                  )}
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.icon}
                  {item.label}
                </span>
              ) : (
                <Link
                  to={item.href}
                  className="hover:text-foreground transition-colors truncate max-w-[100px] sm:max-w-none p-1 -m-1 rounded-md hover:bg-muted/50"
                >
                  {item.icon}
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
