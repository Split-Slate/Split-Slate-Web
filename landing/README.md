# Split Slate landing page

A standalone static marketing website. It is not part of the expense application or its PWA.

## Files and boundaries

- `index.html` — static story fallback, actual-app screenshot gallery, workflow, split demo, and FAQs.
- `styles.css` — responsive compositions, SVG/phone presentation, and motion fallbacks.
- `animations.js` — existing page enhancements and the shared motion toggle.
- `scroll-story.js` — native scroll scrub, cached geometry, resize/font handling, and fallback selection.
- `offline.js` — scope-safe service-worker registration on secure HTTP(S) pages.
- `service-worker.js` — versioned offline snapshot of the landing and all eight screenshots.
- `components/scroll-story/index.js` — continuous opening narrative, accessible copy, and final CTA.
- `components/workspace/index.js` — original SVG artwork, monoline handwriting, and travelling entries.
- `components/story-phone/index.js` — native replica of the supplied mobile group Overview design.
- `components/screenshot-gallery/index.js` — dependency-free native-dialog lightbox for all eight captures.
- `utils/story-timeline.js` — reversible stroke/pen, paper-to-phone, and settlement choreography.
- `constants/story-data.js` — independent fictional USD data and integer-cent balance derivation.
- `favicon.svg` — the local brand mark and favicon.
- `fonts/montserrat-regular.woff2` — body copy, 400.
- `fonts/saira-bold.woff2` — headings, 700.
- `fonts/space-grotesk-semibold.woff2` — controls, identities, and amounts, 600.
- `fonts/plus-jakarta-sans.woff2` — existing app font, copied locally for the phone replica only.
- `fonts/plus-jakarta-sans-license.txt` — upstream SIL OFL notice for the app-replica font.
- `fonts/*-license.txt` — upstream font-license notices; other existing font assets are retained.

There is no build step, package installation, runtime font service, analytics, or PWA manifest.
The user approved a landing-only service worker for offline access, superseding the earlier
no-service-worker restriction without making this website part of the expense app's installed PWA.
All assets and JavaScript are local: no React, GSAP, ScrollTrigger, bundler, or runtime CDN.
Scripts are ordinary deferred classic scripts, with a small `window.SplitSlateStory` namespace;
they also work when opening `index.html` directly, without JavaScript module/file-origin restrictions.
The opening animation and interactive split demo use fictional data and never save expenses or
access the application's database. The existing screenshot gallery is separate from the illustrated
animation. The page retains its warm-paper, violet, and lime visual identity. Font assets are
self-hosted alongside the page, not fetched from a third-party service at runtime.

## Typography — three landing roles, with an isolated app-replica font

| Variant | Role |
|---------|------|
| Montserrat Regular, 400, normal | Body copy, explanations, FAQs, and supporting text. |
| Space Grotesk Semibold, 600, normal | Controls, navigation, labels, identities, and financial amounts. |
| Saira Bold, 700, normal | Hero/main headings and selected display text. |

The role variables at the top of `styles.css` remain editable. Landing copy uses those same roles;
handwriting is drawn as SVG paths rather than loading a handwriting font. There is no italic styling
or synthetic face. Numeric styling is tabular. Existing unused font assets are not removed.

**User-approved phone-only exception:** the illustrated app uses the app's Plus Jakarta Sans variable
font (normal, weights 400–800), registered locally as `Split Slate App`. It is scoped to the phone and
the digital text of the four travelling entries, not landing headings/body copy. The WOFF2 was copied
from `src/assets/fonts/plus-jakarta-sans.woff2`; the SIL OFL notice was fetched from
Google Fonts' `ofl/plusjakartasans/OFL.txt`. These are deployed inside `landing/fonts/`; the site never
loads fonts from the app origin or a font service. Native emoji avatars stand in for fictional people.

Earlier notes described the approved Manrope/Zilla Slab pass. Source subsequently changed to the
three configured faces above before this animation task. This task preserves those current fonts;
it does not restore, download, or replace them. The earlier receipt/rebrand history remains in the wiki.

The app-entry links currently point to `https://split-slate.netlify.app/`. If the app's URL changes,
update every occurrence of that URL in `index.html`. Preserve the app's existing origin where
possible: its browser-local expense data does not automatically move to another origin.

The application does not import this folder, and its Vite build does not copy it into `dist/`.
Keep this folder outside `public/` and do not add it as an app entry point or precache asset.
Repository-wide formatting can still discover the landing files; that is separate from the app build.

## Launch-state copy and promise tracking

The page describes the **approved launch product**, not only the current development build. The
user approved present-tense wording for planned capabilities and intends to release only when
every advertised promise is delivered. No coming-soon or missing-sync disclaimers belong in the
public copy. This does not turn website wording into evidence of a working application feature.

The canonical website-promise ledger is
[`wiki/roadmap/product-roadmap.md`](../wiki/roadmap/product-roadmap.md#website-launch-promise-ledger).
It records exact claims, page locations, current status, missing work, and release evidence.
**Live group updates and continuity on another device are advertised but not implemented yet.**
Group access, identity, pricing, security, conflicts, and recovery need an approved sync design and
implementation before those claims can be cleared. The page does not promise free sync,
account-free cloud participation, automatic currency conversion, or competitor-only features.

The content pass preserves the editorial design and motion while adding an explicit category
description, a create/share/split/repay workflow, concrete travel/roommate/meal use cases, and FAQs
about unequal splits, multiple payers, balances, currency, and portable data. The retained research
is in [`wiki/research/competitive-landscape.md`](../wiki/research/competitive-landscape.md).

Before public launch, review **all** page claims against the actual product and clear the ledger's
unfulfilled promises and verification gates. Manual Netlify deployment does not enforce this gate
automatically. Publication readiness is separate from technical upload instructions below.
The landing page itself never connects to a sync service or the app's database.

## Actual-app screenshot gallery

The user supplied eight unedited PNG captures from
`/home/rinturj84/Pictures/Screenshots/Screenshots`. They are copied into the standalone deployment
folder with kebab-case names; the source images remain unchanged.

| Supplied capture | Local deployment asset |
|------------------|------------------------|
| `Group_Overview.png` | `images/group-desktop.png` |
| `Group_Overview-mobile.png` | `images/group-mobile.png` |
| `Add_Expense.png` | `images/expense-desktop.png` |
| `Add_Expense-Mobile_1.png` | `images/expense-mobile-1.png` |
| `Add_Expense-Mobile_2.png` | `images/expense-mobile-2.png` |
| `Settlement.png` | `images/balances-desktop.png` |
| `Settlement-Mobile_1.png` | `images/balances-mobile-1.png` |
| `Settlement-Mobile_2.png` | `images/balances-mobile-2.png` |

These replace the three earlier desktop assets and supply the previously absent mobile views.
The gallery describes Maldives Trip and its captured expense/payment records, rather than the
earlier Weekend in Goa/breakfast placeholders. The Overview and balances captures show different
states around a recorded repayment; they are not a single synchronized live session.

**User-approved compact redesign:** the original large inline screenshots occupied too much page
space. The section now shows three small Overview/Add expense/Settle up preview cards, with 150px
thumbnail windows on desktop, 115px on tablets, and 90px thumbnails beside copy on narrow screens.
These thumbnail excerpts are previews only; the eight underlying PNG assets are unchanged.

Selecting a card opens a native `<dialog>` lightbox, initially showing its desktop screenshot or
its first mobile capture at widths up to 56rem. The device filter resets to **All** on every open:
All includes eight screenshots, Desktop includes three, and Mobile includes five. Only matching
thumbnails remain visible; previous/next buttons and Left/Right keys wrap within that filtered set,
with the announced counter and thumbnail labels using its position and total. Changing the filter
preserves the current image if it matches, otherwise selects a matching image from the same screen
(or the first result). Browsing never changes the active filter. Screen buttons still jump to the
matching Overview/Add expense/Settle up view within the device filter; they do not narrow the set.
The thumbnail rail offers direct selection. The main image fits the viewer without cropping.
The user requested removal of the lightbox's Open original link and explanatory footer; they are
no longer shown. The rail is hidden on short viewports, while
the navigation and device/screen controls remain available. There is no autoplay or animation.

Expense and settlement mobile captures remain separate scroll positions, explicitly labelled Part
1 of 2 and Part 2 of 2; overlapping content and fixed headers/footers are never stitched together.
Close with the visible button, Escape, or a click that starts and ends on the backdrop. Native modal
semantics make the background inert; keyboard Tab stays inside the dialog. A fixed-body scroll lock
preserves the page position on touch browsers and restores it, inline body styles, and opener focus
on close. Image-load failure displays a message suggesting another image or reopening the gallery.

The lightbox is an independent deferred classic script with no libraries or server requirement.
If JavaScript or native `showModal` support is unavailable, the cards remain direct desktop-image
links, and small expandable Mobile capture lists expose the five mobile originals. Successful
enhancement hides those fallback lists, not their data. Modified clicks retain normal link behavior.
The former inline gallery tabs and their enhancement were removed; other page effects are unchanged.

This gallery pass does not change the illustrated phone, handwriting, hand, story timeline, app
source, or Netlify drag-and-drop boundaries. All eight assets travel with `landing/`; the deployed
site never needs access to the source screenshot directory. Browser/layout checks remain pending.
The All/Desktop/Mobile filter update edited source and documentation only; no commands or checks
ran. Filtered counts, thumbnail visibility, navigation wraparound, current-image preservation, and
reset-to-All on reopen remain unverified in a browser.

## Animation and accessibility boundaries

- The opening `#expense-story` is one sticky composition: handwriting → frustration/slash →
  lifting entries → digital expenses/settlements → "Less calculating. More living."
- The same Dinner/Taxi labels and $120/$30 elements travel from notebook anchors into phone slots.
  Their stroke artwork crossfades into app-font text while moving, with digital amounts formatted as
  $120.00/$30.00. On landing, the actual nodes dock inside the phone's clipped document; they pan
  with its content rather than leaking over the bezel. Reversing scroll moves those same nodes back
  to the paper. There is no duplicate-number swap, video, or disconnected scene replacement.
- The pen follows sampled points from the exact SVG strokes being drawn. Pen lifts, corrections,
  the diagonal slash, and a small pressure shift are all tied to scroll, including in reverse.
- `scroll-story.js` scrubs a normalized progress value toward the actual scroll position with a
  short 65 ms time-based smoothing constant. No autoplay or visibility-triggered story playback.
  Geometry and path samples are captured only on layout changes; animation frames write transforms,
  opacity, and stroke offsets. Animation-frame work stops when settled, offscreen, or tab-hidden.
- Desktop scroll travel is 3.65 viewport heights, plus the sticky frame (roughly 4–5 heights total).
  At widths up to 56rem, travel is 2.45 heights, artwork is simplified, and the phone finishes centered.
  A skip-story link keeps the following real-app gallery immediately reachable.
- Maya pays $120, Leo pays $30, and Nina joins both equal splits. Integer cents produce $150 total,
  $50 per person, and suggestions Leo → Maya $20 / Nina → Maya $50. The total changes only when
  expense entry completes ($0 → $120 → $150), not through invented intermediate balances.
- The phone reconstructs the user-supplied mobile Overview design: Back to dashboard, group identity
  and member/expense/total/currency summary, purple net-position hero, At a glance/Add expense,
  Members with avatar chips and Manage Members, Suggested transfers with View all balances, and
  Recent transactions with View all, category/equal metadata, and amounts below their titles.
  Card order is Members → Suggested transfers → Recent transactions. Rounded white cards, lavender
  surfaces, borders, shadows, and a five-item Overview/Expenses/Add/Members/More bottom navbar follow
  the reference. The top Add expense pill follows the supplied screenshot; this is a presentation
  replica, not a claim that every control matches every current app breakpoint.
- The header/footer remain fixed inside the phone. A cached-geometry transform pans its document to
  the transaction card during entry, then back to the suggested transfers. This is linked to the same
  reversible page-scroll progress, never autoplay or a nested user-scroll area.
- Fictional viewer Maya's position is derived after each entry: $0.00 → +$80.00 after Dinner →
  +$70.00 after Taxi. Group totals/counts change only at entry completion. The final transfer rows are
  Leo → Maya $20.00 and Nina → Maya $50.00. The phone is an illustration, not a running app or
  screenshot; the user requested removal of its visible walkthrough note. Suggested repayments do
  not move money.
- The existing moving ribbon and later gather → split → repay explanation remain intact.
- The split demo has five keyboard/touch-operable buttons and conserves the ₹1,200 total even
  during animated numeric transitions. It announces the chosen final allocation once, rather than
  making a live announcement for each animation frame.
- The header's motion control disables animation and transitions. Device reduced-motion settings
  take precedence; decorative loops pause offscreen and when the browser tab is hidden.
- No scroll hijacking, custom cursor, forced autoplay, or external animation CDN.
- The opening story switches to the static HTML ledger when motion is disabled or the usable height
  beneath the header is less than 510px on compact layouts / 440px on desktop. Reduced motion also
  has a CSS fallback, and runtime initialization/measurement failures restore the static HTML.
- Touch and keyboard scrolling work without hover; invisible final controls are inert and removed
  from the tab order. The scene has a persistent plain-text narrative for assistive technology.
- The later workflow's existing sticky layout still requires a sufficiently wide and tall viewport.
- Without JavaScript, copy, links, and native FAQs remain usable; the demo shows an equal split
  with disabled method buttons. Desktop story artwork becomes interactive only when enhanced.

Responsive rules cover narrow phones, tablets, large screens, and short landscape windows.
The scoped Chromium checks below verify representative viewports, not every physical device or browser.

## Offline landing cache

`offline.js` registers/checks the local worker during page startup on secure HTTP(S) origins (Netlify HTTPS
or localhost). It does nothing on `file://`, insecure origins, or browsers without service workers.
The registration scope is the script's directory: `/` for the separately deployed landing site or
`/landing/` for a directory preview. If a different worker already owns that exact scope, registration
is skipped rather than replacing it. Registration failures do not break the normal online page.

After a successful online visit **and completion of the worker's installation**, the worker serves
the landing directory URL and `index.html`, including query-string entry URLs, from its cached HTML.
Its explicit 24-file snapshot includes HTML, CSS, all nine runtime scripts, favicon, four active font
files, and all eight screenshots. Unopened mobile parts and lazy images are cached too, so gallery
navigation does not depend on having previously viewed each screenshot. Only listed same-origin
GET requests and the two landing entry URLs are intercepted; other routes and external URLs remain
normal network requests. The worker does not cache the app, API calls, expenses, backups, or imports.
HTML is fetched/cached at the directory entry URL, avoiding static-host redirects from `index.html`;
both navigation aliases share that response offline without relying on a redirect.
No manifest/install prompt, account, telemetry, dependency, or build process is added.

The cache name combines `split-slate-landing`, the exact registration scope, and `CACHE_VERSION`.
Installation fetches all resources while bypassing existing HTTP-cache entries, checks successful non-redirected
responses, and rejects HTML fallback pages returned in place of assets. It writes only after all
fetches succeed; a cache-write failure removes the new incomplete cache and rejects installation.
Failed updates leave the previous version intact. The active worker is cache-first for the complete
snapshot, including online navigation, to keep HTML/scripts/styles consistent rather than mixing
versions. Missing entries can be repaired online; fetch or storage failure has a bounded fallback.

**For every landing-content/asset change before uploading**, increment `CACHE_VERSION` in
`service-worker.js` (initially `2026-10-11-v1`) and upload the complete `landing/` folder together.
The current cache version is `2026-10-11-v3`. Startup explicitly calls `update()` on an existing
matching registration; initial registration and update checks bypass the worker script's HTTP cache.
The user approved **automatic same-visit updates**, replacing the previous wait-for-tabs policy:
after the entire snapshot and update metadata are stored successfully, the new worker calls
`skipWaiting`, activates, claims clients, and requests one refresh of each open landing entry page.
Visitors are not prompted, and need not close/reopen tabs. Other routes/origins/app pages are not
refreshed. Navigation retains each landing tab's query string and fragment; transient gallery/demo
state may reset. The worker itself requests navigation so legacy pages without an update listener
also refresh once their older registration code detects the new worker.

Install metadata records whether a worker was already active, survives install/activation suspension,
and is consumed before refresh requests. A first-time install only claims clients, without a reload;
normal visits, worker restarts, and unchanged versions do not repeatedly refresh. Only outdated
caches belonging to this exact landing scope are deleted; app/unrelated caches are untouched.
The old snapshot can be visible briefly while the update downloads. Failed/offline installs do not
activate or refresh; they retain the old version. Automatic refresh requires that the page remain
open until installation completes, and browser-rejected navigation is logged rather than retried.
There is no periodic background poll or guarantee of updating an already-departed visitor.

Offline availability is not a cold-first-visit guarantee: the browser must have cached the site
before going offline. Clearing site data, private-mode restrictions, storage eviction, or a failed
installation can remove/prevent it. App-entry links still open the separate expense app; this worker
does not establish offline availability for that origin. Runtime registration/cache behavior, offline
reloads, all-image browsing, update transitions, and failure/eviction recovery remain unverified.

The user-approved copy cleanup also removes the opening scroll hint/icon, visible walkthrough and
gallery data notes, lightbox instructions/original link, and the local-storage caveat. Animation code
no longer references the deleted hint; dialog semantics retain a valid title without a dangling
description reference. The hand, story data, device filtering, and app source remain unchanged.

## Deploy with Netlify drag and drop

1. Create a **separate** manually deployed Netlify site for the landing page. Do not upload it to
   the existing application site.
2. Drag this `landing/` folder into Netlify's manual deployment area. `index.html` must be at the
    uploaded site's root, beside `styles.css`, `animations.js`, `scroll-story.js`, `offline.js`,
    `service-worker.js`, `favicon.svg`, and
   the complete `components/`, `utils/`, `constants/`, `fonts/`, and `images/` directories.
3. Netlify serves these ready-made static files; no build command is needed.
4. Confirm the app-entry links open the expense application.
5. For later landing changes, bump the worker's `CACHE_VERSION` and upload this whole folder again
    to the same landing site. Open landing tabs refresh automatically after a complete update installs.

The app's existing Git-triggered deployments are independent. Pushing the repository does not
automatically update a manually deployed landing site. A `netlify.toml` file is not needed for this
manual deployment; configure its domain and site settings in Netlify's dashboard.

## Preview and verification

For a basic local look, open `index.html` in a browser; the page has no external runtime dependencies.
Browser automation, servers, formatting, and other verification require explicit user approval
under the project's execution policy. **The new native scroll animation has not been verified.**
No formatting, syntax checks, tests, servers, browser automation, dependency installations, or
deployment ran for this work. The approved asset-only batch copied the existing app font and fetched
its license; this is not verification. Scroll reversal, actual-node docking/undocking, phone panning,
notebook/phone alignment after app-font loading, phone text/settlement fit, narrow/tablet/short
viewports, keyboard skip/CTA behavior, motion toggling, no-JavaScript fallback, and physical-device
performance remain pending. Hand artwork and the rest of the landing were not changed for this UI pass.
The later gallery-only pass ran its approved eight-PNG copy batch and updated HTML/CSS/documentation.
The subsequent compact-card/lightbox redesign edited HTML/CSS/JavaScript and documentation only;
no commands, verification, image processing, installation, or deployment ran for that redesign.
Compact layout, lightbox navigation/device switching, backdrop/Escape closure, keyboard focus,
touch scroll locking/restoration, image-load failure, original links, short/narrow/tablet/desktop
rendering, and no-JavaScript/reduced-motion behavior remain unverified. Earlier checks below do not
verify the current gallery or animation.
The copy-cleanup/offline-cache pass also ran no commands, checks, installs, servers, or deployment.
Removal-related animation/dialog behavior, precache completion, first-visit control, offline entry
URLs/all screenshots/fonts, automatic same-visit updates, scope isolation, and install/storage failures
are explicitly pending. Editing approval is not permission to run those checks.
The automatic-update pass also ran no commands, browser checks, or deployment. Startup detection,
legacy-page refresh, multiple-tab refresh, first-install/no-change loop guards, update failure,
and preservation of query/fragment URLs remain unverified.
The initial version was not verified. Before the content revision and this font pass, the receipt
design had the following approved, landing-only results from 2026-10-10:

- `node --check landing/animations.js` passes.
- Eleven Chromium scenarios pass: widths 280, 320, 390, 768, 1024, 1440, and 1920px; touch landscape
  at 844×390; short desktop at 1280×600; reduced motion; and JavaScript disabled.
- The nine viewport scenarios check horizontal/header overflow, app-entry URLs and absence of a
  landing manifest, five split methods and exact intermediate totals, keyboard FAQ/demo operation,
  desktop story stages or normal-flow fallback, the motion toggle, and fine/touch pointer behavior.
  No browser errors or horizontal overflow were found.
- Reduced motion disables animation while keeping the split demo functional. Without JavaScript,
  primary content, app links, and native FAQs remain available; demo controls stay disabled.
- Prettier formatted `index.html`, `styles.css`, and `animations.js`. The approved four-file command
  exited with code 2 because it cannot infer a parser for `favicon.svg`; the SVG was not formatted
  by that command. No alternative parser or retry was run.

Screenshots and machine-readable results: `/tmp/opencode/landing-redesign/`. The temporary local
server was stopped after verification. No application builds, application tests, or installations
were run. These results do not establish Safari/Firefox coverage, real-device performance, or
deployment-specific behavior. Future checks and formatter retries require fresh explicit approval.

The discarded rebrand had a separate approved formatting/syntax pass and three completed browser
scenarios at 280/320/390px before the user stopped the batch. The interruption caused a browser
context cleanup error; it was not a completed eleven-scenario run. Those partial artifacts under
`/tmp/opencode/landing-rebrand/` do not apply to the restored page or these new fonts. No retry ran.
The approved font acquisition for this pass is not permission to resume that verification.

## Next phase: SEO

SEO work is explicitly deferred until the page is built and reviewed. The current title and viewport
are basic page scaffolding, not a completed SEO implementation.

After approval, choose the landing site's production domain, then plan search-targeted copy,
description and canonical metadata, social-preview assets, appropriate structured data, sitemap,
crawler rules, Search Console setup, and indexing checks. Do not publish placeholder canonical URLs
or invented reviews, ratings, or usage statistics.

The app's own indexing policy has not been changed. App indexing controls, if wanted, are a
separately approved SEO task; the landing deployment does not automatically apply them to the app.
