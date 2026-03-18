import { useState, useCallback } from 'react';

interface NameEntryProps {
  onStart: (name: string) => void;
}

const NAME_PATTERN = /^[a-zA-Z0-9 '\-]+$/;

export function NameEntry({ onStart }: NameEntryProps) {
  const [name, setName] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = useCallback(
    (event: React.FormEvent) => {
      event.preventDefault();
      const trimmedName = name.trim();

      if (trimmedName.length < 1) {
        setError('Please enter your name.');
        return;
      }
      if (trimmedName.length > 50) {
        setError('Name must be 50 characters or less.');
        return;
      }
      if (!NAME_PATTERN.test(trimmedName)) {
        setError('Name can only contain letters, numbers, spaces, hyphens, and apostrophes.');
        return;
      }

      setError('');
      onStart(trimmedName);
    },
    [name, onStart]
  );

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-charcoal p-4">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <h1 className="mb-2 text-5xl font-bold text-warm-gray-100">
            Loss Valley
          </h1>
          <p className="text-lg text-warm-gray-400">
            An expedition into machine learning
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <label htmlFor="player-name" className="sr-only">
            Your name
          </label>
          <input
            id="player-name"
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Enter your name"
            autoFocus
            autoComplete="off"
            className="rounded-lg border border-warm-gray-600 bg-charcoal-light px-4 py-3 text-lg text-warm-gray-100 placeholder:text-warm-gray-500 focus:border-steel-blue focus:outline-none focus:ring-2 focus:ring-steel-blue"
            aria-describedby={error ? 'name-error' : undefined}
          />
          {error && (
            <p id="name-error" className="text-sm text-crimson" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="rounded-lg bg-steel-blue px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-steel-blue-light focus:outline-none focus:ring-2 focus:ring-steel-blue focus:ring-offset-2 focus:ring-offset-charcoal"
          >
            Start Expedition
          </button>
        </form>
      </div>
    </div>
  );
}
