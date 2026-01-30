import { AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export const SoundPlaceholder = () => {
  return (
    <Alert className="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800">
      <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
      <AlertDescription className="text-amber-800 dark:text-amber-200 text-sm">
        <strong>by Gabriel Monteiro</strong>
      </AlertDescription>
    </Alert>
  );
};
