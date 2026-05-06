import * as React from "react";
import * as RadixSlider from "@radix-ui/react-slider";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  id?: string;
  "aria-label"?: string;
  "aria-valuetext"?: string;
  className?: string;
}

export function Slider({
  value,
  onChange,
  min,
  max,
  step = 1,
  id,
  "aria-label": ariaLabel,
  "aria-valuetext": ariaValueText,
  className,
}: SliderProps): React.JSX.Element {
  return (
    <RadixSlider.Root
      className={cn("relative flex w-full touch-none select-none items-center", className)}
      value={[value]}
      onValueChange={([v]) => {
        if (v !== undefined) onChange(v);
      }}
      min={min}
      max={max}
      step={step}
      aria-label={ariaLabel}
    >
      <RadixSlider.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-border">
        <RadixSlider.Range className="absolute h-full bg-primary" />
      </RadixSlider.Track>
      <RadixSlider.Thumb
        id={id}
        aria-valuetext={ariaValueText}
        className={cn(
          "block h-4 w-4 rounded-full border-2 border-primary bg-background shadow-sm",
          "transition-shadow duration-150",
          "hover:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)]",
          "focus-visible:outline-none focus-visible:shadow-[0_0_0_4px_hsl(var(--primary)/0.25)]",
          "disabled:pointer-events-none disabled:opacity-50",
          "cursor-grab active:cursor-grabbing"
        )}
      />
    </RadixSlider.Root>
  );
}
