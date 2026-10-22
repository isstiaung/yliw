export type ThemeId = 'warm' | 'light' | 'dark' | 'sketch';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  /** Swatch preview colours: paper, ink, accent. Must match globals.css. */
  preview: [string, string, string];
}

/** Presets are defined as CSS variable sets in globals.css ([data-theme=…]);
    this list only drives the picker UI. */
export const themes: ThemeOption[] = [
  { id: 'warm', label: 'Warm', preview: ['#f7f0e1', '#211a12', '#b5501d'] },
  { id: 'light', label: 'Light', preview: ['#fafaf8', '#1c1c1a', '#c03a2b'] },
  { id: 'dark', label: 'Dark', preview: ['#16120e', '#ede4d3', '#d97038'] },
  { id: 'sketch', label: 'Sketch', preview: ['#fdfcf6', '#34342f', '#c94f2e'] },
];

export interface CustomizableToken {
  var: string;
  label: string;
}

export const customizableTokens: CustomizableToken[] = [
  { var: '--paper', label: 'Background' },
  { var: '--surface', label: 'Card' },
  { var: '--ink', label: 'Ink & text' },
  { var: '--accent', label: 'Accent' },
  { var: '--week-future', label: 'Future weeks' },
  { var: '--week-past', label: 'Lived weeks' },
  { var: '--week-current', label: 'This week' },
];

/**
 * Each week fill has a border token, and the presets tune the two together.
 * Customising only the fill left the preset's border round it — a cream outline
 * on red squares — so a custom fill brings a matching border with it.
 *
 * `mix` is how far the border sits from its fill (0: the same colour). It
 * darkens a light fill and lightens a dark one, as the presets do for future
 * weeks; the current week's border is always the darker edge of its fill.
 * That fill defaults to the accent, so a custom accent moves it too.
 */
const DERIVED_BORDERS: Array<{ fill: string; border: string; mix: number; darken?: boolean; inherits?: string }> = [
  { fill: '--week-future', border: '--week-future-border', mix: 0.1 },
  { fill: '--week-past', border: '--week-past-border', mix: 0 },
  { fill: '--week-current', border: '--week-current-border', mix: 0.22, darken: true, inherits: '--accent' },
];

/** Every variable a custom setting may have put on <html>. */
const overridableVars = [...customizableTokens.map(t => t.var), ...DERIVED_BORDERS.map(d => d.border)];

function shade(hex: string, mix: number, darken: boolean): string | null {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) return null;
  const value = parseInt(match[1], 16);
  const rgb = [value >> 16, (value >> 8) & 255, value & 255];
  const luminance = (0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]) / 255;
  const target = darken || luminance > 0.5 ? 0 : 255;
  return `#${rgb.map(c => Math.round(c + (target - c) * mix).toString(16).padStart(2, '0')).join('')}`;
}

/** Recompute the border tokens for whichever fills are customised. */
export function withDerivedBorders(custom: Record<string, string>): Record<string, string> {
  const next = { ...custom };
  for (const { fill, border, mix, darken = false, inherits } of DERIVED_BORDERS) {
    const source = next[fill] ?? (inherits ? next[inherits] : undefined);
    const derived = source ? shade(source, mix, darken) : null;
    if (derived) next[border] = derived;
    else delete next[border];
  }
  return next;
}

export interface ThemeSettings {
  theme: ThemeId;
  /** Per-variable colour overrides layered on top of the preset. */
  custom: Record<string, string>;
}

const THEME_KEY = 'yliw-theme';
const themeIds = new Set(themes.map(t => t.id));

export function loadThemeSettings(): ThemeSettings {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (!raw) return { theme: 'warm', custom: {} };
    const parsed = JSON.parse(raw);
    const theme: ThemeId = themeIds.has(parsed?.theme) ? parsed.theme : 'warm';
    const custom: Record<string, string> = {};
    if (parsed?.custom && typeof parsed.custom === 'object') {
      for (const [key, value] of Object.entries(parsed.custom)) {
        if (key.startsWith('--') && typeof value === 'string') custom[key] = value;
      }
    }
    return { theme, custom };
  } catch {
    return { theme: 'warm', custom: {} };
  }
}

export function saveThemeSettings(settings: ThemeSettings): void {
  try {
    localStorage.setItem(THEME_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save theme settings:', error);
  }
}

export function applyThemeSettings(settings: ThemeSettings): void {
  const root = document.documentElement;
  if (settings.theme === 'warm') {
    root.removeAttribute('data-theme');
  } else {
    root.setAttribute('data-theme', settings.theme);
  }
  for (const name of overridableVars) {
    root.style.removeProperty(name);
  }
  for (const [key, value] of Object.entries(settings.custom)) {
    root.style.setProperty(key, value);
  }
}

/**
 * Inline script injected before hydration so a saved theme paints on first
 * frame instead of flashing the default. Mirrors loadThemeSettings +
 * applyThemeSettings; keep them in sync.
 */
export const themeInitScript = `(function(){try{var s=JSON.parse(localStorage.getItem('${THEME_KEY}')||'null');if(!s)return;if(s.theme&&s.theme!=='warm')document.documentElement.setAttribute('data-theme',s.theme);var c=s.custom||{};for(var k in c){if(k.indexOf('--')===0&&typeof c[k]==='string')document.documentElement.style.setProperty(k,c[k]);}}catch(e){}})();`;

/* --------------------------------------------------------------------------
 * External store
 *
 * The theme lives outside React: a pre-hydration script in layout.tsx applies
 * it before the first paint, and localStorage is the source of truth. Syncing
 * that into state with a mount effect means a second render on every load and
 * trips React's set-state-in-effect rule, so the store is exposed through
 * useSyncExternalStore instead. The snapshot is cached because that hook
 * requires a stable reference between changes.
 * ----------------------------------------------------------------------- */

let cachedSettings: ThemeSettings | null = null;
const listeners = new Set<() => void>();

/** Server render has no localStorage; a frozen constant keeps it stable. */
const SERVER_SNAPSHOT: ThemeSettings = { theme: 'warm', custom: {} };

export function subscribeThemeSettings(onChange: () => void): () => void {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

export function getThemeSettingsSnapshot(): ThemeSettings {
  if (!cachedSettings) cachedSettings = loadThemeSettings();
  return cachedSettings;
}

export function getThemeSettingsServerSnapshot(): ThemeSettings {
  return SERVER_SNAPSHOT;
}

/** Apply, persist and publish a new theme in one step. */
export function commitThemeSettings(next: ThemeSettings): void {
  cachedSettings = next;
  applyThemeSettings(next);
  saveThemeSettings(next);
  for (const listener of listeners) listener();
}
