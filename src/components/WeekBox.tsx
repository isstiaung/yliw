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
  
  // Default colors
  let backgroundColor = '#f3f4f6'; // Default light gray
  let borderColor = '#e5e7eb';
  
  if (isPast) {
    backgroundColor = '#d1d5db'; // Darker gray for past weeks
  }
  
  if (isCurrent) {
    backgroundColor = '#fbbf24'; // Yellow for current week
    borderColor = '#f59e0b';
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
        backgroundColor,
        borderColor,
        width: '10px',
        height: '10px',
        minWidth: '10px',
        minHeight: '10px',
        border: '1px solid',
        cursor: 'pointer'
      }}
      title={tooltipText}
    >
      {/* Icon for events */}
      {IconComponent && (
        <div className="absolute inset-0 flex items-center justify-center">
          <IconComponent 
            className="w-4 h-4 text-white opacity-80"
            // style={{ fontSize: '8px' }}
          />
        </div>
      )}
      
      {/* Current week indicator */}
      {isCurrent && !event && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-1 h-1 bg-white rounded-full opacity-90" />
        </div>
      )}
      
      {/* Hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
        <div className="text-center">
          <div className="font-medium">
            Week {weekData.weekNumber}
          </div>
          <div className="text-gray-300">
            Age {Math.ceil(weekData.weekNumber / 52)}
          </div>
          {event && (
            <div className="text-yellow-300 mt-1">
              {event.title}
            </div>
          )}
        </div>
        {/* Tooltip arrow */}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
