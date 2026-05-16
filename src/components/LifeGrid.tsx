'use client';

import React from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { generateWeekData } from '@/utils/dateCalculations';
import WeekBox from './WeekBox';
import PrintControls from './PrintControls';
import DataControls from './DataControls';
import { FaArrowLeft, FaEdit, FaRedo } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function LifeGrid() {
  const { state, clearData } = useLifeData();
  const router = useRouter();
  if (!state.userData) {
    return null;
  }

  const { userData } = state;

  const weekData = generateWeekData(
    userData.birthDate,
    userData.endAge,
    userData.events
  );

  const goBackToEvents = () => router.push('/');

  const startOver = () => {
    if (window.confirm('Start over? This permanently clears all your data.')) {
      clearData();
      router.push('/');
    }
  };

  // Group weeks by year so we can render age labels alongside the grid
  const years = Array.from({ length: userData.endAge }, (_, i) => i + 1);

  const weeksLived = weekData.filter(w => w.isPast).length;
  const weeksRemaining = weekData.filter(w => !w.isPast && !w.isCurrent).length;
  const pctLived = Math.round((weeksLived / weekData.length) * 100);

  const stats = [
    { label: 'Weeks lived', value: weeksLived.toLocaleString() },
    { label: 'Weeks remaining', value: weeksRemaining.toLocaleString() },
    { label: 'Life lived', value: `${pctLived}%` },
    { label: 'Milestones', value: userData.events.length.toLocaleString() },
  ];

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-grain">
      {/* Header */}
      <div className="bg-[var(--surface)]/80 backdrop-blur border-b border-[var(--line)] print-hide">
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={goBackToEvents}
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                <FaArrowLeft className="w-3.5 h-3.5" />
                Events
              </button>
              <div className="h-5 w-px bg-[var(--line)]" />
              <button
                onClick={startOver}
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
              >
                <FaRedo className="w-3 h-3" />
                Start over
              </button>
            </div>
            <div className="text-xs font-mono text-[var(--muted)]">
              {userData.events.length} events · {weekData.length} weeks
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3">
            <div className="life-calendar-container bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-[0_1px_2px_rgba(31,27,22,0.04),0_16px_50px_-20px_rgba(31,27,22,0.2)] p-6 sm:p-10">
              {/* Title */}
              <div className="calendar-head text-center mb-8">
                <p className="text-xs font-mono uppercase tracking-[0.22em] text-[var(--accent)] mb-3">
                  Memento mori
                </p>
                <h1 className="title font-display text-3xl sm:text-4xl text-[var(--ink)] mb-2">
                  {userData.name}&apos;s Life in Weeks
                </h1>
                <p className="subtitle text-sm text-[var(--muted)]">
                  Born {userData.birthDate.toLocaleDateString()} · each square is one week
                </p>
              </div>

              {/* Legend */}
              <div className="legend flex flex-wrap justify-center gap-x-6 gap-y-2 mb-8 text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[2px]" style={{ background: '#e8e1d0', border: '1px solid #d8cfba' }} />
                  <span className="text-[var(--muted)]">Future</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[2px]" style={{ background: '#2a241d' }} />
                  <span className="text-[var(--muted)]">Lived</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[2px]" style={{ background: 'var(--accent)' }} />
                  <span className="text-[var(--muted)]">This week</span>
                </div>
                {userData.events.map(event => (
                  <div key={event.id} className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-[2px]" style={{ background: event.color }} />
                    <span className="text-[var(--muted)]">{event.title}</span>
                  </div>
                ))}
              </div>

              {/* Life Grid — --week-size / --week-gap drive both the boxes
                  and the grid tracks, so the print stylesheet can rescale
                  the whole layout by overriding just these two variables. */}
              <div
                className="life-grid overflow-x-auto"
                style={{ '--week-size': '10px', '--week-gap': '4px' } as React.CSSProperties}
              >
                <div className="flex min-w-fit mx-auto w-fit">
                  {/* Age labels column — same row size + gap so labels stay
                      aligned with the week rows at every paper size */}
                  <div
                    className="flex-shrink-0 pr-2 grid"
                    style={{
                      gridAutoRows: 'var(--week-size)',
                      rowGap: 'var(--week-gap)',
                    }}
                  >
                    {years.map(year => (
                      <div
                        key={year}
                        className="font-mono text-[var(--muted)]/70 text-right flex items-center justify-end pr-1"
                        style={{ fontSize: 'calc(var(--week-size) * 0.85)' }}
                      >
                        {year % 5 === 0 ? year : ''}
                      </div>
                    ))}
                  </div>

                  {/* Weeks grid — 52 columns, rows flow automatically */}
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: 'repeat(52, var(--week-size))',
                      gridAutoRows: 'var(--week-size)',
                      gap: 'var(--week-gap)',
                    }}
                  >
                    {weekData.map(week => (
                      <WeekBox
                        key={week.weekNumber}
                        weekData={week}
                        birthDate={userData.birthDate}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Quote */}
              {userData.quote && (
                <div className="quote text-center mt-10 pt-8 border-t border-[var(--line)]">
                  <blockquote className="font-display italic text-lg text-[var(--ink)]">
                    &ldquo;{userData.quote}&rdquo;
                  </blockquote>
                </div>
              )}

              {/* Statistics */}
              <div className="life-stats mt-10 pt-8 border-t border-[var(--line)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  {stats.map(stat => (
                    <div key={stat.label}>
                      <div className="font-display text-3xl text-[var(--ink)]">
                        {stat.value}
                      </div>
                      <div className="text-xs font-mono uppercase tracking-[0.14em] text-[var(--muted)] mt-1 print-show">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 print-hide">
            <div className="space-y-5">
              <PrintControls />
              <DataControls />

              {userData.events.length > 0 && (
                <div className="bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)]">
                      Recent events
                    </h3>
                    <button
                      onClick={goBackToEvents}
                      className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                      title="Edit events"
                    >
                      <FaEdit className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {userData.events
                      .slice()
                      .sort((a, b) => b.startDate.getTime() - a.startDate.getTime())
                      .slice(0, 5)
                      .map(event => {
                        const isSameDate =
                          event.startDate.toDateString() === event.endDate.toDateString();
                        return (
                          <div key={event.id} className="flex items-center gap-3">
                            <span
                              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                              style={{ backgroundColor: event.color }}
                            />
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium text-[var(--ink)] truncate">
                                {event.title}
                              </div>
                              <div className="text-xs text-[var(--muted)]">
                                {isSameDate
                                  ? event.startDate.toLocaleDateString()
                                  : `${event.startDate.toLocaleDateString()} – ${event.endDate.toLocaleDateString()}`}
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
