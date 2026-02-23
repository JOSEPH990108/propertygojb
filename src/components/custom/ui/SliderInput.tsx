// src\components\custom\ui\SliderInput.tsx
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  sublabel?: string;
  onChange: (value: number) => void;
  className?: string;
}

export function SliderInput({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  className,
}: SliderInputProps) {
  const [inputValue, setInputValue] = React.useState(value.toString());

  // Update local input state when prop value changes (e.g. via slider)
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleBlur = () => {
    const newVal = parseFloat(inputValue);
    if (!isNaN(newVal)) {
      // Clamp value on blur
      const clamped = Math.max(min, newVal);
      onChange(clamped);
      setInputValue(clamped.toString());
    } else {
      // Revert to current prop value if invalid
      setInputValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
          handleBlur();
          (e.target as HTMLInputElement).blur();
      }
  }

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChange(val);
  };

  // Calculate percentage for background gradient
  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className={cn("space-y-4 w-full", className)}>
      <div className="flex justify-between items-end">
        <label className="text-sm font-medium text-muted-foreground">{label}</label>
        <div className="relative group">
           <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">
             {unit}
           </span>
           <Input
             type="number"
             value={inputValue}
             onChange={handleInputChange}
             onBlur={handleBlur}
             onKeyDown={handleKeyDown}
             className={cn(
               "w-32 text-right font-serif text-lg bg-transparent border-transparent hover:border-border focus:border-accent transition-all pl-8 pr-2 py-1 h-auto",
               "focus:ring-0 focus:shadow-none shadow-none rounded-lg"
             )}
           />
        </div>
      </div>

      <div className="relative w-full h-6 flex items-center">
        {/* Custom Track */}
        <div className="absolute w-full h-1.5 bg-secondary rounded-full overflow-hidden">
             <div
               className="h-full bg-foreground dark:bg-foreground transition-all duration-100 ease-out"
               style={{ width: `${percentage}%` }}
             />
        </div>

        {/* Range Input (Invisible but interactive) */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleSliderChange}
          className="absolute w-full h-full opacity-0 cursor-pointer z-10"
        />

        {/* Custom Thumb (Visual Only - follows the percentage) */}
        <div
            className="absolute h-5 w-5 bg-background border-2 border-foreground rounded-full shadow-lg pointer-events-none transition-all duration-100 ease-out flex items-center justify-center"
            style={{ left: `calc(${percentage}% - 10px)` }}
        >
            <div className="w-1.5 h-1.5 bg-foreground rounded-full" />
        </div>
      </div>
    </div>
  );
}
