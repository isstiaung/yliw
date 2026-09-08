# Contributing to Your Life In Weeks

Thanks for taking an interest. This is a small, deliberately simple project —
one page, no backend, no database — and the goal is to keep it that way. The
notes below should get you from clone to merged PR without guesswork.

Everyone taking part is expected to follow the
[Code of Conduct](CODE_OF_CONDUCT.md).

## Getting set up

Requires **Node.js 22+**.

```bash
git clone https://github.com/isstiaung/yliw.git
cd yliw
npm install
npm run dev
```

Before opening a PR, run the same checks CI runs:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

All four must pass. The tests cover the pure logic in `src/utils/` — dates,
CSV parsing and storage. If you change any of those, add a case; if you add a
new pure module, it belongs under test too.

## What makes a good contribution

**Good candidates**

- Bug fixes, especially in date maths, CSV parsing, or print layout
- New icons for the picker, or new theme presets
- Accessibility improvements to the forms and controls
- Print and layout fixes for edge cases (very long names, 100-year spans,
  dozens of overlapping events)
- Further export formats, such as ICS
- Documentation, including a real screenshot for the README

**Please open an issue first if you're planning to**

- Add a backend, accounts, sync, or any network call
- Add analytics or telemetry of any kind
- Introduce a state management library, component library, or other large
  dependency
- Significantly restructure the app

None of these are automatically off the table, but they change what the project
is, so let's talk before you spend a weekend on it.

## Principles worth knowing

These constraints explain most of the design decisions in the codebase:

1. **Local-first, always.** No data leaves the browser. No accounts, no
   servers, no analytics, no third-party requests at runtime. A PR that adds
   one will be declined.
2. **It has to print, and it has to export.** The screen view is secondary to
   the printed poster. If a change affects layout, check it at both A4 and A0
   with **Background graphics** enabled, and check the SVG export still opens
   — `src/utils/posterExport.ts` builds that independently of the DOM, so a
   change to the grid does not automatically reach it.
3. **Few dependencies.** The current list is short on purpose. Prefer ~30 lines
   of plain code over a package — the CSV parser in `src/utils/csv.ts` is a
   deliberate example.
4. **Static export must keep working.** `next.config.ts` sets
   `output: "export"`, so no server components with runtime data fetching, no
   API routes, no middleware, no `next/image` loaders that need a server.

## Code conventions

Match what's already there rather than importing your own style:

- **TypeScript throughout.** No `any` unless you explain why in a comment.
- **Tailwind for styling**, with colours coming from CSS variables
  (`var(--ink)`, `var(--accent)`, …) — never hardcoded hex in components, or
  themes will break.
- **New theme colours** get added as variable sets under `[data-theme=…]` in
  `src/app/globals.css`, and registered in `src/utils/themes.ts` for the
  picker.
- **Client components** need `'use client'`. Most of the app is client-side
  because it reads `localStorage`.
- **Comments explain why, not what.** The existing comments are a good guide to
  the density expected — enough to explain a non-obvious constraint, not a
  narration of the code.
- Keep components in `src/components/`, pure logic in `src/utils/`, and shared
  types in `src/types/`.

### Regenerating the README screenshots

If your change alters the UI enough to make `docs/screenshots/` stale, rerun
`scripts/screenshots.mjs` — the header comment has the setup steps. Playwright
is intentionally not a project dependency, so it's a one-time install. The
script seeds a fictional persona; please don't replace it with real data, since
these images ship in a public repo.

### A note on the theme init script

`src/utils/themes.ts` exports `themeInitScript`, an inline script that applies
the saved theme before hydration to avoid a flash of the default palette. It
duplicates the logic of `loadThemeSettings` + `applyThemeSettings` on purpose.
If you change one, change the other.

## Pull requests

1. Fork and branch off `main`. Branch names like `fix/print-a0-overflow` or
   `feat/svg-export` are ideal.
2. Keep the PR focused — one concern per PR. A drive-by refactor bundled with a
   bug fix makes both harder to review.
3. Write a clear description: what changed, why, and how you verified it. For
   anything visual, include a before/after screenshot. For print changes, say
   which paper sizes you checked.
4. Make sure lint, typecheck, and build all pass.
5. Fill in the PR template checklist.

### Commit messages

The history uses [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(csv): accept semicolon-delimited files
fix(print): stop A0 grid overflowing on 100-year spans
docs(readme): add CSV column alias table
chore(deps): bump next to 15.5.18
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `chore`.
It's a convention, not a gate — a clear message beats a correctly-prefixed
vague one.

## Reporting bugs

Use the bug report template and include your browser and OS, what you expected,
what happened, and steps to reproduce. For import bugs, attach a **redacted**
CSV or JSON that triggers it — please strip anything personal first, since your
data is genuinely private and we don't need the real thing to fix the parser.

For security issues, follow [SECURITY.md](SECURITY.md) instead of opening a
public issue.

## Questions

Open a [Discussion](https://github.com/isstiaung/yliw/discussions) or a
question issue. This is a spare-time project, so replies may take a few days —
your patience is appreciated.
