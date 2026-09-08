'use client';

import React from 'react';
import { WeekData } from '@/types';
import MilestoneIcon from './MilestoneIcon';

interface WeekBoxProps {
  weekData: WeekData;
  className?: string;
}

/**
 * One square. Deliberately as light as it can be: a 90-year calendar renders
 * 4,680 of these, so anything per-box is paid 4,680 times.
 *
 * There is no tooltip here. Each box used to render its own hidden hover card,
 * which accounted for roughly 24,000 of the page's 30,000 DOM nodes to show
 * one card at a time. The grid now delegates hover from a single listener and
 * renders one shared tooltip; these boxes just publish the data it needs
 * through `data-week`.
 *
 * The squares are aria-hidden because 4,680 individually labelled elements is
 * noise, not accessibility. The grid exposes a text summary instead.
 */
function WeekBox({ weekData, className = '' }: WeekBoxProps) {
  const { isPast, isCurrent, event } = weekData;

  // Default: a future, unlived week
  let backgroundColor = 'var(--week-future)';
  let borderColor = 'var(--week-future-border)';

  if (isPast) {
    backgroundColor = 'var(--week-past)';
    borderColor = 'var(--week-past-border)';
  }

  if (isCurrent) {
    backgroundColor = 'var(--week-current)';
    borderColor = 'var(--week-current-border)';
  }

  // Event colors override defaults
  if (event) {
    backgroundColor = event.color;
    borderColor = event.color;
  }

  return (
    <div
      className={`week-box relative ${className}`}
      data-week={weekData.weekNumber}
      aria-hidden="true"
      style={{
        '--bg-color': backgroundColor,
        '--border-color': borderColor,
        backgroundColor: backgroundColor,
        borderColor: borderColor,
        width: 'var(--week-size, 10px)',
        height: 'var(--week-size, 10px)',
        border: '1px solid',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
      } as React.CSSProperties}
    >
      {/* Icon for events — scales with the box so it never overflows */}
      {event && (
        <div className="absolute inset-0 flex items-center justify-center">
          <MilestoneIcon
            name={event.icon}
            className="text-white opacity-85"
            style={{
              width: 'calc(var(--week-size, 10px) * 0.72)',
              height: 'calc(var(--week-size, 10px) * 0.72)',
            }}
          />
        </div>
      )}

      {/* Current week indicator */}
      {isCurrent && !event && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="bg-white rounded-full opacity-90"
            style={{
              width: 'calc(var(--week-size, 10px) * 0.3)',
              height: 'calc(var(--week-size, 10px) * 0.3)',
            }}
          />
        </div>
      )}
    </div>
  );
}

export default React.memo(WeekBox);
