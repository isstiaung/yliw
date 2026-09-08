'use client';

import React, { useRef, useState } from 'react';
import { CSV_TEMPLATE, parseEventsCsv } from '@/utils/csv';
import { useLifeData } from '@/contexts/LifeDataContext';
import { FaFileCsv, FaUpload } from 'react-icons/fa';

/**
 * Bulk milestone import: template download, file picker, and the per-row
 * outcome report.
 *
 * Split out of EventForm, which was carrying this alongside the add/edit
 * modal, its validation and the milestone list. Nothing here is shared with
 * the form beyond the context, so it owns its own state.
 */
export default function CsvImport({ className = '' }: { className?: string }) {
  const { state, addEvent } = useLifeData();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ text: string; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'milestones-template.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !state.userData) return;

    const { birthDate, endAge } = state.userData;
    const reader = new FileReader();
    reader.onload = () => {
      const { events, errors } = parseEventsCsv(String(reader.result), birthDate, endAge);
      events.forEach(event => addEvent(event));
      setMessage({
        text:
          events.length > 0
            ? `Imported ${events.length} milestone${events.length === 1 ? '' : 's'}.`
            : 'Nothing imported.',
        errors,
      });
    };
    reader.readAsText(file);
    // Clear so re-picking the same file fires change again.
    e.target.value = '';
  };

  const buttonClass =
    'px-4 py-2.5 rounded-md text-sm border border-[var(--line)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center gap-2';

  return (
    <div className={className}>
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={downloadTemplate} className={buttonClass} title="Download a CSV template to fill in">
          <FaFileCsv className="w-3.5 h-3.5" />
          CSV template
        </button>
        <button
          onClick={() => inputRef.current?.click()}
          className={buttonClass}
          title="Upload a filled-in CSV of milestones"
        >
          <FaUpload className="w-3.5 h-3.5" />
          Upload CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="text/csv,.csv"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <p className="text-xs text-[var(--muted)]/70 mt-3">
        Lots of milestones? Download the CSV template, fill it in, and upload it — no need to use the form.
      </p>

      {message && (
        <div
          className="mt-4 rounded-lg border border-[var(--line)] bg-[var(--paper)] p-4 text-sm"
          role="status"
          aria-live="polite"
        >
          <p className="text-[var(--ink)] font-medium">{message.text}</p>
          {message.errors.length > 0 && (
            <ul className="mt-2 space-y-0.5 text-[var(--accent)]">
              {message.errors.slice(0, 5).map(error => (
                <li key={error}>{error}</li>
              ))}
              {message.errors.length > 5 && (
                <li className="text-[var(--muted)]">
                  …and {message.errors.length - 5} more rows skipped.
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
