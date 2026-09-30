'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useLifeData } from '@/contexts/LifeDataContext';
import LifeGrid from '@/components/LifeGrid';
import LoadingScreen from '@/components/LoadingScreen';
import Logo from '@/components/Logo';
import { UserData } from '@/types';
import { decodeShareFragment, parseFragment, ShareLinkError } from '@/utils/shareLink';
import { loadUserData } from '@/utils/localStorage';

/**
 * Opens a share link. The calendar is decoded from the URL fragment in the
 * browser and shown read-only; nothing is written to storage unless the
 * viewer explicitly saves a copy, and that asks first if it would replace
 * their own calendar.
 */

type ViewState =
  | { kind: 'loading' }
  | { kind: 'passphrase'; error?: string }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; data: UserData };

// The fragment is external state: read it with useSyncExternalStore and
// follow hashchange, so pasting a different link into the bar just works.
const subscribeHash = (onChange: () => void) => {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
};
const readHash = () => window.location.hash;
const readServerHash = () => null; // prerender: no fragment yet

type Result = { hash: string; data: UserData } | { hash: string; error: string };

const messageFor = (error: unknown) =>
  error instanceof ShareLinkError ? error.message : 'This link could not be opened.';

export default function SharedCalendar() {
  const hash = useSyncExternalStore(subscribeHash, readHash, readServerHash);
  const fragment = hash === null ? null : parseFragment(hash);
  const { setUserData } = useLifeData();
  const router = useRouter();

  // Keyed by hash so a result never outlives the link it came from.
  const [result, setResult] = useState<Result | null>(null);
  const current = result && result.hash === hash ? result : null;

  const [passphrase, setPassphrase] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  // Plain links decode straight away. setState only happens after an await.
  useEffect(() => {
    if (hash === null || fragment?.kind !== 'plain') return;
    let cancelled = false;
    decodeShareFragment(fragment)
      .then(data => !cancelled && setResult({ hash, data }))
      .catch(error => !cancelled && setResult({ hash, error: messageFor(error) }));
    return () => {
      cancelled = true;
    };
    // fragment is derived from hash; hash is the real dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hash]);

  const unlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hash === null || fragment?.kind !== 'encrypted') return;
    setUnlocking(true);
    try {
      setResult({ hash, data: await decodeShareFragment(fragment, passphrase) });
    } catch (error) {
      setResult({ hash, error: messageFor(error) });
    } finally {
      setUnlocking(false);
    }
  };

  const saveCopy = (data: UserData) => {
    if (
      loadUserData() &&
      !window.confirm('Replace your own calendar with this one? Your current calendar will be lost.')
    ) {
      return;
    }
    // Through the context, which persists it, rather than a full reload.
    setUserData(data);
    router.push('/calendar');
  };

  let view: ViewState;
  if (hash === null) view = { kind: 'loading' };
  else if (!fragment) view = { kind: 'error', message: 'This link does not contain a calendar.' };
  else if (current && 'data' in current) view = { kind: 'ready', data: current.data };
  else if (fragment.kind === 'encrypted') view = { kind: 'passphrase', error: current?.error };
  else if (current) view = { kind: 'error', message: current.error };
  else view = { kind: 'loading' };

  if (view.kind === 'loading') return <LoadingScreen />;

  if (view.kind === 'ready') {
    return (
      <LifeGrid
        sharedData={view.data}
        banner={
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-sm text-[var(--muted)] truncate">
              Viewing a shared calendar
            </span>
            <button
              onClick={() => saveCopy(view.data)}
              className="text-sm text-[var(--accent)] hover:underline whitespace-nowrap"
            >
              Save a copy as mine
            </button>
          </div>
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--paper)] paper-grain flex items-center justify-center p-6">
      <div className="card bg-[var(--surface)] border border-[var(--line)] rounded-xl p-8 max-w-sm w-full">
        <Logo className="h-8 w-8 mb-6" />
        {view.kind === 'error' ? (
          <>
            <h1 className="font-display text-2xl text-[var(--ink)] mb-2">Can&apos;t open this link</h1>
            <p role="alert" className="text-sm text-[var(--muted)] mb-6">{view.message}</p>
            <Link href="/" className="text-sm text-[var(--accent)] hover:underline">Make your own calendar</Link>
          </>
        ) : (
          <form onSubmit={unlock}>
            <h1 className="font-display text-2xl text-[var(--ink)] mb-2">Protected calendar</h1>
            <p className="text-sm text-[var(--muted)] mb-5">
              Enter the passphrase the sender gave you. It is checked in your browser and never sent anywhere.
            </p>
            <label htmlFor="passphrase" className="block text-sm font-medium text-[var(--ink)] mb-1.5">
              Passphrase
            </label>
            <input
              id="passphrase"
              type="password"
              autoFocus
              autoComplete="off"
              value={passphrase}
              onChange={e => setPassphrase(e.target.value)}
              className="w-full px-3 py-2.5 rounded-md border border-[var(--line)] bg-[var(--paper)] text-[var(--ink)] mb-3"
            />
            {view.error && (
              <p role="alert" className="text-sm text-[var(--accent)] mb-3">{view.error}</p>
            )}
            <button
              type="submit"
              disabled={unlocking || passphrase.length === 0}
              className="w-full px-4 py-2.5 rounded-md bg-[var(--ink)] text-[var(--paper)] font-medium disabled:opacity-60"
            >
              {unlocking ? 'Unlocking…' : 'Open calendar'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
