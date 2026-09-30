'use client';

import React, { useState } from 'react';
import { UserData } from '@/types';
import { encodeShareFragment } from '@/utils/shareLink';
import { FaCopy, FaLink, FaLock } from 'react-icons/fa';

/**
 * Create a share link. Plain links are compact but readable by anyone who has
 * them; protected links are encrypted under a passphrase that is sent
 * separately. The UI says which is which in plain words.
 */
export default function ShareControls({ userData, className = '' }: { userData: UserData; className?: string }) {
  const [protect, setProtect] = useState(false);
  const [passphrase, setPassphrase] = useState('');
  const [link, setLink] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tooShort = protect && passphrase.length < 8;

  const create = async () => {
    setBusy(true);
    setStatus(null);
    try {
      const fragment = await encodeShareFragment(userData, protect ? passphrase : undefined);
      setLink(`${window.location.origin}/view#${fragment}`);
    } catch {
      setStatus('Could not create a link in this browser.');
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setStatus('Link copied.');
    } catch {
      setStatus('Copy failed — select the link and copy it manually.');
    }
  };

  // Any change to the options invalidates a link already shown.
  const reset = () => {
    setLink(null);
    setStatus(null);
  };

  const buttonClass =
    'w-full px-4 py-2.5 rounded-md border border-[var(--line)] text-[var(--ink)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors flex items-center justify-center gap-2 disabled:opacity-60';

  return (
    <div className={`card bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 ${className}`}>
      <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-4">Share</h3>

      <label className="flex items-center gap-2 text-sm text-[var(--ink)] mb-3">
        <input
          type="checkbox"
          checked={protect}
          onChange={e => {
            setProtect(e.target.checked);
            reset();
          }}
        />
        Protect with a passphrase
      </label>

      {protect && (
        <div className="mb-3">
          <label htmlFor="share-passphrase" className="sr-only">Passphrase</label>
          <input
            id="share-passphrase"
            type="password"
            autoComplete="new-password"
            value={passphrase}
            onChange={e => {
              setPassphrase(e.target.value);
              reset();
            }}
            placeholder="At least 8 characters"
            className="w-full px-3 py-2 rounded-md border border-[var(--line)] bg-[var(--paper)] text-sm text-[var(--ink)]"
          />
        </div>
      )}

      <button onClick={create} disabled={busy || tooShort} className={buttonClass}>
        {protect ? <FaLock className="w-3.5 h-3.5" /> : <FaLink className="w-3.5 h-3.5" />}
        {busy ? 'Creating…' : 'Create link'}
      </button>

      {link && (
        <div className="mt-3 space-y-2">
          <label htmlFor="share-link" className="sr-only">Share link</label>
          <input
            id="share-link"
            readOnly
            value={link}
            onFocus={e => e.target.select()}
            className="w-full px-3 py-2 rounded-md border border-[var(--line)] bg-[var(--paper)] text-xs font-mono text-[var(--muted)]"
          />
          <button onClick={copy} className={buttonClass}>
            <FaCopy className="w-3.5 h-3.5" />
            Copy link
          </button>
        </div>
      )}

      <p className="mt-3 text-xs text-[var(--muted)]/80">
        {protect
          ? 'The link is encrypted. Send the passphrase separately — without it the link cannot be opened, and it cannot be recovered.'
          : 'Anyone with this link can see your name, birth date and milestones. Nothing is uploaded: the calendar lives inside the link itself.'}
      </p>

      {status && (
        <p role="status" className="mt-2 text-xs text-[var(--accent)]">
          {status}
        </p>
      )}
    </div>
  );
}
