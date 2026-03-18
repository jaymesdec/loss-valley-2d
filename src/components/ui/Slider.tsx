import { useCallback, useRef } from 'react';

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  ariaLabel?: string;
  color?: string;
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 0.01,
  onChange,
  ariaLabel,
  color = '#4682B4',
}: SliderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      onChange(parseFloat(event.target.value));
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      const coarseStep = (max - min) / 10;
      const fineStep = step;

      if (event.shiftKey) {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          onChange(Math.min(max, value + coarseStep));
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          onChange(Math.max(min, value - coarseStep));
        }
      } else {
        if (event.key === 'ArrowRight' || event.key === 'ArrowUp') {
          event.preventDefault();
          onChange(Math.min(max, value + fineStep));
        } else if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') {
          event.preventDefault();
          onChange(Math.max(min, value - fineStep));
        }
      }
    },
    [onChange, value, min, max, step]
  );

  const percentage = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <label
          htmlFor={`slider-${label}`}
          className="text-sm font-medium text-warm-gray-200"
        >
          {label}
        </label>
        <span
          className="font-mono text-sm font-semibold tabular-nums"
          style={{ color }}
        >
          {value.toFixed(2)}
        </span>
      </div>
      <input
        ref={inputRef}
        id={`slider-${label}`}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        aria-label={ariaLabel ?? label}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        className="slider-input h-3 w-full cursor-pointer appearance-none rounded-full outline-none focus:ring-2 focus:ring-steel-blue"
        style={{
          background: `linear-gradient(to right, ${color} 0%, ${color} ${percentage}%, #44403C ${percentage}%, #44403C 100%)`,
        }}
      />
    </div>
  );
}
