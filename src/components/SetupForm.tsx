'use client';

import React, { useState } from 'react';
import { useLifeData } from '@/contexts/LifeDataContext';
import { UserData } from '@/types';
import { parseLocalDate } from '@/utils/dateCalculations';

export default function SetupForm() {
  const { setUserData, setPhase } = useLifeData();
  const [formData, setFormData] = useState({
    name: '',
    birthDate: '',
    endAge: 90,
    quote: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'endAge' ? parseInt(value) || 90 : value
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

    if (formData.endAge < 20 || formData.endAge > 90) {
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

    const userData: UserData = {
      name: formData.name.trim(),
      birthDate: parseLocalDate(formData.birthDate),
      endAge: formData.endAge,
      quote: formData.quote.trim(),
      events: []
    };

    setUserData(userData);
    setPhase('events');
  };

  const inputClass = (hasError: boolean) =>
    `w-full px-4 py-3 bg-[var(--surface)] border rounded-md text-[var(--ink)] placeholder:text-[var(--muted)]/60 outline-none transition-shadow focus:ring-2 focus:ring-[var(--accent)]/30 focus:border-[var(--accent)] ${
      hasError ? 'border-[var(--accent)]' : 'border-[var(--line)]'
    }`;

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-grain flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[var(--surface)] border border-[var(--line)] rounded-xl shadow-[0_1px_2px_rgba(31,27,22,0.04),0_12px_40px_-12px_rgba(31,27,22,0.18)] p-8 sm:p-10">
        <div className="mb-9">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-[var(--accent)] mb-3">
            Memento mori
          </p>
          <h1 className="font-display text-4xl text-[var(--ink)] leading-tight mb-2">
            Your Life<br />in Weeks
          </h1>
          <p className="text-[var(--muted)]">
            One small square for every week you will live. Let&apos;s set up your calendar.
          </p>
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

          <button
            type="submit"
            className="w-full bg-[var(--ink)] text-[var(--paper)] py-3 px-4 rounded-md font-medium tracking-wide hover:bg-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/40 focus:ring-offset-2 focus:ring-offset-[var(--surface)] transition-colors"
          >
            Continue to add events
          </button>
        </form>

        <p className="mt-6 text-xs text-[var(--muted)] text-center">
          Stored locally in your browser — never sent to any server.
        </p>
      </div>
    </div>
  );
}
