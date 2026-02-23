// src\components\custom\ui\RangeSliderInput.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface RangeSliderInputProps {
  label: string;
  value: [number, number]; // [min, max]
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (value: [number, number]) => void;
  className?: string;
}

export function RangeSliderInput({
  label,
  value,
  min,
  max,
  step = 1000,
  unit = '',
  onChange,
  className,
}: RangeSliderInputProps) {
  const [localValue, setLocalValue] = React.useState<[number, number]>(value);
  const [minInput, setMinInput] = React.useState(value[0].toString());
  const [maxInput, setMaxInput] = React.useState(value[1].toString());

  // Sync with external value changes
  React.useEffect(() => {
    setLocalValue(value);
    setMinInput(value[0].toString());
    setMaxInput(value[1].toString());
  }, [value]);

  const handleSliderChange = (newVal: number[]) => {
      const val = newVal as [number, number];
      setLocalValue(val);
      setMinInput(val[0].toString());
      setMaxInput(val[1].toString());
      onChange(val);
  };

  const handleMinBlur = () => {
      let val = parseFloat(minInput);
      if (isNaN(val)) val = min;
      // Clamp between min and current max
      val = Math.max(min, Math.min(val, localValue[1]));
      const newValue: [number, number] = [val, localValue[1]];
      updateValue(newValue);
  };

  const handleMaxBlur = () => {
      let val = parseFloat(maxInput);
      if (isNaN(val)) val = max;
      // Clamp between current min and max
      val = Math.max(localValue[0], Math.min(val, max));
      const newValue: [number, number] = [localValue[0], val];
      updateValue(newValue);
  };

  const updateValue = (newValue: [number, number]) => {
      setLocalValue(newValue);
      setMinInput(newValue[0].toString());
      setMaxInput(newValue[1].toString());
      onChange(newValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, type: 'min' | 'max') => {
      if (e.key === 'Enter') {
          if (type === 'min') handleMinBlur();
          else handleMaxBlur();
          (e.currentTarget).blur();
      }
  }

  return (
    <div className={cn("space-y-6 w-full", className)}>
      <div className="flex justify-between items-end mb-2">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
      </div>

      <div className="flex justify-between items-center gap-4">
          {/* Min Input */}
          <div className="relative group w-32">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
               {unit}
             </span>
             <Input
               type="number"
               value={minInput}
               onChange={(e) => setMinInput(e.target.value)}
               onBlur={handleMinBlur}
               onKeyDown={(e) => handleKeyDown(e, 'min')}
               className="w-full text-right font-serif text-lg bg-muted/50 border-input hover:border-ring/50 focus:border-accent transition-all pl-8 pr-2 py-1 h-10 rounded-lg text-foreground"
             />
             <span className="text-xs text-muted-foreground absolute -bottom-5 left-0">Min</span>
          </div>

          <div className="h-[1px] flex-1 bg-border mx-2" />

          {/* Max Input */}
          <div className="relative group w-32">
             <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
               {unit}
             </span>
             <Input
               type="number"
               value={maxInput}
               onChange={(e) => setMaxInput(e.target.value)}
               onBlur={handleMaxBlur}
               onKeyDown={(e) => handleKeyDown(e, 'max')}
               className="w-full text-right font-serif text-lg bg-muted/50 border-input hover:border-ring/50 focus:border-accent transition-all pl-8 pr-2 py-1 h-10 rounded-lg text-foreground"
             />
             <span className="text-xs text-muted-foreground absolute -bottom-5 right-0">Max</span>
          </div>
      </div>

      <div className="pt-6 pb-2">
        <Slider
          value={localValue}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
}
