import { useState, useCallback, useRef, useEffect } from 'react';
import type { FieldReport as FieldReportType, PlayerProgress } from '@/types';
import { saveFieldReport, loadFieldReport } from '@/lib/storage';
import { LEVEL_ORDER, LEVEL_NAMES } from '@/lib/constants';
import { StarDisplay } from '@/components/ui/StarDisplay';

interface FieldReportProps {
  progress: PlayerProgress;
  onComplete: (report: FieldReportType) => void;
}

const MIN_CHARS = 20;
const AUTO_SAVE_DELAY = 500;

const VOCAB_WORDS = [
  { term: 'Weight (slope)', definition: 'How steep the line is — controls the tilt' },
  { term: 'Bias (intercept)', definition: 'Where the line crosses the y-axis — shifts the line up or down' },
  { term: 'Loss function', definition: 'The formula that measures how wrong your model is' },
  { term: 'MAE', definition: 'Mean Absolute Error — average of |error|, treats all errors equally' },
  { term: 'MSE', definition: 'Mean Squared Error — average of error squared, big errors count way more' },
  { term: 'Learning rate', definition: 'How much the slope and intercept change on each step' },
  { term: 'Gradient descent', definition: 'Automatically adjusting the line step-by-step to reduce error' },
  { term: 'Overshoot', definition: 'When the learning rate is too big and the model jumps past the best fit' },
  { term: 'Batch', definition: 'A random subset of data points used for one gradient step' },
  { term: 'Epoch', definition: 'One full pass through every data point in the dataset' },
  { term: 'Stochastic', definition: 'Randomly determined — each batch is a random sample' },
  { term: 'SGD', definition: 'Stochastic Gradient Descent — the core training algorithm' },
  { term: 'Hyperparameter', definition: 'A setting you choose before training (learning rate, batch size, etc.)' },
];

const QUESTIONS = [
  'In your own words, describe how a computer learns to fit a line to data. Walk through the steps as if explaining to a friend who has never seen this before.',
  'What is a learning rate, and what happens if it is too small or too big?',
  'What is the difference between MAE and MSE? When might you prefer one over the other?',
];

export function FieldReport({ progress, onComplete }: FieldReportProps) {
  const [responses, setResponses] = useState<[string, string, string]>(() => {
    const saved = loadFieldReport();
    return saved
      ? [saved.question1, saved.question2, saved.question3]
      : ['', '', ''];
  });

  const [feedback, setFeedback] = useState<string>(() => {
    const saved = loadFieldReport();
    return saved?.feedback ?? '';
  });

  const [showVocab, setShowVocab] = useState(false);
  const debounceRef = useRef<number>(0);

  // Auto-save on keystroke (debounced)
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      saveFieldReport({
        question1: responses[0],
        question2: responses[1],
        question3: responses[2],
        feedback,
      });
    }, AUTO_SAVE_DELAY);

    return () => clearTimeout(debounceRef.current);
  }, [responses, feedback]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      setResponses((prev) => {
        const next = [...prev] as [string, string, string];
        next[index] = value;
        return next;
      });
    },
    []
  );

  const allValid = responses.every((r) => r.trim().length >= MIN_CHARS);

  const totalStars = LEVEL_ORDER.reduce(
    (sum, levelId) => sum + progress.levels[levelId].stars,
    0
  );

  const handleDownload = useCallback(() => {
    const levelSummary = LEVEL_ORDER.map((levelId) => {
      const level = progress.levels[levelId];
      const starText = '\u2605'.repeat(level.stars) + '\u2606'.repeat(3 - level.stars);
      return `  ${LEVEL_NAMES[levelId]}: ${starText} (${level.stars}/3 stars)`;
    }).join('\n');

    const reportText = [
      'LOSS VALLEY — FIELD REPORT',
      `Student: ${progress.playerName}`,
      `Date: ${new Date().toLocaleDateString()}`,
      `Total Stars: ${totalStars} / ${LEVEL_ORDER.length * 3}`,
      '',
      'LEVEL RESULTS',
      levelSummary,
      '',
      '---',
      '',
      `Q1: ${QUESTIONS[0]}`,
      responses[0],
      '',
      `Q2: ${QUESTIONS[1]}`,
      responses[1],
      '',
      `Q3: ${QUESTIONS[2]}`,
      responses[2],
      '',
      '---',
      '',
      'FEEDBACK ON LOSS VALLEY',
      feedback || '(No feedback provided)',
    ].join('\n');

    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `loss-valley-report-${progress.playerName.replace(/\s+/g, '-')}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [progress, totalStars, responses, feedback]);

  const handleSubmit = useCallback(() => {
    if (!allValid) return;

    const report: FieldReportType = {
      question1: responses[0],
      question2: responses[1],
      question3: responses[2],
      feedback,
    };
    onComplete(report);
  }, [allValid, responses, feedback, onComplete]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-charcoal p-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-2 text-3xl font-bold text-warm-gray-100">
          Field Report
        </h1>
        <p className="mb-6 text-warm-gray-400">
          Reflect on your expedition through Loss Valley. Use the vocabulary
          words to help you. Minimum {MIN_CHARS} characters per response.
        </p>

        {/* Star summary */}
        <div className="mb-6 rounded-lg border border-warm-gray-700 bg-charcoal-light p-4">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-warm-gray-500">
            Your Results
          </h2>
          <div className="flex flex-col gap-1">
            {LEVEL_ORDER.map((levelId) => (
              <div
                key={levelId}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-warm-gray-300">
                  {LEVEL_NAMES[levelId]}
                </span>
                <StarDisplay earned={progress.levels[levelId].stars} />
              </div>
            ))}
          </div>
          <div className="mt-3 border-t border-warm-gray-700 pt-2 text-right">
            <span className="text-sm text-warm-gray-400">Total: </span>
            <span className="font-mono text-lg font-bold text-amber">
              {totalStars}
            </span>
            <span className="text-sm text-warm-gray-500">
              {' '}/ {LEVEL_ORDER.length * 3}
            </span>
          </div>
        </div>

        {/* Vocabulary bank */}
        <div className="mb-6">
          <button
            onClick={() => setShowVocab(!showVocab)}
            className="flex w-full items-center justify-between rounded-lg border border-warm-gray-700 bg-charcoal-light px-4 py-3 text-left transition-colors hover:border-steel-blue"
          >
            <span className="text-sm font-semibold text-warm-gray-200">
              Vocabulary Word Bank
            </span>
            <span className="text-warm-gray-400">
              {showVocab ? '\u25B2' : '\u25BC'}
            </span>
          </button>

          {showVocab && (
            <div className="mt-2 rounded-lg border border-warm-gray-700 bg-charcoal-light p-4">
              <p className="mb-3 text-xs text-warm-gray-500">
                Use these terms in your responses to show your understanding.
              </p>
              <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {VOCAB_WORDS.map((word) => (
                  <div
                    key={word.term}
                    className="rounded-md bg-charcoal p-2"
                  >
                    <dt className="text-xs font-semibold text-amber">
                      {word.term}
                    </dt>
                    <dd className="text-xs text-warm-gray-400">
                      {word.definition}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>

        {/* Reflection questions */}
        <div className="flex flex-col gap-6">
          {QUESTIONS.map((question, index) => {
            const charCount = responses[index].trim().length;
            const isValid = charCount >= MIN_CHARS;

            return (
              <div key={index} className="flex flex-col gap-2">
                <label
                  htmlFor={`q${index}`}
                  className="text-sm font-medium text-warm-gray-200"
                >
                  Q{index + 1}: {question}
                </label>
                <textarea
                  id={`q${index}`}
                  value={responses[index]}
                  onChange={(e) => handleChange(index, e.target.value)}
                  rows={4}
                  className="rounded-lg border border-warm-gray-600 bg-charcoal-light px-4 py-3 text-sm text-warm-gray-100 placeholder:text-warm-gray-500 focus:border-steel-blue focus:outline-none focus:ring-2 focus:ring-steel-blue"
                  placeholder="Type your response..."
                />
                <span
                  className={`text-xs ${
                    isValid ? 'text-emerald' : 'text-warm-gray-500'
                  }`}
                >
                  {charCount} / {MIN_CHARS} min characters
                  {isValid && ' \u2713'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Feedback on Loss Valley */}
        <div className="mt-8 flex flex-col gap-2">
          <label
            htmlFor="feedback"
            className="text-sm font-medium text-warm-gray-200"
          >
            Feedback on Loss Valley (optional)
          </label>
          <p className="text-xs text-warm-gray-500">
            What did you like? What was confusing? How could this game be improved?
          </p>
          <textarea
            id="feedback"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            rows={3}
            className="rounded-lg border border-warm-gray-600 bg-charcoal-light px-4 py-3 text-sm text-warm-gray-100 placeholder:text-warm-gray-500 focus:border-steel-blue focus:outline-none focus:ring-2 focus:ring-steel-blue"
            placeholder="Your feedback helps improve this game for future students..."
          />
        </div>

        {/* Action buttons */}
        <div className="mt-8 flex gap-3">
          <button
            onClick={handleDownload}
            disabled={!allValid}
            className="rounded-lg bg-warm-gray-700 px-6 py-3 font-semibold text-warm-gray-200 transition-colors hover:bg-warm-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Download Report (.txt)
          </button>
          <button
            onClick={handleSubmit}
            disabled={!allValid}
            className="flex-1 rounded-lg bg-emerald px-6 py-3 font-semibold text-white transition-colors hover:bg-emerald-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            Complete Expedition
          </button>
        </div>

        {!allValid && (
          <p className="mt-3 text-xs text-warm-gray-500">
            Answer all 3 questions (minimum {MIN_CHARS} characters each) to
            download your report and complete the expedition.
          </p>
        )}
      </div>
    </div>
  );
}
