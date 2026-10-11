---
name: product-roadmap
description: Living product direction and staged delivery roadmap for Split Slate
metadata:
  type: roadmap
---

# Product Direction and Roadmap

Purpose: provide a current planning compass without turning exploratory ideas into commitments.

Last updated: 2026-10-11

## How to Read This Page

This is a living roadmap, not a second specification or a blanket delivery contract. The explicitly
approved website-launch promises below are release conditions for the advertised launch product.
Detailed architecture and workflow pages remain canonical for their subjects, and implemented
source remains authoritative when it disagrees with any plan or marketing statement.

Roadmap terms have deliberate meanings:

- **Implemented** — observable in the current source and normal app flow
- **Approved** — agreed target behavior that is not necessarily implemented
- **Candidate** — useful direction that still needs prioritization or design
- **Decision required** — conflicting or incomplete designs must be resolved before implementation
- **Non-goal** — deliberately excluded from the stated horizon

The old “MVP / V2 / V3” labels are treated as historical grouping, not fixed version promises.
This page uses delivery horizons because prerequisites and product decisions matter more than a
version number.

## Product Compass

Split Slate is primarily a **clarity tool for shared expenses**. Personal tracking through solo
groups is supported, but it must not obscure the shared-expense identity. See
[[solo-group-support]].

The durable product principles are:

- **Shared expenses made simple:** a normal expense should be enterable in about five seconds once
  the group exists, and “who owes whom” should be understandable without manual arithmetic.
- **Local and private by default:** core data stays on the device. The current product has no
  account, backend, cloud expense history, or behavioral analytics dependency.
- **Core utility remains free:** adding expenses, using the approved split methods, calculating
  balances, working offline, and exporting owned data must not be artificially capped to force an
  upgrade.
- **Cloud is optional convenience:** future sync may be paid because it has recurring
  infrastructure costs, but it must not become a prerequisite for local expense sharing.
- **No mandatory traditional identity:** local use requires no email, phone number, or social
  login. A LocalUser and global device-local people directory provide local identity without an
  online account. See [[global-people-directory]].
- **The user owns the data:** portable, reconstructable exports and a usable recovery path are
  release requirements, not afterthoughts. See [[import-export]].
- **No payment processing:** Split Slate records expenses, balances, and repayments
  that happened elsewhere. It does not hold funds or become a bank or payment processor.
- **Complexity stays progressive:** common entry uses safe defaults; multiple payers, advanced
  splits, filtering, attachments, and other controls appear when requested.

Open-source distribution remains a product intention, not a current legal fact. The repository has
no license file, so a license and contribution policy must be chosen before claiming that a public
release is open source.

## Current Foundation

The following foundation is implemented now:

- React application shell with responsive dashboard and nested group routes
- Dexie/IndexedDB persistence hydrated into a single Zustand store
- Resumable first-run onboarding and standalone group creation
- One device-local user plus a reusable global people directory
- Solo and multi-member groups with one configured currency per group
- Group categories, group tags, and their current management guards
- Expense, split, transaction, tag, and attachment storage shapes
- Expense recording with five split types, one/multiple payers, optional tags, and local persistence
- Expense-list and group-overview surfaces showing saved records and balances
- Eight-field, group-local expense filtering with validated date and currency-aware amount bounds
- Selective versioned Link/typed-CSV/receipt-aware ZIP group transfer with validated editable import
  on fresh and existing devices
- Helpers for member/group totals, all-member balances, and suggested payments
- Expense detail, editing, and confirmed hard deletion with owned-attachment cleanup
- Group-only recording, correction, deletion, and portability of external payments with
  payment-aware balances; spending analytics remain expense-only

Expense creation/correction/removal, minor-unit accounting, split calculation, payer ranking, and
all-member balance suggestions are implemented. Member reference checks and directory self-deletion
protection complete the Horizon 1 implementation list. Attachment ingestion remains pending;
external payment recording is implemented. Current detail lives in [[index]], [[domain-models]], and
[[main-screen]].

## Next Tasks

### Standalone Landing Page — native scroll story, checks pending 2026-10-11

The approved marketing entry point lives in `landing/` in this repository, but is deployed as a
**separate manually uploaded Netlify site**. Its HTML, CSS, SVG, and local JavaScript need no build or framework.
App-entry links currently open `https://split-slate.netlify.app/`; the app's existing Git-triggered
deployment remains separate. Future landing updates require another manual upload.

The landing page must never become part of the expense app's installed PWA: it has no manifest,
application imports, or app navigation entry. The user has now approved a separate landing-only
service worker for offline access, superseding the previous no-service-worker restriction. Keep
the landing outside `public/` and the app build output;
the current app routes, launch behavior, and offline cache remain unchanged. Preserve the existing
app origin because browser-local expense data does not automatically follow a domain change.
Sharing a repository does not require sharing a browser origin or deployment.

**Earlier direction:** the user preferred the earlier design after seeing the reference-informed
rebrand. They liked its animations in isolation but considered the combined UI/motion overkill for
this product. With explicit approval, the five landing files were restored exactly from local
checkpoint `5cdbf6a`, and the rebrand's two WOFF2 fonts and two license files were removed. Research
was retained rather than reset. See [[competitive-landscape]] for the product-fit lesson.

That restored baseline used warm-paper/violet/lime receipt artwork, “Go halves. Stay whole.”,
scroll-driven gather/split/repay scenes, and an interactive five-method split demonstration. The
restored JavaScript conserves its ₹1,200 total during numeric transitions, never saves app data,
and retains device reduced-motion handling, the page motion toggle, hidden/offscreen animation
suspension, and touch/narrow/short-viewport fallbacks. Links and native FAQs work without JavaScript.

After restoration, the user approved a typography-only refinement: **no italics and at most three
font variants**, without requiring the suggested Montserrat/Clarity City/Roboto Slab families.
The implemented choice is two self-hosted families and exactly three configured upright faces:
Manrope Regular 400 for body copy; Manrope Semibold 600 for controls, labels, identities, and money;
Zilla Slab Semibold 600 for main/display headings. The two Manrope declarations share one variable
WOFF2, while Zilla Slab has one static WOFF2. Both upstream SIL OFL notices accompany the Latin
assets in `landing/fonts/`. Only generic fallback families remain for load failure/missing glyphs.
No monospace family, italic styling, intermediate weight, or synthetic font face is requested.

The historical font pass changed `landing/styles.css`, added local preloads to `landing/index.html`, and
documents the assets. Text size/spacing/line-height are refined; layout, palette, copy, animation
script, and favicon remain the restored baseline. Competitor-informed travel/roommate/meal examples
and practical payer/split/currency/export FAQs remain. Promise anchors are preserved; the workflow
is again under `landing/index.html#the-good-part`. App/PWA source, icons, origins, and build/cache
boundaries are unchanged. Checkpoint `5cdbf6a` remains local and was not pushed.

**Current source typography:** before the 2026-10-11 animation task, the landing changed to three
configured upright faces: Montserrat Regular 400 (`--font-description`), Saira Bold 700
(`--font-heading`), and Space Grotesk Semibold 600 (`--font-subheading`). Local preloads match these
files. The earlier Manrope/Zilla Slab notes are historical, not a description of current CSS.
This task preserves current role variables, files, and palette; unused font assets remain.
No fourth handwriting font is added: handwritten glyphs are original monoline SVG paths.

**Approved animation direction (2026-10-11):** the user supplied a notebook-to-phone story and then
explicitly rejected React, build tools, installation, and a build process. The implementation is
plain local HTML/CSS/JavaScript with no GSAP, ScrollTrigger, vendor download, or runtime CDN.
The user approved the listed landing-file changes and related wiki updates. Drag-and-drop Netlify
deployment and all app/PWA origin/build/cache boundaries remain unchanged.

The opening `landing/index.html#expense-story` now has one continuous sticky sequence:
handwritten expenses and overlapping corrections → question/slash and a scroll-space pause →
entries lifting into the phone → equal splits and suggested repayments → “Less calculating.
More living.” with an app-entry CTA. The same four label/amount elements travel from notebook
anchors to phone slots; their SVG strokes transition into upright digital text while moving.
The hand's nib follows sampled points on the actual drawn paths rather than unrelated pen motion.

After user approval, the illustrated phone now follows the supplied actual mobile Overview design,
rather than the initial simplified arrangement. It reproduces Back to dashboard, group identity
and member/expense/total/currency summary, the purple position hero, At a glance/Add expense,
Members with chips/Manage Members, Suggested transfers with View all balances, and Recent
transactions with category/equal metadata and amounts below their titles. White rounded cards,
lavender surfaces, and the five-item Overview/Expenses/Add/Members/More footer follow the reference.
The top Add expense pill follows the supplied screenshot, not a guarantee about every current
app breakpoint. No app components, stores, routes, or database are imported. It remains an
illustration, but the user requested removal of its visible walkthrough note; the screenshot
gallery is separate. Dinner
is $120 paid by Maya and Taxi is $30 paid by Leo. Maya, Leo, and Nina share both equally.
Independent integer-cent allocations derive $150 total, $50 each, Leo → Maya $20, and Nina → Maya
$50. The total changes only at completed expense entry; suggestions do not execute payments.

The viewer is Maya. Her derived position is $0.00 before entry, +$80.00 after Dinner, and +$70.00
after Taxi, with matching group totals and counts. Digital money has two decimal places, matching
app presentation without changing the example's numbers. Emoji avatars use fictional people.

**Approved phone-only typography exception:** Plus Jakarta Sans was copied from the app's existing
WOFF2 to `landing/fonts/plus-jakarta-sans.woff2`; its upstream SIL OFL notice is deployed beside it.
The local face (`Split Slate App`, normal 400–800) applies only to the phone and travelling digital
entry text. Landing role variables remain Montserrat/Saira/Space Grotesk; no handwriting font,
runtime font request, build dependency, or app-origin asset dependency is added.

The phone preserves card order Members → Suggested transfers → Recent transactions. Its fixed
header/footer surround a clipped document that pans to entries, then back to suggested transfers,
using the same reversible page-scroll timeline. The actual four travelling label/amount nodes dock
inside that document after flight so clipping/panning works naturally; reverse scroll returns the
same nodes to paper. Their geometry is cached on layout/font changes, including the dynamically
used app font. This UI pass leaves the hand artwork and all other landing sections unchanged.

`landing/scroll-story.js` drives a cached-geometry native scroll scrub with a short 65 ms smoothing
constant. `components/scroll-story/index.js`, `components/workspace/index.js`, and
`components/story-phone/index.js` compose the scene; `utils/story-timeline.js` owns reversible
choreography and `constants/story-data.js` owns fictional accounting. Deferred classic scripts
share one small namespace and require no module server or compilation. Geometry and glyph
samples are recaptured on resize/font readiness, not on each scroll frame.

Desktop travel is 3.65 viewport heights plus the sticky frame (approximately 4–5 total); compact
layouts at widths ≤56rem use 2.45 heights and simplified artwork. Normal scrolling is preserved.
A skip-story link reaches the following gallery. Reduced motion, the page motion toggle, short
usable heights (<510px compact / <440px desktop), and initialization failures select the static
HTML ledger. Hidden controls are inert; assistive technology has a persistent plain-text story.
Frame work stops when settled/offscreen/tab-hidden. The remaining workflow, split demo, FAQs,
promise anchors, and app links are preserved.

The user approved **launch-state copy**: planned group synchronization is advertised in present
tense, without development-status disclaimers. The app still has no implemented live sync; the
website-launch ledger below records that discrepancy intentionally and gates public release until
delivery. Copy does not promise payment processing, free sync, a particular sync identity model,
or unapproved competitor capabilities. Local no-account and free-core wording is scoped to local
use rather than implying that all online functionality has the same access/pricing rules.

SEO remains deferred; neither app indexing controls nor production landing-domain metadata changed.
The basic document title now matches the final reveal, without introducing production-domain SEO.

**Approved supplied-screenshot gallery pass (2026-10-11):** eight unedited user-provided PNGs from
`/home/rinturj84/Pictures/Screenshots/Screenshots` now populate the separate actual-app gallery.
They replace its three desktop assets and add the absent mobile captures, using kebab-case names
inside `landing/images/`. The gallery descriptions now reflect Maldives Trip and its captured
expense/payment records rather than the earlier Weekend in Goa/breakfast placeholders. Overview
and balances show different states around a recorded repayment, not one synchronized live session.
The source images are preserved; deployed assets have no dependency on the external source folder.

Expense and settlement each have two mobile images labelled Part 1 of 2 and Part 2 of 2, representing
different scroll positions. Overlapping content and fixed headers/footers remain separate, not a
synthetic stitched full page. The initial gallery showed large inline desktop/mobile captures; the
user rejected its excessive page footprint while retaining the need for screenshots.

**Approved compact gallery/lightbox replacement:** three small Overview/Add expense/Settle up cards
now expose the screenshots without dominating the page. Thumbnail windows are 150px on desktop,
115px on tablets, and 90px beside copy on narrow screens. Selecting a card opens a native `<dialog>`
with a contained, uncropped image. At widths up to 56rem a card starts with its first mobile capture;
otherwise it starts with desktop. The approved device filter is **All / Desktop / Mobile**, resetting
to All on every open. All includes eight images, Desktop three, and Mobile five. Thumbnails,
previous/next buttons, Left/Right keys, and announced positions/totals use only matching images;
browsing wraps within that set without changing the filter. Filter changes keep the selected image
if it matches, otherwise select a matching capture of the same screen or the first result. Screen
buttons jump to Overview/Add expense/Settle up within the device filter, not a separate narrowed set.
The rail and counter/caption retain labelled mobile parts. The user subsequently requested removal
of the lightbox's Open original link and explanatory footer. The rail hides on short viewports with
primary navigation retained. No autoplay is introduced. The filter update ran no commands or
verification; browser behavior remains unverified.

Native modal semantics make the background inert. Tab is constrained to dialog controls; close via
button, Escape, or a pointer click starting and ending on the backdrop restores opener focus and
page position. A fixed-body scroll lock also preserves prior inline body styles. Image errors suggest
another image or reopening the gallery. Without JavaScript/native dialog support, cards are direct PNG
links and expandable Mobile capture lists expose the remaining originals; successful enhancement
hides those lists. Modified link clicks remain native. `components/screenshot-gallery/index.js` is
an independent local classic script; obsolete preview-tab logic was removed from `animations.js`.

The eight-file asset-copy batch ran in the earlier gallery pass. No commands, browser/layout checks,
formatting, installs, image processing, or deployment ran for this compact redesign. Modal closure,
navigation/device/part handling, focus, touch scroll restoration, load-error handling, links, and
responsive/reduced-motion/no-JavaScript behavior remain unverified. The animation/hand, app/PWA,
manual Netlify boundaries, and assets are unchanged. Asset mapping is in `landing/README.md`.

**Approved copy cleanup and offline landing (2026-10-11):** the user requested removal of the opening
scroll hint and icon, illustrated walkthrough note, screenshot data/context notes, lightbox
instructions/Open original link, and local-storage caveat. All seven UI items are removed, their
unused styles are removed, and the story timeline no longer accesses the deleted hint. The dialog
retains its accessible title without a dangling `aria-describedby`; filtering/parts and the hand
are preserved. These removals do not turn illustrations into live functionality or change browser
storage durability. Existing backup capability and launch-promise tracking remain unchanged.

**Approved small-mobile follow-up:** the user reported that the animated phone overlaps the final
“Free core features. No account needed for local use.” sentence. The sentence and its unused
desktop/mobile styles are removed rather than adding spacing to the fixed composition. The final
CTA and hand/phone animation remain unchanged. This removes that overlapping text; it is not a
verified fix for every possible narrow-screen overlap. That change bumped `CACHE_VERSION` to
`2026-10-11-v2`; the later automatic-update policy below supersedes its waiting-worker activation.
No commands, browser checks, or deployment ran; other mobile-layout checks remain pending.

`landing/offline.js` now registers/checks `service-worker.js` during page startup on secure HTTP(S) only. Scope
is the script directory, and an existing different worker at that exact scope is not overwritten.
The worker precaches 24 explicit files: HTML, CSS, nine runtime scripts, favicon, four active fonts,
and all eight screenshots, including unopened mobile parts. Installation fetches the complete set
before writing, rejects failed/redirected/HTML-fallback asset responses, and rejects/removes a new
cache if writes fail. HTML is fetched at the directory entry to avoid static-host `index.html`
redirects; both navigation aliases share it offline. A completed snapshot serves root/index
navigation (including query strings)
and listed same-origin GET assets cache-first; other navigation, origins, API/data, and app assets
are not intercepted. Missing entries can be repaired online; failure does not cache error pages.

Cache names include the exact scope and version. Every landing HTML/CSS/script/font/screenshot
release must bump `CACHE_VERSION` and upload the entire folder. Registration bypasses the worker
script HTTP cache, and existing matching registrations explicitly check with `update()` at startup.
The user approved automatic same-visit refresh instead of waiting for controlled tabs to close.
After all snapshot files and metadata are stored, `skipWaiting` activates the update immediately;
activation removes only outdated caches for this scope, claims clients, and requests one navigation
of each controlled root/index landing page. Other routes and app pages are not refreshed. The
actual query/fragment URL is retained; transient gallery/demo state may reset. The worker owns
navigation, supporting older landing code without an update listener. Navigation promises are not
awaited by activation because their fetches need activation to finish.

The current version is `2026-10-11-v3`. A private Cache Storage metadata entry records whether an
active worker existed during installation, survives worker suspension, and is consumed before
refresh. First installation and unchanged/restarted workers do not trigger repeated reloads.
Offline/failed installs keep the old worker without refreshing. The old snapshot may show briefly
while downloading; the visitor must remain on the page through installation. Rejected navigation
is logged without retries. There is no periodic background poll or update guarantee for a departed
visitor. Automatic-update behavior and loop guards remain unverified; no commands/checks ran.
The earlier no-service-worker rule is superseded for this separately deployed website only, not the
expense app/PWA origin, build, cache, routes, or storage. There is still no manifest/install prompt,
framework, dependency, or build step.

Offline requires a prior successful online installation, secure serving, and retained browser cache;
`file://`, a cold offline visit, storage clearing/eviction, unsupported/private restrictions, and
failed installs are not covered. The external app links still require that app's own availability.
No commands, verification, server, install, or deployment ran for this pass. Removal regressions,
complete precache/offline reloads, image/font availability, automatic-update transitions, scope isolation,
and fetch/storage failure behavior remain pending. Details are in `landing/README.md`.

**No formatting, syntax checks, tests, browser runs, server starts, installations, or deployment
were performed for the native story or mobile-UI pass.** Only the approved font-copy/license-fetch
asset batch ran. Actual-node docking/undocking, phone panning, scroll reversal/alignment,
font-load/responsive fit, phone settlement visibility, keyboard/skip/CTA behavior, motion toggling,
static fallback, and real-device performance remain unverified. Earlier restoration/font checks
also remain unrun. Unrelated app verification does not verify this landing implementation.
The stopped rebrand verification is not authorization for a new batch; approval is still required.

Historical coverage: before the copy pass, the receipt design passed syntax and eleven scoped
Chromium scenarios at widths 280–1920px, touch landscape, short desktop, reduced motion, and
JavaScript disabled. Those artifacts remain under `/tmp/opencode/landing-redesign/`; they predate
the later copy and fonts. The discarded rebrand's three-source-file Prettier and JavaScript syntax
commands passed; browser scenarios at 280/320/390px completed before the user stopped the batch.
The interruption produced a browser-context cleanup error, not a complete eleven-scenario result.
Its partial artifacts under `/tmp/opencode/landing-rebrand/` do not apply to the current page.

The separate external-reference review completed eight desktop/mobile captures under
`/tmp/opencode/brand-reference-review/`, with Vibor video/Raven loader limitations recorded in
[[competitive-landscape]]. The old SVG formatter parser failure was not retried. No app builds,
app tests, deployment, or push ran for this work. The landing implementation and local assets
were committed separately in `8e39f27` (`feat(landing): add scroll story, screenshot lightbox, and
offline updates`), containing only `landing/`. Accumulated landing wiki history is included with
the later approved app/wiki conflict reconciliation; no landing files change in that follow-up.
Deployment instructions and pending checks are in `landing/README.md`.
See [[layout-architecture]], [[mobile-pwa-install]], and [[testing-strategy]].

### Website Launch Promise Ledger

Purpose: distinguish what `landing/index.html` advertises for launch from what the current app
implements, and keep every unfinished promise visible across sessions.

**Policy approved 2026-10-10:** keep the name Split Slate; use present-tense copy for approved launch
features; publish the launch product only when all advertised capabilities are available. This
policy is not authorization to run checks, deploy, or implement other features. The ledger is
canonical; the landing README links here instead of maintaining another checklist.

Status terms:
- **Implemented:** current code supports the capability; deployment/release evidence can still be pending.
- **Partial / release evidence pending:** relevant foundations exist but the promise is not fully cleared.
- **Not implemented:** launch commitment exists, but implementation and its verification are outstanding.

#### Unfulfilled Launch Promises

| ID | Exact advertised claim and location | Current status | Remaining work and required release evidence |
|----|-------------------------------------|----------------|---------------------------------------------|
| SYNC-01 | “Share a group and keep its expenses and balances up to date across connected devices.” — `landing/index.html#group-sync`. Also sharing in chapter 1, updated synced-group balances in chapter 3, and “In a synced group, expenses and balances update across connected devices.” in `#live-group-updates`. The 2026-10-11 story replaces the old hero's “keep your group in sync” wording without removing these other claims. | **Not implemented.** Current groups and records are device-local; exports reconstruct separate editable groups and are not live synchronization. | Approve access/identity/invitation, server-visibility/security, pricing, membership, and conflict rules. Implement authorized shared-group expense/payment updates, balances, edit/delete propagation, and reconnect handling without making local use depend on a server. Verify two participating devices see consistent records and balances; verify concurrent changes, revoked/unauthorized access, offline work/reconnection, failure handling, and no data loss. No implementation or sync verification occurred in this content pass. |
| SYNC-02 | “Open a synced group on another device to pick up its shared expenses and balances.” — `landing/index.html#new-device`. | **Not implemented.** Depends on SYNC-01 and approved cross-device access. Existing ZIP restore is a separate implemented local recovery path. | Design how a user gains authorized access on a new device; implement reopening an existing shared group without duplicating it or losing its history. Verify fresh-device access, correct expenses/payments/balances, and rejected unauthorized access. Do not infer whole-app settings, all local groups, automatic backups, or loss-recovery promises from this narrower claim. |

#### Supported Claims and Remaining Release Gates

These are current-source baselines, not proof that every release condition is already cleared.
Recheck them when the sync implementation or public wording changes.

| Advertised capability and location | Current baseline | Release requirement |
|-----------------------------------|------------------|---------------------|
| Create groups, add people, record shared costs — chapter 1 and local-start FAQ. | **Implemented:** local profile, global people directory, group setup, expense recording. See [[onboarding]], [[group-creation]], and [[member-management]]. | Keep no-account wording true for local use when sync is added; verify the launch setup/participation flow and existing local-data preservation. Sharing behavior is separately blocked by SYNC-01. |
| “Equal amounts, exact amounts, shares, percentages, or adjustments” — split section and `#unequal-splits`; selected expense participants. | **Implemented:** all five methods with exact money allocation and participant selection. See [[split-types]]. | Verify create/edit results, selected-member handling, valid totals, and rounding in the release version; preserve the honest distinction between the illustrative demo and real app. |
| “Record each payer’s contribution to the same expense” — `#multiple-payers` and chapter 2. | **Implemented:** single/multiple payer contributions separate from owed allocations. See [[paid-by]]. | Verify paid totals equal owed totals and contributions survive editing/import; verify synced expense propagation after SYNC-01 is built. |
| Compare paid/share amounts, account for repayments, and suggest who owes whom — chapter 3 and `#balance-calculation`. | **Implemented:** payment-aware balances and deterministic suggested transfers; illustrated ₹9,000/₹2,400 example is arithmetically consistent. See [[balance-calculation]] and [[settlement-recording]]. | Verify expense/payment edits and deletes remain consistent across local and synced views. No globally minimum-transfer or in-app money-transfer guarantee is advertised. |
| Free expenses, five split methods, balances, offline use, and exports — hero and `#free-core-features`. | **Implemented for current local use; approved core-free principle.** No paid entitlements or expense caps exist in the current app. | Preserve these capabilities without forced subscriptions/caps at launch. Online pricing is undecided and is not included in the free-core promise. |
| Local device storage without an account; share when chosen — privacy introduction and account FAQ. | **Implemented local foundation; optional sharing is blocked by SYNC-01.** See [[state-management]] and [[global-people-directory]]. | Preserve local-first use and intentional sharing when cloud capability is added; make the final data-handling disclosure match the approved sync architecture. No end-to-end encryption or zero server visibility is promised. |
| Offline expense entry and balances once files are ready — `#offline-use` and offline FAQ. | **Partial / release evidence pending:** offline shell and production-emulated checks exist; deployment update/storage behavior remains a release gate. See [[mobile-pwa-install]] and [[product-roadmap]]. | Clear the existing PWA release checks and verify local use without a network in the final build. Resolve interactions with synced groups/reconnection without claiming that online delivery happens while disconnected. |
| Group Link/CSV/ZIP exports and whole-app ZIP backup/restore — `#exports-and-backups`, `#portable-data`, and local-device portion of `#new-device`. | **Implemented:** versioned group snapshots and whole-app backup/restore. See [[import-export]] and [[full-backup]]. | Verify release round-trips; determine how snapshots/backups of synced groups behave without silently changing ownership or promising automatic sync via an exported snapshot. |
| One currency per group; relabeling does not convert saved amounts — `#group-currency`. | **Implemented.** See [[money-representation-and-rounding]]. | Preserve the single-currency/no-conversion contract in the launch product. Mixed-currency entry/conversion is not committed by competitor inspiration. |
| Install from a supported browser; installed app excludes this website — `#install-app` and installation FAQ. | **Partial / release evidence pending:** install metadata/prompts and automated PWA coverage exist; deployment-specific gates remain. See [[mobile-pwa-install]]. | Verify deployed manifest/service worker/install flow and application-only launch. Do not integrate landing assets into the app build, manifest scope, or PWA cache. |
| Payments occur externally and are recorded in the group — chapter 3 and payment FAQ. | **Implemented boundary:** no money custody or transfer; offline repayment records exist. See [[settlement-recording]]. | Keep copy and actual behavior consistent; verify repayment recording in the synced launch version without implying payment execution. |

#### Ledger Maintenance and Publication Gate

1. Before adding a launch claim, obtain feature/copy approval; record exact wording and every
   location, including implication changes to local/free/privacy wording.
2. For each unfinished claim, preserve its actual source status, remaining design/work, and evidence
   needed to clear it. A website sentence, demo animation, or roadmap entry never proves delivery.
3. Update this ledger, [[index]], and [[log]] together after approved claim/status changes. Do not
   silently mark sync, privacy, recovery, or installation ready based on another feature's checks.
4. Before public release, clear SYNC-01/SYNC-02 and every applicable release requirement above,
   review the entire page for unsupported promises, and approve the publication decision.
5. Formatting/browser/deployment verification and any retries need explicit approval under
   [[testing-strategy]]. The user stopped rebrand verification and approved restoration/typography
   without new checks. Its interrupted results do not apply to the restored launch-copy/font
   revision or advertised synchronization. Historical receipt-design results predate those changes.

### Narrow-Mobile Root Scaling — automated coverage complete 2026-10-10

The 2026-10-08 pre-scaling browser suite verified mobile expense-form scrolling, the final split
row, and Save/Cancel access. A subsequent rem refactor now scales the root from 16px at widths of
400px and above to a bounded 14px minimum on narrower viewports. The 2026-10-10 full post-scaling
browser suite passes 314 cases with 18 expected project-specific skips and no failures, including
expense-form scrolling and responsive regression coverage. See [[layout-architecture]], [[main-screen]] and
[[testing-strategy]].

### Browser-Suite Failures — pre-scaling baseline cleared 2026-10-08

The 2026-10-04 full Playwright run passed 118 tests, failed 30, and skipped 18 viewport-specific
cases. The 14 group-transfer failures looked for a questionnaire without opening the now-collapsed
**Export group** panel in Settings; the rest were assertion drift against current dates, balances,
dialogs, and scroll behavior. All were repaired as test/UI mismatches rather than product
regressions, and the 2026-10-05 full run passed 154 tests with no failures. Reopen this item only
for a new suite regression. See [[testing-strategy]].

The subsequent 2026-10-08 pre-scaling run passed 207 cases with no failures and 19 viewport-specific
skips after current assertion drift, timezone assumptions, timeline sorting, desktop Add-tag
visibility, and document-scroll leaks were repaired. The later root-scaling changes now have passing
builds and the 2026-10-10 full-browser run: 314 passes, 18 expected project-specific skips, no failures.

### Group Duplication

Add a same-device **Duplicate group** flow. It should reuse
the export questionnaire's content choices and dependency behavior: group information is required;
categories, tags, members, expenses, and available receipt attachments can be selected under the
same inclusion rules. Instead of generating a Link, CSV, or ZIP, the chosen content is cloned into
a separate local group. The source group remains unchanged. This is planned, not implemented;
identity handling, record-ID remapping, and other clone-write details need design during
implementation. See [[import-export]].

## Horizon 1 — Complete the Core Accounting Loop

**Goal:** a user can record, understand, correct, and remove shared expenses without leaving the
device.

The following Horizon 1 work is implemented:

1. Implement [[money-representation-and-rounding]] in currency input, calculation, validation, and
   formatting utilities.
2. Build pure split calculators for equal, amount, shares, percentage, and adjustment splits. See
   [[split-types]].
3. Expense create and update validation that enforces
   `sum(paid[].amount) == sum(owes[].amount)` using integer minor units.
4. Build the fast expense-entry flow with one or multiple payers, selected participants, category,
   optional tags, and an editable expense date. See [[paid-by]].
5. Expense detail, edit, and confirmed hard-delete behavior. See [[expense-edit-delete]].
6. All-member net balances and deterministic greedy transfer suggestions. The view labels them
   as suggestions that do not record payments. See
   [[balance-calculation]].
7. Member management with atomic duplicate-membership and referenced group/person existence
   checks, local-user member removal protection, and persisted directory self-deletion protection. See [[member-management]].

Five-second entry is an acceptance benchmark for the common case, not permission to skip
validation. Current defaults are the most recent recorded payer, equal split across all current
members, today's local date with the time left blank until entered or explicitly filled, and the
first active category. Remembered participants and other choices remain candidates; usability work
must establish the entry-time benchmark.

## Horizon 2 — Make the Local Product Safe to Release

**Goal:** local data survives ordinary use, remains portable, and works without a network after the
app is installed.

Approved or required work:

- The eight expense filters, stale-option cleanup, direct desktop/mobile filter coverage, and
  detail display are implemented. Mobile expense-form scrolling and narrow-mobile root scaling
  pass the 2026-10-10 full post-scaling browser suite.
- Finish category activation/deactivation controls; active-category expense-picker behavior is implemented.
- Implement receipt attachment ingestion, compression, and lazy loading; expense-deletion cascades are implemented.
- Continue hardening the implemented Link/CSV/ZIP editable snapshot transfer in [[import-export]].
  Selective export, integrity validation, fresh-ID atomic import, identity mapping, and
  receipt-aware ZIP round-trips are implemented. Merge and synchronization are deliberate non-goals.
- Whole-app local ZIP download and validated replace-only restore are implemented for fresh and
  existing devices, including receipts and app settings; see [[full-backup]]. Google Drive backup
  and synchronization remain outside this local scope.
- Add explicit backup/export reminders without making them spammy.
- Installable metadata, production service-worker app-shell caching, offline deep-link launch,
  separate resumable icon caching/repair, and a waiting-update prompt are implemented. Production
  desktop/mobile-emulated browser checks cover offline startup, icon repair, and the prompt UI;
  a true two-deployment update rehearsal and storage-pressure checks remain release gates.
  Updates do not force-reload an open session; users can postpone while finishing unsaved work.
  After all app windows close, the browser may activate a waiting worker before the next launch.
  A failed shell download must leave the older worker running. Icons are independently verified
  and replaced without resetting the shell or IndexedDB. See [[iconography]].
- Replace the active-development reset policy with versioned migrations before real user data is
  expected to survive application upgrades. See [[indexeddb-schema]].
- Add automated tests around accounting invariants, split rounding, cascades, import validation,
  migrations, and the most important user flows.
- Database bootstrap failures now show a reload/backup-restore path rather than waiting indefinitely.
  User-facing persistence failure handling on every write remains a release gate.

Snapshot transfer remains the local sharing model in this horizon. It is not synchronization: no
real-time updates, background merge, or automatic conflict resolution is promised.

## Horizon 3 — Local Insight and Convenience

**Goal:** make accumulated local data more useful without introducing a required server.

Candidates, ordered roughly by dependency and user value:

- Expand the implemented dashboard summaries, saved-action Activity view, Unsettled route, and
  category Analytics page; restore an Analytics entry point on narrow mobile screens. Current
  action snapshots do not reconstruct changes made before the activity table existed. See
  [[dashboard]].
- Add group and solo-group analytics by category, time, and date range.
- Add recurring-expense templates with an explicit choice between confirmation and automatic
  creation.
- Add restrained local reminders for recurring items, unsettled balances, and backups.
- Offline repayment recording is implemented per group; cross-group allocation and netting remain deferred.
- Design settlement-specific human sharing (Link/PDF/Excel) separately from reconstructable group
  transfer after the settlement data model is approved.
- Consider cross-group balances between the same global Person only after per-group balances are
  trustworthy.

### Offline Repayment Recording — Implemented

The user can record partial, full, or above-suggestion payments made outside Split Slate, scoped to
one group. Payment records adjust balances without rewriting expenses, have optional tags but no
category, and can be edited or deleted. Group transfer includes them when Expenses is selected;
whole-app backups preserve them. Cross-group allocation, netting, conversion, and sync remain
deferred. See [[settlement-recording]] and [[main-screen]].

Any future Link/PDF/Excel settlement output is a human-readable balance or repayment summary. It
must not be conflated with [[import-export]], whose purpose is reconstructing an editable group on a
different device.

## Horizon 4 — Optional Online Convenience

**Goal:** add multi-device collaboration without weakening the local product or requiring
traditional personal identity.

Live group synchronization and connected-device continuity are **approved launch commitments**
because they are advertised in the approved landing copy; see the website launch promise ledger.
They remain unimplemented and require security, recovery, operational-cost, and product-design
decisions. Other items below remain candidates unless separately approved:

- Optional cloud group synchronization — approved launch target, not implemented
- Optional Google Drive storage for whole-app backup files (separate from live synchronization)
- Manually shared, expiring invite links and device-bound membership
- Conflict handling for concurrent expense edits and deletions
- Device loss, replacement, and privacy-preserving recovery
- Group roles, administrative controls, and read-only access
- End-to-end encryption or an equivalently explicit server-visibility model
- Sync of groups, people/members, categories, tags, expenses, attachments, settlements, and
  relevant configuration

Cloud sync is the leading paid-capability candidate because it creates recurring infrastructure
costs. Exact pricing, entitlements, invite identity, cryptography, and recovery are not approved by
this roadmap. See [[monetization-model]] for dated research inputs rather than committed packaging.

## Exploration — Not Committed

These ideas stay visible without entering the delivery queue:

- Item-level expense entry and receipt OCR; see [[itemized-split]]
- Bank, SMS, merchant, or subscription automation
- True mixed-currency expenses, exchange rates, and cross-currency balances
- A broader subscription-tracking mode
- Payment-app launch shortcuts, while still processing no money inside Split Slate
- Native/TWA packaging, self-hosting, and regional-language experiences
- Optional rewarded-ad credits; see [[rewarded-ads]]

Receipt **attachments** are not in this list: storing user-supplied images is already an approved
local feature. OCR that interprets those images remains exploratory.

## Explicit Non-Goals for the Local Horizons

- Mandatory accounts, email addresses, phone numbers, or social login
- Server dependency for adding expenses, viewing history, or calculating balances
- Real-time collaboration or automatic merging disguised as file import
- In-app custody or transfer of money
- Forced ads, intrusive interstitials, expense caps, or cooldowns
- Mixed-currency accounting without a separately approved conversion model
- Treating speculative premium features as prerequisites for core splitting

## Superseded Parts of the Historical Scope

The historical master-scope document remains useful discovery material, but these claims must not
be reintroduced:

- The current product name is **Split Slate**, not “Split Splate.”
- People are reusable device-local records linked into groups, not unrelated copies per group.
- The approved design has five split methods, not only equal, exact amount, and percentage.
- Group creation instantiates selected default/custom categories; it does not blindly create a
  fixed global list.
- Unreferenced categories can be guard-deleted; the store models deactivation of referenced
  categories, but no management toggle exists yet. Tags have their own lifecycle.
- Onboarding currently finishes at the dashboard. Last-opened-group launch behavior is not an
  approved current feature.
- Portable transfer is no longer CSV-only or read-only; selective Link, CSV, and ZIP snapshots create
  new editable groups with fresh group-owned IDs.
- Offline application caching and install metadata are implemented; multi-deployment release
  verification is still pending.

## Related

- [[index]] — navigation and current implementation-status summary
- [[domain-models]] — current entity shapes and enforced expense-creation invariants
- [[state-management]] — implemented persistence and mutation boundaries
- [[main-screen]] — current and target in-group experience
- [[import-export]] — approved local portability design
- [[market-opportunity]] — dated product research, not this roadmap
- [[monetization-model]] — dated packaging research, not approved pricing
