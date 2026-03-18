import type { ReactNode } from 'react';
import { StarDisplay } from '@/components/ui/StarDisplay';
import { ScoreDisplay } from '@/components/ui/ScoreDisplay';

interface LevelLayoutProps {
  levelName: string;
  score?: number;
  scoreLabel?: string;
  stars: number;
  mainContent: ReactNode;
  controlsContent: ReactNode;
  headerExtra?: ReactNode;
}

export function LevelLayout({
  levelName,
  score,
  scoreLabel = 'Total Error',
  stars,
  mainContent,
  controlsContent,
  headerExtra,
}: LevelLayoutProps) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-charcoal">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-warm-gray-700 px-6 py-3">
        <h1 className="text-lg font-semibold text-warm-gray-100">
          {levelName}
        </h1>
        <div className="flex items-center gap-6">
          {headerExtra}
          {score !== undefined && (
            <ScoreDisplay label={scoreLabel} value={score} size="sm" />
          )}
          <StarDisplay earned={stars} />
        </div>
      </header>

      {/* Main area: 70% viz / 30% controls */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex flex-[7] items-center justify-center p-4">
          {mainContent}
        </main>
        <aside className="flex flex-[3] flex-col gap-4 overflow-y-auto border-l border-warm-gray-700 p-4">
          {controlsContent}
        </aside>
      </div>
    </div>
  );
}
