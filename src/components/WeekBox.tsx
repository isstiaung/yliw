'use client';

import React from 'react';
import { WeekData } from '@/types';
import { getIconComponent } from '@/utils/icons';
import { getAgeFromWeek } from '@/utils/dateCalculations';

interface WeekBoxProps {
  weekData: WeekData;
  className?: string;
}

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

  const age = getAgeFromWeek(weekData.weekNumber);
  const IconComponent = event ? getIconComponent(event.icon) : null;
  const label = `Week ${weekData.weekNumber}, age ${age}${event ? ` — ${event.title}` : ''}`;

  return (
    <div
      className={`week-box relative group ${className}`}
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
      role="img"
      aria-label={label}
    >
      {/* Icon for events — scales with the box so it never overflows */}
      {IconComponent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComponent
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

      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[var(--ink)] text-[var(--paper)] text-xs rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
        <div className="text-center">
          <div className="font-medium">
            Week {weekData.weekNumber}
          </div>
          <div className="text-[var(--paper)]/60">
            Age {age}
          </div>
          {event && (
            <div className="font-medium mt-1" style={{ color: 'var(--tooltip-event)' }}>
              {event.title}
            </div>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[var(--ink)]" />
      </div>
    </div>
  );
}

export default React.memo(WeekBox);
