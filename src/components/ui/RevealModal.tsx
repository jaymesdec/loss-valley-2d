import { useState, useEffect, useCallback, useRef } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { TIMING } from '@/lib/constants';

interface RevealItem {
  text: string;
  highlight?: boolean;
}

interface RevealModalProps {
  items: RevealItem[];
  onComplete: () => void;
  title?: string;
}

export function RevealModal({
  items,
  onComplete,
  title = 'Reveal',
}: RevealModalProps) {
  const reducedMotion = useReducedMotion();
  const [visibleCount, setVisibleCount] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Type out each item one by one
  useEffect(() => {
    if (visibleCount >= items.length) return;

    const item = items[visibleCount];
    const fullText = item.text;

    if (reducedMotion) {
      setCurrentText(fullText);
      setIsTyping(false);
      return;
    }

    setIsTyping(true);
    setCurrentText('');

    let charIndex = 0;
    const intervalId = setInterval(() => {
      charIndex++;
      setCurrentText(fullText.slice(0, charIndex));
      if (charIndex >= fullText.length) {
        clearInterval(intervalId);
        setIsTyping(false);
      }
    }, TIMING.revealTypewriterDelay);

    return () => clearInterval(intervalId);
  }, [visibleCount, items, reducedMotion]);

  const handleAdvance = useCallback(() => {
    // Can't advance while text is still typing
    if (isTyping) return;

    if (visibleCount < items.length - 1) {
      setVisibleCount((prev) => prev + 1);
    } else {
      onComplete();
    }
  }, [isTyping, visibleCount, items, onComplete]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (isTyping) return;
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleAdvance();
      }
    },
    [isTyping, handleAdvance]
  );

  const isLastItem = visibleCount >= items.length - 1 && !isTyping;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        ref={containerRef}
        className="mx-4 flex max-h-[80vh] w-full max-w-2xl flex-col gap-6 overflow-y-auto rounded-2xl bg-charcoal-light border border-warm-gray-700 p-8 shadow-2xl"
        tabIndex={0}
        onKeyDown={handleKeyDown}
      >
        <h2 className="text-2xl font-bold text-warm-gray-100">{title}</h2>

        <div className="flex flex-col gap-4">
          {/* Previously revealed items */}
          {items.slice(0, visibleCount).map((item, index) => (
            <p
              key={index}
              className={`text-lg leading-relaxed ${
                item.highlight
                  ? 'font-semibold text-amber'
                  : 'text-warm-gray-200'
              }`}
            >
              {item.text}
            </p>
          ))}

          {/* Currently typing item */}
          {visibleCount < items.length && (
            <p
              className={`text-lg leading-relaxed ${
                items[visibleCount].highlight
                  ? 'font-semibold text-amber'
                  : 'text-warm-gray-200'
              }`}
            >
              {currentText}
              {isTyping && (
                <span className="animate-pulse text-warm-gray-500">|</span>
              )}
            </p>
          )}
        </div>

        <button
          onClick={handleAdvance}
          disabled={isTyping}
          className={`mt-4 self-end rounded-lg px-6 py-3 font-semibold text-white transition-colors focus:outline-none focus:ring-2 focus:ring-steel-blue focus:ring-offset-2 focus:ring-offset-charcoal ${
            isTyping
              ? 'cursor-not-allowed bg-warm-gray-700 text-warm-gray-500'
              : 'bg-steel-blue hover:bg-steel-blue-light'
          }`}
        >
          {isLastItem ? 'Continue' : 'Next'}
        </button>
      </div>
    </div>
  );
}
