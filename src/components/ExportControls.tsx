'use client';

import React, { useState } from 'react';
import { UserData, WeekData } from '@/types';
import { downloadPosterPng, downloadPosterSvg, readPalette } from '@/utils/posterExport';
import { FaDownload, FaFileImage } from 'react-icons/fa';

interface ExportControlsProps {
  userData: UserData;
  weekData: WeekData[];
  className?: string;
}

/**
 * Image export, next to the print panel.
 *
 * Printing already covers paper; this covers sharing. Both come from the same
 * data, and the SVG is a real vector rather than a screenshot.
 */
export default function ExportControls({ userData, weekData, className = '' }: ExportControlsProps) {
  const [busy, setBusy] = useState<'png' | 'svg' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'png' | 'svg') => {
    setBusy(kind);
    setError(null);
    try {
      const options = { userData, weekData, palette: readPalette() };
      if (kind === 'svg') downloadPosterSvg(options);
      else await downloadPosterPng(options);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  };

  const buttonClass =
    'w-full px-4 py-2.5 rounded-md border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60';

  return (
    <div className={`card bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 ${className}`}>
      <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-4">
        Save as image
      </h3>

      <div className="space-y-2">
        <button onClick={() => run('png')} disabled={busy !== null} className={buttonClass}>
          <FaFileImage className="w-3.5 h-3.5" />
          {busy === 'png' ? 'Rendering…' : 'Download PNG'}
        </button>
        <button onClick={() => run('svg')} disabled={busy !== null} className={buttonClass}>
          <FaDownload className="w-3.5 h-3.5" />
          {busy === 'svg' ? 'Rendering…' : 'Download SVG'}
        </button>
      </div>

      <p className="mt-3 text-xs text-[var(--muted)]/80">
        PNG for sharing; SVG stays sharp at any size and is what a print shop
        wants. Both use your current theme.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-xs text-[var(--accent)]">
          {error}
        </p>
      )}
    </div>
  );
}
