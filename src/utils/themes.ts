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
  for (const token of customizableTokens) {
    root.style.removeProperty(token.var);
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
