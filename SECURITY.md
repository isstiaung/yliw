# Security Policy

## Scope

yliw is a fully client-side application. It has no backend, no accounts, no
analytics, and no network calls of its own — everything you enter is stored in
your browser's `localStorage` and never leaves your device. That removes most
of the usual attack surface, but it also means a few things worth knowing:

- **Your data lives in your browser.** Anything with access to the browser
  profile (an extension, another user on the same OS account, devtools) can
  read it. Use **Export JSON** if you want a backup you control.
- **Exported JSON and CSV files are plain text.** They are not encrypted.
- **Plain share links are readable by anyone who has them.** They are
  encoded, not encrypted. Protected links are encrypted with AES-GCM under a
  passphrase-derived key (PBKDF2-SHA-256, 600,000 iterations); their strength
  is the strength of the passphrase.
- **Opening a share link is treated as untrusted input.** Its contents go
  through the same validation as a JSON import, and decompression stops at
  256KB so a small link cannot expand into a huge payload.
- Vulnerabilities we care about are things like script injection via imported
  CSV or JSON, a crafted share link, or an exported SVG; prototype pollution in
  the import path; weaknesses in how protected links are encrypted; or a
  dependency advisory that is actually reachable from this app.

## Supported versions

Only the latest commit on `main` is supported. There are no long-lived release
branches, and fixes land on `main`.

## Reporting a vulnerability

Report it by [opening an issue](https://github.com/isstiaung/yliw/issues/new).
yliw has no server and holds nobody's data, so most reports — a weakness in
how protected links are encrypted, say, or a reachable dependency advisory —
are fine to discuss in public.

**If the issue could be used against someone else**, such as script injection
through a crafted share link or import file, please do not post the details.
Open an issue that says only that you have a security report and how to reach
you, and the maintainer will get in touch to take it from there. That keeps a
working exploit out of public view until a fix has shipped.

There is deliberately no email address here: a public inbox in a public repo
is a spam magnet.

Please include:

- What the issue is and roughly how severe you think it is
- Steps to reproduce, ideally with a minimal input file if it involves import
- The browser and version you saw it on
- Whether you have already disclosed it anywhere

### What to expect

This is a small hobby project maintained by one person in their spare time, so
treat these as intentions rather than an SLA:

- Acknowledgement within about 7 days
- An assessment and a rough fix timeline within about 30 days
- Credit in the fix's commit and release notes, unless you would rather stay
  anonymous

Please give us a reasonable window to ship a fix before disclosing publicly.

## Out of scope

- Missing security headers on a third-party deployment you do not control
- Self-XSS that requires the reporter to paste code into their own devtools
- Vulnerabilities in dependencies that are not reachable from this app's code
- Clickjacking or CSRF on a static site with no authenticated actions
- Reports generated entirely by an automated scanner with no working
  reproduction
