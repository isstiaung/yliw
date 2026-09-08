'use client';

import React from 'react';
import { WeekData } from '@/types';
import { getAgeFromWeek } from '@/utils/dateCalculations';

export interface TooltipTarget {
  week: WeekData;
  /** Position of the hovered square, relative to the grid's positioned parent. */
  x: number;
  y: number;
}

/**
 * The single hover card for the whole grid.
 *
 * One instance is rendered and moved, rather than one per square: at 4,680
 * squares the per-box version was about 80% of the page's DOM nodes to display
 * one card at a time.
 */
export default function WeekTooltip({ target }: { target: TooltipTarget | null }) {
  if (!target) return null;

  const { week, x, y } = target;
  const age = getAgeFromWeek(week.weekNumber);

  return (
    <div
      role="tooltip"
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-full px-2.5 py-1.5 bg-[var(--ink)] text-[var(--paper)] text-xs rounded-md shadow-lg whitespace-nowrap print-hide"
      style={{ left: x, top: y - 8 }}
    >
      <div className="text-center">
        <div className="font-medium">Week {week.weekNumber}</div>
        <div className="text-[var(--paper)]/60">Age {age}</div>
        {week.event && (
          <div className="font-medium mt-1" style={{ color: 'var(--tooltip-event)' }}>
            {week.event.title}
          </div>
        )}
      </div>
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--ink)]" />
    </div>
  );
}
