interface ToggleProps {
  labelA: string;
  labelB: string;
  value: 'a' | 'b';
  onChange: (value: 'a' | 'b') => void;
  ariaLabel?: string;
}

export function Toggle({
  labelA,
  labelB,
  value,
  onChange,
  ariaLabel,
}: ToggleProps) {
  return (
    <div
      className="flex items-center gap-3"
      role="radiogroup"
      aria-label={ariaLabel ?? `Toggle between ${labelA} and ${labelB}`}
    >
      <button
        role="radio"
        aria-checked={value === 'a'}
        onClick={() => onChange('a')}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          value === 'a'
            ? 'bg-steel-blue text-white'
            : 'bg-charcoal-light text-warm-gray-400 hover:text-warm-gray-200'
        }`}
      >
        {labelA}
      </button>
      <button
        role="radio"
        aria-checked={value === 'b'}
        onClick={() => onChange('b')}
        className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
          value === 'b'
            ? 'bg-steel-blue text-white'
            : 'bg-charcoal-light text-warm-gray-400 hover:text-warm-gray-200'
        }`}
      >
        {labelB}
      </button>
    </div>
  );
}
