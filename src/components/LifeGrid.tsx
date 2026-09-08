'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { generateWeekData } from '@/utils/dateCalculations';
import WeekBox from './WeekBox';
import WeekTooltip, { TooltipTarget } from './WeekTooltip';
import { nextWeekForKey, WEEKS_PER_ROW } from '@/utils/gridNavigation';
import PrintControls from './PrintControls';
import ExportControls from './ExportControls';
import DataControls from './DataControls';
import ThemeControls from './ThemeControls';
import Logo from './Logo';
import { FaArrowLeft, FaEdit, FaRedo } from 'react-icons/fa';
import { useRouter } from 'next/navigation';

export default function LifeGrid() {
  const { state, clearData } = useLifeData();
  const router = useRouter();
  const userData = state.userData;

  // Up to ~4,700 cells — only regenerate when the underlying data changes
  const weekData = useMemo(
    () =>
      userData
        ? generateWeekData(userData.birthDate, userData.endAge, userData.events)
        : [],
    [userData]
  );

  const weekLookup = useMemo(
    () => new Map(weekData.map(week => [week.weekNumber, week])),
    [weekData]
  );

  const weekRows = useMemo(() => {
    const rows = [];
    for (let i = 0; i < weekData.length; i += WEEKS_PER_ROW) {
      rows.push(weekData.slice(i, i + WEEKS_PER_ROW));
    }
    return rows;
  }, [weekData]);

  const gridRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipTarget | null>(null);

  // One delegated listener for the whole grid rather than handlers on 4,680
  // boxes: the squares carry their week number in `data-week`, and the shared
  // tooltip is positioned from the hovered square's box.
  const handlePointerOver = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const square = (e.target as HTMLElement).closest<HTMLElement>('[data-week]');
    const container = gridRef.current;
    if (!square || !container) {
      setTooltip(null);
      return;
    }
    const weekNumber = Number(square.dataset.week);
    const week = weekLookup.get(weekNumber);
    if (!week) return;

    const box = square.getBoundingClientRect();
    const origin = container.getBoundingClientRect();
    setTooltip({
      week,
      x: box.left - origin.left + box.width / 2,
      y: box.top - origin.top,
    });
  }, [weekLookup]);

  const clearTooltip = useCallback(() => setTooltip(null), []);

  /* ---- keyboard navigation ---------------------------------------------
     The grid is one tab stop. Focus stays on the container and
     aria-activedescendant points at the active cell, so there is no
     per-cell tabindex to shuffle and no focus() call on 4,680 elements. */

  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [activeRect, setActiveRect] = useState<{ x: number; y: number; size: number } | null>(null);

  /** Entry point: the current week if it is on the calendar, else week 1. */
  const defaultWeek = useMemo(
    () => weekData.find(week => week.isCurrent)?.weekNumber ?? 1,
    [weekData]
  );

  const handleGridFocus = useCallback(() => {
    setActiveWeek(week => week ?? defaultWeek);
  }, [defaultWeek]);

  const handleGridBlur = useCallback(() => {
    setActiveWeek(null);
    setTooltip(null);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      const current = activeWeek ?? defaultWeek;
      const next = nextWeekForKey({
        key: e.key,
        current,
        total: weekData.length,
        ctrlKey: e.ctrlKey,
        metaKey: e.metaKey,
      });
      if (next === null) return;
      // Otherwise the arrows scroll the page out from under the grid.
      e.preventDefault();
      setActiveWeek(next);
    },
    [activeWeek, defaultWeek, weekData.length]
  );

  // Position the ring and tooltip from the active cell, and keep it on screen.
  useEffect(() => {
    const container = gridRef.current;
    if (!activeWeek || !container) {
      setActiveRect(null);
      return;
    }
    const cell = container.querySelector<HTMLElement>(`[data-week="${activeWeek}"]`);
    const week = weekLookup.get(activeWeek);
    if (!cell || !week) return;

    const box = cell.getBoundingClientRect();
    const origin = container.getBoundingClientRect();
    setActiveRect({ x: box.left - origin.left, y: box.top - origin.top, size: box.width });
    setTooltip({ week, x: box.left - origin.left + box.width / 2, y: box.top - origin.top });
    cell.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeWeek, weekLookup]);

  if (!userData) {
    return null;
  }

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
              <Logo className="h-5 w-5" />
              <div className="h-5 w-px bg-[var(--line)]" />
              <button
                onClick={goBackToEvents}
                className="flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--ink)] transition-colors"
              >
                <FaArrowLeft className="w-3.5 h-3.5" />
                Milestones
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
              {userData.events.length} milestone{userData.events.length === 1 ? '' : 's'} · {weekData.length.toLocaleString()} weeks
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Calendar */}
          <div className="lg:col-span-3 min-w-0">
            <div className="life-calendar-container card rise-in bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-[var(--shadow-card)] p-4 sm:p-6 md:p-10">
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
                  <span className="w-3 h-3 rounded-[2px]" style={{ background: 'var(--week-future)', border: '1px solid var(--week-future-border)' }} />
                  <span className="text-[var(--muted)]">Future</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[2px]" style={{ background: 'var(--week-past)' }} />
                  <span className="text-[var(--muted)]">Lived</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-[2px]" style={{ background: 'var(--week-current)' }} />
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
                ref={gridRef}
                className="life-grid relative overflow-x-auto"
                onPointerOver={handlePointerOver}
                onPointerLeave={clearTooltip}
              >
                <WeekTooltip target={tooltip} />

                {/* Focus ring as an overlay rather than a class on the active
                    cell: arrow keys then change no props on any of the 4,680
                    squares, so none of them re-render. */}
                {activeRect && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute z-10 rounded-[3px] print-hide"
                    style={{
                      left: activeRect.x - 2,
                      top: activeRect.y - 2,
                      width: activeRect.size + 4,
                      height: activeRect.size + 4,
                      outline: '2px solid var(--accent)',
                      boxShadow: '0 0 0 1px var(--paper)',
                    }}
                  />
                )}

                {/* Summary first: faster to grasp than arrowing through
                    4,680 cells, and complements rather than replaces them. */}
                <p className="sr-only">
                  Life calendar for {userData.name}, born{' '}
                  {userData.birthDate.toLocaleDateString()}. {weekData.length.toLocaleString()}{' '}
                  weeks in total, one square per week from birth to age {userData.endAge}.{' '}
                  {weeksLived.toLocaleString()} weeks lived, {pctLived}% of the calendar.{' '}
                  {userData.events.length === 0
                    ? 'No milestones recorded.'
                    : `${userData.events.length} milestones: ${userData.events
                        .map(
                          event =>
                            `${event.title}, ${event.startDate.toLocaleDateString()} to ${event.endDate.toLocaleDateString()}`
                        )
                        .join('; ')}.`}{' '}
                  The grid below is navigable with the arrow keys.
                </p>

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

                  {/* Weeks grid. Rows are real elements rather than an
                      implicit 52-column flow, because role="grid" needs
                      role="row" children to be a navigable composite. Visually
                      identical: a column of rows, each a 52-column grid. */}
                  <div
                    role="grid"
                    aria-label={`${userData.name}'s life in weeks. Use the arrow keys to move between weeks.`}
                    aria-activedescendant={activeWeek ? `week-${activeWeek}` : undefined}
                    tabIndex={0}
                    onKeyDown={handleKeyDown}
                    onFocus={handleGridFocus}
                    onBlur={handleGridBlur}
                    className="outline-none"
                    style={{ rowGap: 'var(--week-gap)', display: 'grid' }}
                  >
                    {weekRows.map((row, rowIndex) => (
                      <div
                        key={rowIndex}
                        role="row"
                        className="grid"
                        style={{
                          gridTemplateColumns: 'repeat(52, var(--week-size))',
                          gridAutoRows: 'var(--week-size)',
                          columnGap: 'var(--week-gap)',
                        }}
                      >
                        {row.map(week => (
                          <WeekBox key={week.weekNumber} weekData={week} />
                        ))}
                      </div>
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
                {/* Life progress — screen only, the printed poster stays clean */}
                <div className="print-hide mb-6">
                  <div
                    className="h-1.5 rounded-full overflow-hidden"
                    style={{ background: 'var(--week-future)' }}
                    role="progressbar"
                    aria-valuenow={pctLived}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Share of life lived"
                  >
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pctLived}%`, background: 'var(--week-past)' }}
                    />
                  </div>
                </div>
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
              <ThemeControls />
              <PrintControls />
              <ExportControls userData={userData} weekData={weekData} />
              <DataControls />

              {userData.events.length > 0 && (
                <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)]">
                      Recent milestones
                    </h3>
                    <button
                      onClick={goBackToEvents}
                      className="text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
                      title="Edit milestones"
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
