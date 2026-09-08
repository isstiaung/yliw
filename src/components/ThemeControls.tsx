'use client';

import React, { useState, useSyncExternalStore } from 'react';
import {
  themes,
  customizableTokens,
  subscribeThemeSettings,
  getThemeSettingsSnapshot,
  getThemeSettingsServerSnapshot,
  commitThemeSettings,
  ThemeId,
  ThemeSettings,
} from '@/utils/themes';

/** <input type="color"> only accepts #rrggbb — normalise what we read back. */
function toHexColor(value: string): string {
  const trimmed = value.trim();
  if (/^#[0-9a-f]{6}$/i.test(trimmed)) return trimmed;
  if (/^#[0-9a-f]{3}$/i.test(trimmed)) {
    return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
  }
  return '#888888';
}

function readTokenValues(): Record<string, string> {
  const style = getComputedStyle(document.documentElement);
  const values: Record<string, string> = {};
  for (const token of customizableTokens) {
    values[token.var] = toHexColor(style.getPropertyValue(token.var));
  }
  return values;
}

export default function ThemeControls({ className = '' }: { className?: string }) {
  const settings = useSyncExternalStore(
    subscribeThemeSettings,
    getThemeSettingsSnapshot,
    getThemeSettingsServerSnapshot
  );
  const [tokenValues, setTokenValues] = useState<Record<string, string>>({});
  const [showCustom, setShowCustom] = useState(false);

  const update = (next: ThemeSettings) => {
    commitThemeSettings(next);
    // The swatches mirror computed CSS values, so they only need re-reading
    // while the panel that shows them is open.
    if (showCustom) setTokenValues(readTokenValues());
  };

  // Read on open rather than on mount: getComputedStyle for every token is
  // wasted work for the majority of visits, which never open this panel.
  const toggleCustom = () => {
    if (!showCustom) setTokenValues(readTokenValues());
    setShowCustom(!showCustom);
  };

  const selectTheme = (theme: ThemeId) => {
    // Switching preset drops manual overrides — mixing them looks broken
    update({ theme, custom: {} });
  };

  const setToken = (varName: string, value: string) => {
    update({ ...settings, custom: { ...settings.custom, [varName]: value } });
  };

  const hasCustom = Object.keys(settings.custom).length > 0;
  const activeLabel = themes.find(t => t.id === settings.theme)?.label ?? 'Warm';

  return (
    <div className={`card bg-[var(--surface)] border border-[var(--line)] rounded-lg p-5 ${className}`}>
      <h3 className="text-xs font-mono uppercase tracking-[0.18em] text-[var(--muted)] mb-4">
        Appearance
      </h3>

      <div className="grid grid-cols-4 gap-2">
        {themes.map(theme => (
          <button
            key={theme.id}
            onClick={() => selectTheme(theme.id)}
            className={`p-1.5 rounded-md border transition-colors ${
              settings.theme === theme.id
                ? 'border-[var(--accent)] bg-[var(--accent-soft)]'
                : 'border-[var(--line)] hover:border-[var(--muted)]/50'
            }`}
            aria-pressed={settings.theme === theme.id}
          >
            <span className="flex h-6 rounded-sm overflow-hidden border border-[var(--line)]">
              {theme.preview.map(color => (
                <span key={color} className="flex-1" style={{ background: color }} />
              ))}
            </span>
            <span className="mt-1 block text-[10px] text-[var(--muted)]">{theme.label}</span>
          </button>
        ))}
      </div>

      <button
        onClick={toggleCustom}
        className="mt-4 text-xs text-[var(--muted)] hover:text-[var(--accent)] transition-colors"
        aria-expanded={showCustom}
      >
        {showCustom ? 'Hide custom colours' : 'Customise colours…'}
      </button>

      {showCustom && (
        <div className="mt-3 space-y-2.5">
          {customizableTokens.map(token => (
            <label
              key={token.var}
              className="flex items-center justify-between gap-3"
            >
              <span className="text-xs text-[var(--muted)]">{token.label}</span>
              <input
                type="color"
                value={tokenValues[token.var] ?? '#888888'}
                onChange={e => setToken(token.var, e.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-[var(--line)] bg-transparent p-0.5"
              />
            </label>
          ))}
          {hasCustom && (
            <button
              onClick={() => update({ ...settings, custom: {} })}
              className="mt-1 text-xs text-[var(--accent)] hover:underline"
            >
              Reset to {activeLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
