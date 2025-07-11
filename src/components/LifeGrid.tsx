'use client';

import React from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { generateWeekData } from '@/utils/dateCalculations';
import WeekBox from './WeekBox';
import PrintControls from './PrintControls';
import { FaArrowLeft, FaEdit, FaCog } from 'react-icons/fa';

export default function LifeGrid() {
  const { state, setPhase, clearData } = useLifeData();

  if (!state.userData) {
    return null;
  }

  const weekData = generateWeekData(
    state.userData.birthDate,
    state.userData.endAge,
    state.userData.events
  );

  const goBackToEvents = () => {
    setPhase('events');
  };

  const startOver = () => {
    if (window.confirm('Are you sure you want to start over? This will clear all your data.')) {
      clearData();
    }
  };

  // Group weeks by year for better organization
  const weeksByYear: { [year: number]: typeof weekData } = {};
  weekData.forEach(week => {
    if (!weeksByYear[week.year]) {
      weeksByYear[week.year] = [];
    }
    weeksByYear[week.year].push(week);
  });

  const years = Object.keys(weeksByYear).map(Number).sort((a, b) => a - b);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b print-hide">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goBackToEvents}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <FaArrowLeft className="w-4 h-4" />
                Back to Events
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <button
                onClick={startOver}
                className="flex items-center gap-2 text-gray-600 hover:text-red-600 transition-colors"
              >
                <FaCog className="w-4 h-4" />
                Start Over
              </button>
            </div>
            <div className="text-sm text-gray-600">
              {state.userData.events.length} events • {weekData.length} weeks
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="life-calendar-container bg-white rounded-2xl shadow-lg p-8">
              {/* Title */}
              <div className="text-center mb-8">
                <h1 className="title text-4xl font-bold text-gray-900 mb-2">
                  {state.userData.name}&apos;s Life in Weeks
                </h1>
                <p className="text-gray-600">
                  Born {state.userData.birthDate.toLocaleDateString()} • 
                  Each box represents one week of life
                </p>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-300 border border-gray-400 rounded-sm" />
                  <span className="text-gray-700">Future weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gray-400 border border-gray-500 rounded-sm" />
                  <span className="text-gray-700">Past weeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-400 border border-yellow-500 rounded-sm" />
                  <span className="text-gray-700">Current week</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 border border-blue-600 rounded-sm" />
                  <span className="text-gray-700">Life events</span>
                </div>
              </div>

              {/* Life Grid */}
              <div className="life-grid">
                {/* Week number labels at top */}
                <div className="flex mb-2">
                  <div className="w-12 flex-shrink-0"></div> {/* Space for age labels */}
                  <div className="flex justify-between flex-1 text-xs text-gray-500">
                    {/* {[...Array(Math.ceil(52 / 10))].map((_, i) => (
                      <span key={i} className="w-0 text-center">
                        {(i + 1) * 10}
                      </span>
                    ))} */}
                  </div>
                </div>

                {/* Grid with age labels */}
                <div className="flex">
                  {/* Age labels column */}
                  <div className="w-12 flex-shrink-0 pr-2">
                    {years.map(year => (
                      <div
                        key={year}
                        className="text-xs text-gray-500 text-right flex items-center justify-end"
                        style={{ height: `${12+(year/3)}px` }} // 8px + 1px gap
                      >
                        {(year) % 5 === 0 ? `Age ${year}` : ''}
                      </div>
                    ))}
                  </div>

                  {/* Weeks grid */}
                  <div 
                    className="grid gap-1 flex-1"
                    style={{
                      gridTemplateColumns: 'repeat(52, minmax(10px, 1fr))',
                      gridTemplateRows: `repeat(${state.userData.endAge}, minmax(10px, 1fr))`
                    }}
                  >
                    {weekData.map(week => (
                      <WeekBox
                        key={week.weekNumber}
                        weekData={week}
                        birthDate={state.userData!.birthDate}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote */}
              {state.userData.quote && (
                <div className="quote text-center mt-8 pt-8 border-t border-gray-200">
                  <blockquote className="text-lg italic text-gray-700">
                    &ldquo;{state.userData.quote}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* Statistics */}
              <div className="mt-8 pt-8 border-t border-gray-200 print-hide">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {weekData.filter(w => w.isPast).length}
                    </div>
                    <div className="text-sm text-gray-600">Weeks lived</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      {weekData.filter(w => !w.isPast && !w.isCurrent).length}
                    </div>
                    <div className="text-sm text-gray-600">Weeks remaining</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.round((weekData.filter(w => w.isPast).length / weekData.length) * 100)}%
                    </div>
                    <div className="text-sm text-gray-600">Life completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {state.userData.events.length}
                    </div>
                    <div className="text-sm text-gray-600">Life events</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 print-hide">
            <div className="space-y-6">
              {/* Print Controls */}
              <PrintControls />

              {/* Recent Events */}
              {state.userData.events.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
                    <button
                      onClick={goBackToEvents}
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <FaEdit className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                {state.userData.events
                  .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                  .slice(0, 5)
                  .map(event => {
                    const isSameDate = event.startDate.toDateString() === event.endDate.toDateString();
                    return (
                      <div key={event.id} className="flex items-center gap-3">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: event.color }}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {event.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {isSameDate 
                              ? event.startDate.toLocaleDateString()
                              : `${event.startDate.toLocaleDateString()} - ${event.endDate.toLocaleDateString()}`
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
