'use client';

import React, { useState } from 'react';
import { differenceInWeeks } from 'date-fns';
import { useLifeData } from '@/contexts/LifeDataContext';
import { UserData } from '@/types';
import { eventsOffCalendar, formatDateForInput, parseLocalDate } from '@/utils/dateCalculations';
import WeekStrip from './WeekStrip';
import Logo from './Logo';

/**
 * The first step for a new calendar, and the way back to change its details
 * later. With a calendar already loaded it edits that one in place and keeps
 * its milestones.
 */
export default function SetupForm() {
  const { state, setUserData, setPhase, updateProfile } = useLifeData();
  const existing = state.userData;
  const [formData, setFormData] = useState(() => ({
    name: existing?.name ?? '',
    birthDate: existing ? formatDateForInput(existing.birthDate) : '',
    endAge: String(existing?.endAge ?? 90),
    quote: existing?.quote ?? '',
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    } else {
      const birthDate = parseLocalDate(formData.birthDate);
      const today = new Date();
      if (birthDate > today) {
        newErrors.birthDate = 'Birth date cannot be in the future';
      }
    }

    const endAge = parseInt(formData.endAge, 10);
    if (Number.isNaN(endAge) || endAge < 20 || endAge > 90) {
      newErrors.endAge = 'End age must be between 20 and 90';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const profile = {
      name: formData.name.trim(),
      birthDate: parseLocalDate(formData.birthDate),
      endAge: parseInt(formData.endAge, 10),
      quote: formData.quote.trim(),
    };

    if (existing) {
      // Milestones were checked against the old dates; a new birth date or a
      // shorter span can push some off the grid. Say so rather than hide them.
      const off = eventsOffCalendar(profile.birthDate, profile.endAge, existing.events).length;
      if (
        off > 0 &&
        !window.confirm(
          `${off} milestone${off === 1 ? '' : 's'} would fall partly or wholly outside the new calendar ` +
            'and be cut off or hidden. Save anyway?'
        )
      ) {
        return;
      }
      updateProfile(profile);
    } else {
      const userData: UserData = { ...profile, events: [] };
      setUserData(userData);
    }
    setPhase('events');
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 bg-[var(--surface)] border rounded-md text-[var(--ink)] placeholder:text-[var(--muted)]/60 outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] ${
      hasError ? 'border-[var(--accent)]' : 'border-[var(--line)]'
    }`;

  // Live preview: as soon as we know the birth date, the strip shows
  // where "now" falls in a whole life — the poster in miniature.
  const previewEndAge = parseInt(formData.endAge, 10);
  const totalWeeks = (Number.isNaN(previewEndAge) ? 90 : previewEndAge) * 52;
  let weeksLived: number | null = null;
  if (formData.birthDate) {
    const birthDate = parseLocalDate(formData.birthDate);
    if (!Number.isNaN(birthDate.getTime()) && birthDate <= new Date()) {
      weeksLived = Math.min(Math.max(differenceInWeeks(new Date(), birthDate), 0), totalWeeks);
    }
  }
  const lifeFraction = weeksLived === null ? 0 : weeksLived / totalWeeks;

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-grain flex items-center justify-center p-4">
      <div className="card rise-in w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-[var(--shadow-card)] p-8 sm:p-10">
        <div className="mb-8">
          <Logo className="h-9 w-9 mb-5" />
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Memento mori
          </p>
          <h1 className="font-display text-4xl text-[var(--ink)] leading-tight mb-2">
            Your Life<br />in Weeks
          </h1>
          <p className="text-[var(--muted)]">
            {existing
              ? 'Change your details. Your milestones stay as they are.'
              : <>One small square for every week you will live. Let&apos;s set up your calendar.</>}
          </p>
          <div className="mt-6">
            <WeekStrip fraction={lifeFraction} />
            <p className="mt-2.5 text-xs font-mono text-[var(--muted)]">
              {weeksLived === null
                ? 'Your whole life in one row — enter your birth date to see where you are.'
                : `You are here: ${weeksLived.toLocaleString()} weeks lived, ${(totalWeeks - weeksLived).toLocaleString()} to go.`}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
              Your name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={inputClass(!!errors.name)}
              placeholder="Enter your full name"
            />
            {errors.name && <p className="mt-1 text-sm text-[var(--accent)]">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="birthDate" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
              Birth date
            </label>
            <input
              type="date"
              id="birthDate"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              className={inputClass(!!errors.birthDate)}
            />
            {errors.birthDate && <p className="mt-1 text-sm text-[var(--accent)]">{errors.birthDate}</p>}
          </div>

          <div>
            <label htmlFor="endAge" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
              Life expectancy <span className="text-[var(--muted)] font-normal">(20–90)</span>
            </label>
            <input
              type="number"
              id="endAge"
              name="endAge"
              min="20"
              max="90"
              value={formData.endAge}
              onChange={handleInputChange}
              className={inputClass(!!errors.endAge)}
            />
            {errors.endAge && <p className="mt-1 text-sm text-[var(--accent)]">{errors.endAge}</p>}
            <p className="mt-1.5 text-sm text-[var(--muted)]">
              Determines how many years your calendar spans.
            </p>
          </div>

          <div>
            <label htmlFor="quote" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
              Personal quote <span className="text-[var(--muted)] font-normal">(optional)</span>
            </label>
            <textarea
              id="quote"
              name="quote"
              value={formData.quote}
              onChange={handleInputChange}
              rows={3}
              className={`${inputClass(false)} resize-none`}
              placeholder="A motto to anchor your calendar"
            />
          </div>

          <div className="flex gap-3">
            {existing && (
              <button
                type="button"
                onClick={() => setPhase('events')}
                className="flex-1 py-3 px-4 rounded-md font-medium border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 bg-[var(--ink)] text-[var(--paper)] py-3 px-4 rounded-md font-medium tracking-wide hover:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-colors"
            >
              {existing ? 'Save changes' : 'Continue to milestones'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-[var(--muted)] text-center">
          Stored locally in your browser — never sent to any server.
        </p>
      </div>
    </div>
  );
}
