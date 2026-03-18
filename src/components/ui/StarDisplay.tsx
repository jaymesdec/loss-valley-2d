import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TIMING } from '@/lib/constants';

interface StarDisplayProps {
  earned: number;
  total?: number;
  onStarEarned?: () => void;
}

function Star({ filled, animating }: { filled: boolean; animating: boolean }) {
  const reducedMotion = useReducedMotion();

  const baseClasses = 'inline-block text-3xl transition-transform';
  const animateClasses =
    animating && !reducedMotion ? 'animate-star-pop' : '';

  return (
    <span
      className={`${baseClasses} ${animateClasses}`}
      role="img"
      aria-hidden="true"
    >
      <svg
        width="32"
        height="32"
        viewBox="0 0 24 24"
        fill={filled ? '#F59E0B' : 'none'}
        stroke={filled ? '#D97706' : '#57534E'}
        strokeWidth="2"
        className={filled ? 'drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]' : ''}
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    </span>
  );
}

export function StarDisplay({
  earned,
  total = 3,
  onStarEarned,
}: StarDisplayProps) {
  const [animatingIndex, setAnimatingIndex] = useState<number | null>(null);
  const previousEarnedRef = useRef(earned);

  useEffect(() => {
    if (earned > previousEarnedRef.current) {
      setAnimatingIndex(earned - 1);
      onStarEarned?.();

      const timeout = setTimeout(() => {
        setAnimatingIndex(null);
      }, TIMING.starPopDuration);

      previousEarnedRef.current = earned;
      return () => clearTimeout(timeout);
    }
    previousEarnedRef.current = earned;
  }, [earned, onStarEarned]);

  return (
    <div
      className="flex items-center gap-1"
      role="status"
      aria-label={`${earned} of ${total} stars earned`}
    >
      {Array.from({ length: total }, (_, index) => (
        <Star
          key={index}
          filled={index < earned}
          animating={index === animatingIndex}
        />
      ))}
    </div>
  );
}
