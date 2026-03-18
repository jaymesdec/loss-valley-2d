import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TIMING } from '@/lib/constants';

interface ScoreDisplayProps {
  label: string;
  value: number;
  decimals?: number;
  size?: 'sm' | 'md' | 'lg';
}

function getScoreColor(value: number, maxGood: number = 100): string {
  const ratio = Math.min(value / maxGood, 1);
  if (ratio < 0.33) return '#10B981'; // green
  if (ratio < 0.66) return '#F59E0B'; // amber
  return '#EF4444'; // red
}

export function ScoreDisplay({
  label,
  value,
  decimals = 2,
  size = 'lg',
}: ScoreDisplayProps) {
  const reducedMotion = useReducedMotion();
  const [displayValue, setDisplayValue] = useState(value);
  const animationRef = useRef<number>(0);
  const startValueRef = useRef(value);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (reducedMotion) {
      setDisplayValue(value);
      return;
    }

    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / TIMING.scoreAnimationDuration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const interpolated =
        startValueRef.current + (value - startValueRef.current) * eased;
      setDisplayValue(interpolated);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    }

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, reducedMotion]);

  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const color = getScoreColor(displayValue);

  return (
    <div className="flex flex-col items-center gap-1" role="status" aria-live="polite">
      <span className="text-xs font-medium uppercase tracking-wider text-warm-gray-400">
        {label}
      </span>
      <span
        className={`font-mono font-bold tabular-nums ${sizeClasses[size]}`}
        style={{ color }}
        aria-label={`${label}: ${value.toFixed(decimals)}`}
      >
        {displayValue.toFixed(decimals)}
      </span>
    </div>
  );
}
