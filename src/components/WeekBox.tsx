'use client';

import React from 'react';
import { WeekData } from '@/types';
import MilestoneIcon from './MilestoneIcon';
import { describeWeek } from '@/utils/gridNavigation';
import { getAgeFromWeek } from '@/utils/dateCalculations';

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
 * Each square is a real gridcell with an accessible name. That is affordable
 * where the old markup was not: these used to be role="img", so a screen reader
 * met 4,680 standalone images in the reading order. Inside a role="grid" the
 * cells are a composite widget entered deliberately and traversed with the
 * arrow keys, and only the active cell is announced.
 *
 * Nothing here depends on which cell is active. The focus ring is drawn as a
 * single overlay by the grid, so arrow keys change no props on any square and
 * React.memo keeps all 4,680 from re-rendering.
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
      id={`week-${weekData.weekNumber}`}
      data-week={weekData.weekNumber}
      role="gridcell"
      aria-label={describeWeek(
        weekData.weekNumber,
        getAgeFromWeek(weekData.weekNumber),
        isCurrent ? 'current' : isPast ? 'past' : 'future',
        event?.title
      )}
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
