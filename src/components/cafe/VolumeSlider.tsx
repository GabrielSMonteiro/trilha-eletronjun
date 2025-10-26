import { Slider } from '@/components/ui/slider';
import { Volume2, VolumeX } from 'lucide-react';
import { useCallback } from 'react';

interface VolumeSliderProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  vertical?: boolean;
}

export const VolumeSlider = ({ value, onChange, label, vertical = false }: VolumeSliderProps) => {
  const handleChange = useCallback((values: number[]) => {
    onChange(values[0] / 100);
  }, [onChange]);

  const displayValue = Math.round(value * 100);

  return (
    <div className={`flex ${vertical ? 'flex-col' : 'flex-row'} items-center gap-3 w-full`}>
      {displayValue === 0 ? (
        <VolumeX className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      ) : (
        <Volume2 className="h-4 w-4 text-primary flex-shrink-0" />
      )}
      
      <div className="flex-1 w-full">
        <Slider
          value={[displayValue]}
          onValueChange={handleChange}
          max={100}
          step={1}
          className="w-full"
          aria-label={label || 'Volume'}
        />
      </div>
      
      <span className="text-xs font-medium text-muted-foreground min-w-[3ch] text-right">
        {displayValue}
      </span>
    </div>
  );
};
