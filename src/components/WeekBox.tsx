'use client';

import React from 'react';
import { WeekData } from '@/types';
import { getIconComponent } from './IconPicker';
import { formatWeekInfo } from '@/utils/dateCalculations';

interface WeekBoxProps {
  weekData: WeekData;
  birthDate: Date;
  className?: string;
}

export default function WeekBox({ weekData, birthDate, className = '' }: WeekBoxProps) {
  const { isPast, isCurrent, event } = weekData;
  
  // Default: a future, unlived week
  let backgroundColor = '#e8e1d0';
  let borderColor = '#d8cfba';

  if (isPast) {
    backgroundColor = '#2a241d'; // Ink — weeks already lived
    borderColor = '#2a241d';
  }

  if (isCurrent) {
    backgroundColor = '#b4471f'; // Accent — the week you're in now
    borderColor = '#8f3315';
  }
  
  // Event colors override defaults
  if (event) {
    backgroundColor = event.color;
    borderColor = event.color;
  }
  
  const IconComponent = event ? getIconComponent(event.icon) : null;
  const tooltipText = formatWeekInfo(weekData, birthDate) + 
    (event ? `\n${event.title}` + 
      (event.startDate.toDateString() === event.endDate.toDateString() ? 
        ` (${event.startDate.toLocaleDateString()})` :
        ` (${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()})`
      ) : '');

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
        cursor: 'pointer',
        WebkitPrintColorAdjust: 'exact',
        printColorAdjust: 'exact',
        colorAdjust: 'exact'
      } as React.CSSProperties}
      title={tooltipText}
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
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1.5 bg-[var(--ink)] text-[var(--paper)] text-xs rounded-md shadow-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none z-10">
        <div className="text-center">
          <div className="font-medium">
            Week {weekData.weekNumber}
          </div>
          <div className="text-[var(--paper)]/60">
            Age {Math.ceil(weekData.weekNumber / 52)}
          </div>
          {event && (
            <div className="text-[var(--accent)] font-medium mt-1" style={{ color: '#e8a87f' }}>
              {event.title}
            </div>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-[var(--ink)]" />
      </div>
    </div>
  );
}
