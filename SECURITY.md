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
- Vulnerabilities we care about are things like stored XSS via imported CSV or
  JSON, prototype pollution in the import path, or a dependency advisory that
  is actually reachable from this app.

## Supported versions

Only the latest commit on `main` is supported. There are no long-lived release
branches, and fixes land on `main`.

## Reporting a vulnerability

**Please do not open a public issue for a security report.**

Report it privately through **GitHub Security Advisories**:
<https://github.com/isstiaung/yliw/security/advisories/new>

That channel is private between you and the maintainer, it lets us discuss a
fix before anything is public, and it can issue a CVE and credit you when the
advisory is published. No email address is listed here deliberately — a public
inbox in a public repo is a spam magnet, and the advisory flow is better for
both of us. If you cannot use it for some reason, open a normal issue saying
only that you have a security report and how to reach you, with no details.

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
- Credit in the advisory and release notes, unless you would rather stay
  anonymous

Please give us a reasonable window to ship a fix before disclosing publicly.

## Out of scope

- Missing security headers on a third-party deployment you do not control
- Self-XSS that requires the reporter to paste code into their own devtools
- Vulnerabilities in dependencies that are not reachable from this app's code
- Clickjacking or CSRF on a static site with no authenticated actions
- Reports generated entirely by an automated scanner with no working
  reproduction
