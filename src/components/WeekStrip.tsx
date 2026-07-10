'use client';

const STRIP_WEEKS = 52;

interface WeekStripProps {
  /** How much of the strip is filled, 0–1. */
  fraction: number;
  className?: string;
}

/**
 * A whole life compressed to one row of 52 squares, filled to the given
 * fraction, with the "you are here" square in accent — the poster grid
 * in miniature.
 */
export default function WeekStrip({ fraction, className = '' }: WeekStripProps) {
  const clamped = Math.min(Math.max(fraction, 0), 1);
  const filled = Math.floor(clamped * STRIP_WEEKS);

  return (
    <div
      className={`grid gap-[3px] ${className}`}
      style={{ gridTemplateColumns: `repeat(${STRIP_WEEKS}, 1fr)` }}
      aria-hidden="true"
    >
      {Array.from({ length: STRIP_WEEKS }, (_, i) => {
        const isLived = i < filled;
        const isCurrent = clamped > 0 && clamped < 1 && i === filled;
        return (
          <div
            key={i}
            className="aspect-square rounded-[1px]"
            style={{
              background: isCurrent
                ? 'var(--week-current)'
                : isLived
                  ? 'var(--week-past)'
                  : 'var(--week-future)',
              border: isLived || isCurrent ? 'none' : '1px solid var(--week-future-border)',
            }}
          />
        );
      })}
    </div>
  );
}
