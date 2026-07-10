'use client';

import React, { useRef, useState } from 'react';
import { FaDownload, FaUpload } from 'react-icons/fa';
import { useLifeData } from '@/contexts/LifeDataContext';
import { exportUserData, importUserData } from '@/utils/localStorage';

export default function DataControls({ className = '' }: { className?: string }) {
  const { state, setUserData } = useLifeData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleExport = () => {
    const json = exportUserData();
    if (!json) return;

    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeName = (state.userData?.name || 'life').toLowerCase().replace(/\s+/g, '-');
    link.href = url;
    link.download = `${safeName}-in-weeks.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imported = importUserData(String(reader.result));
      if (imported) {
        setUserData(imported);
        setMessage('Imported successfully.');
      } else {
        setMessage('Could not read that file.');
      }
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className={`card bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 ${className}`}>
      <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-4">
        Your data
      </h3>
      <div className="space-y-2">
        <button
          onClick={handleExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[var(--line)] text-[var(--ink)] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <FaDownload className="w-3.5 h-3.5" />
          Export JSON
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md border border-[var(--line)] text-[var(--ink)] font-medium hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
        >
          <FaUpload className="w-3.5 h-3.5" />
          Import JSON
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handleImport}
          className="hidden"
        />
      </div>
      {message && (
        <p className="mt-3 text-xs text-[var(--muted)]">{message}</p>
      )}
      <p className="mt-3 text-xs text-[var(--muted)]/70">
        Back up your calendar or move it between devices.
      </p>
    </div>
  );
}
