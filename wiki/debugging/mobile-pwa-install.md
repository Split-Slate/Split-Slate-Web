# Browser App Installation

Purpose: explain why the installed-app option may be absent and how the interface handles browser-controlled installation.

Last updated: 2026-10-17

## Observed deployment issue

On 2026-10-03, `https://split-slate.netlify.app/manifest.webmanifest` returned HTTP 200 with
`Content-Type: application/octet-stream`, despite containing a valid JSON web app manifest. Netlify
does not infer the expected manifest media type for this extension on this deployment. The source
`public/_headers` now specifies `Content-Type: application/manifest+json`; the deployed response must
be checked again after publishing. This header mismatch is a possible contributor to missing install
UI, not a confirmed root cause of Brave's behavior on a particular phone.

## Install flow

The production app offers a non-blocking desktop/mobile top bar, **Take Split Slate with you**,
with Install and an immediately available Close control. There is no modal, backdrop, or two-second
dismissal lock. Closing saves a timestamp in **localStorage**, not sessionStorage, under
`split-slate-install-dismissed`. A later page load becomes eligible for an automatic reminder after
**24 hours**. Legacy `"true"`, invalid, and future timestamps are treated as expired. An open page does
not automatically reopen the offer when the interval elapses.

Automatic installation offers and the post-import hint are suppressed after accepted installation,
an `appinstalled` event, or detection of standalone display mode (including Apple mobile's
`navigator.standalone`). All three persist `split-slate-install-accepted = "true"`; opening the
installed app therefore also suppresses later reminders in a browser that shares its storage.
Display-mode changes, focus, page-show, and cross-tab storage events refresh installation detection.
Browsers cannot reliably establish whether the app is installed in another browser/profile or a
separate storage context; clearing site data also clears this remembered state. Uninstallation is
not inferred, so a remembered installation is not automatically invited again.

Settings retains **Install app** for supported, not-known-installed browsers, independently of the
24-hour dismissal interval. A successful group import also offers a contextual **Install app** action,
unless installation is already known; see [[import-export]]. These actions and the automatic bar use
the same flow: if the browser supplied `beforeinstallprompt`, its event is retained while notices are
hidden and `prompt()` is called directly from the user's click. Without that event, the top bar shows
browser-menu instructions, including Share → Add to Home Screen on Apple mobile. The app cannot force
a browser to provide a native installation prompt. Instructions remain non-blocking.

## Update notices and unsaved work

**A new version of Split Slate is ready** uses the same top-bar presentation with **Update and reload**
and Close. It tells users to save changes first, never steals focus or blocks form editing, and only
activates/reloads after the explicit update action. Close defers that waiting worker for the current
page lifetime; focus, online, and periodic checks do not immediately reopen the same offer. A new
waiting worker or a later page load can offer an update again. Updates take priority over automatic
installation offers; explicitly requested browser-menu installation instructions may temporarily
take the bar until closed. See [[layout-architecture]] for layout clearance.

The revised banner, 24-hour interval, installation detection, unsaved-input, Settings, and import
regression cases have been written but **not run**. Historical PWA passes predate these changes.

The production service worker does not run in the Vite development server. PWA browser tests run
against a production build on localhost.
See [[product-roadmap]] and [[iconography]] for the offline shell and release checks.
