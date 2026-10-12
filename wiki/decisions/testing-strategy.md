---
name: testing-strategy
description: Test architecture, authoring protocol, and layer boundaries for Split Slate
metadata:
  type: decisions
---

# Decision: Testing Strategy

Purpose: keep accounting tests fast, make every implemented area verifiable, and reserve real
browser coverage for behavior that depends on browser storage, navigation, or offline capability.

Last updated: 2026-10-12

## Execution Permission — Highest Project Priority

The user controls whether and when verification and routine execution run. Agents must request
explicit approval before tests, builds, lint, type checks, formatting/auto-fixes, Playwright/E2E/PWA,
browser or screenshot automation, watch tasks, development/preview servers, tool installation,
or other routine session-start/task-completion execution. State the commands or bounded batch,
purpose, and expected duration when known; run only the approved scope in the current session.

- **No:** do not execute, retry, or substitute a command to bypass the refusal.
- **Wait:** do not execute; remind the user as requested and ask for approval later. Neither time
  passing nor a reminder grants permission.
- **Yes:** run only the approved scope. A bounded batch does not need approval for each included
  command; additions or retries outside its scope do. A later refusal or deferral overrides earlier
  approval for the affected work. Approval never carries into a new session.

Urgency, failures, pending work, release gates, definitions of done, and "must run first" notes
are reasons to explain a concern, not permission. Approval to edit or commit does not authorize
verification, formatting, installation, or server startup. Read-only inspection for the requested
task is distinct from executing those procedures.

This policy overrides conflicting project instructions and historical notes in `AGENTS.md`,
`CLAUDE.md`, and the wiki. Every command below is conditional on this gate. A denied or deferred
check stays explicitly unverified; do not claim it passed or block unrelated approved work merely
because it is pending. This preserves the user's control over time and the shared workspace.

## 2026-10-12 Audit Evidence — Not an Exhaustive Sign-Off

### Audit Closure and Commit Preparation

Purpose: provide the consolidated handoff for the completed automated audit, its repairs, executed
checks, retained limitations, and proposed commit scope. The detailed chronology below preserves
earlier failures and narrower evidence; it must not be read as a new authorization to run commands.

**Outcome:** discovered defects are repaired and the approved automated closure batches pass.
This is not an exhaustive manual audit or a product-launch sign-off. Commit preparation only edits
documentation; it does not implement remaining roadmap features or claim unrun checks passed.

#### Completed repairs and documentation

| Area | Completed work | Canonical detail |
|------|----------------|------------------|
| Monetary summaries | Exact BigInt cross-group dashboard/category totals, BigInt-aware decimal/currency formatting, and bounded presentation-only chart ratios. Stored amounts and validated form inputs remain safe-integer numbers; currencies are not converted or netted together. | [[money-representation-and-rounding]], [[dashboard]] |
| Payment editing and dates | Payment previews validate saved balances, then undo the edited payment with BigInt so intermediate overflow cannot break the editor. Shared local date serialization pads early years to four digits. Final persisted-net/input guards remain intact. | [[settlement-recording]], [[string-input-normalization]] |
| Persisted store guards | Person/member/category removal and category/tag name checks use current persisted records inside transactions, not stale hydrated snapshots. Cleanup preserves newer fields and transaction rollback includes activity. | [[state-management]], [[people-directory]], [[member-management]], [[category-management]], [[tag-management]] |
| Import intake | Pre-read file-size limits, streamed bounded decompression, actual-output and ZIP-directory consistency checks, and unique receipt-index IDs/paths. Invalid or oversized input is rejected before persistence. | [[import-export]], [[full-backup]] |
| Export safety | CSV/group ZIP/whole-app backup enforce import-compatible text/archive/expanded-size quotas; receipt sizes are checked before reading, and duplicate supplied group-export receipts are rejected. | [[import-export]], [[full-backup]] |
| Destructive warnings | Group and tag deletion warnings include recorded payments, matching the payment-aware cleanup behavior. | [[group-deletion]], [[confirmation-dialogs]], [[tag-management]] |
| Application regressions | Browser journeys use current Optional details and responsive Sort controls. Added regressions cover autofocus/draft preservation, added-date/payment order, Sort scrolling/focus/breakpoints, stale persisted state, concurrent writes, preserved current fields, rollback, monetary boundaries, and transfer quotas. | [[main-screen]], [[filtering]], and the chronology below |
| Landing repairs | Local clipping fixes decorative privacy-orbit overflow at 280px. Explicit SVG coordinate separators restore notebook-ring strokes. The worker snapshot version is `2026-10-12-v5`; first-frame story tests await font/geometry readiness and layout tests collect console errors as well as page errors. | [[product-roadmap]], `landing/README.md` |
| Repository reconciliation | Approved formatting/syntax normalization and source-backed corrections to architecture, schema, workflow, research, testing, and roadmap notes. The landing README now distinguishes verified behavior, retained limits, and local-only tests/docs excluded from runtime upload. | [[index]], [[log]] |

The repairs do **not** add automatic cross-tab UI synchronization, atomic standard multi-step group
creation, live cloud synchronization, or cross-device continuity. Existing file transfer remains a
fresh-ID snapshot import, not a merge or sync protocol. See [[state-management]] and [[product-roadmap]].

#### Final executed verification

These are recorded results from the completed approved runs, not commands executed again during
commit preparation. Logs listed below are under `/tmp/opencode/` unless otherwise stated.

| Command or bounded check | Recorded result | Evidence |
|--------------------------|-----------------|----------|
| `pnpm test` | **672 passed across 45 files** after the persisted-store/export repairs. | `audit-closure-final-unit.log`, `audit-closure-final-results.json` |
| `pnpm check` | ESLint, repository Prettier checks, and TypeScript pass, including the final audit documentation rerun. | `audit-final-documentation-check.log`, `audit-final-integrity-results.json` |
| `pnpm build` | Ordinary production build passes. | `audit-closure-final-build.log` |
| `VITE_ENABLE_DEVTOOLS=true pnpm build` | Devtools-enabled production build passes. | `audit-closure-final-build-devtools.log` |
| `pnpm test:pwa --output=/tmp/opencode/audit-closure-pwa-artifacts` | **18 passed** against the production application. | `audit-closure-final-pwa.log`, `audit-closure-final-results.json` |
| `pnpm test:e2e --output=/tmp/opencode/audit-closure-browser-stable-artifacts` | **580 passed, 44 viewport-specific skips, zero failures** in 22.8 minutes; 624 scheduled project/test combinations. Skips cover inapplicable layouts, with passing coverage in the appropriate project. | `audit-closure-stable-browser.log`, `audit-closure-stable-results.json` |
| `pnpm exec playwright test -c playwright.landing.config.ts --repeat-each=3 --output=/tmp/opencode/audit-closure-landing-console-artifacts` | **36 passed** in 3.3 minutes after the SVG/console-error repair: six scenarios, two Chromium projects, three repetitions each. | `audit-closure-landing-console.log` |
| `node /tmp/opencode/audit-landing-recovery.mjs` | **Seven passed** with a staged copy and standard static server: missing scripts/image, rejected missing-asset installation, manual entry eviction repair/offline guidance, and a two-revision update. | `audit-landing-recovery-static.log`, `audit-landing-recovery-static/results.json` |
| JavaScript syntax and TypeScript/JSONC parsing | **13 JavaScript/module syntax checks, 251 TypeScript syntax trees, and three JSONC configurations pass.** | `audit-closure-console-static-results.json`, `audit-closure-final-syntax.json` |
| File/hash/asset/wiki integrity and `git diff --check` | **738 files** (731 tracked plus seven new), **43 indexed wiki pages**, local Markdown/landing asset links, and whitespace checks pass. Unchanged-byte binary checks cover 382 PNG CRCs/decoded payloads, nine WOFF2 headers, ten WebP headers, and two PDF header/end markers. | `audit-final-file-inventory.json`, `audit-final-integrity-results.json` |

The unit/build/PWA closure batch kept source frozen. The final full-browser batch also recorded
`changed: []` for its non-wiki source snapshot. Only landing README/artwork/worker-version/test files
changed after that clean application run; the final integrity comparison found no `src/` changes.
Those landing changes have their own subsequent 36-case and seven-scenario verification above.
Forty loaded viewport captures at 280/390/820/1440/1920px supplement the tests with sampled visual
review; they do not establish pixel parity or exhaustive visual coverage.

Chunk-size and service-worker `inlineDynamicImports` deprecation warnings are non-failing. Browser
automation covers desktop/mobile-emulated Chromium, not physical phones, Safari, or Firefox.

#### Failures, retries, and limits retained

- Initial application browser run: **562 passes, 12 failures, 44 skips**. Sort tests used `.check()`
  on radios removed when their dialog closed; repaired actions use `.click()` and assert output.
  Other isolated editor/navigation/layout failures did not recur in the **22-case focused rerun**;
  reload interference is suspected, not proven. Later frozen full-browser runs are clean.
- Landing full-page capture work initially exceeded a 30-second scenario budget. A 90-second budget
  accommodates five captures; the two-case screenshot rerun passed. Older captures/traces are kept.
- The post-repair closure landing run had **11 passes and one mobile first-frame story failure**.
  Font/geometry synchronization and instant scrolling repair the test; an intervening check then
  caught its formatting. Final repeated landing runs pass after both corrections.
- Static checks caught the Dexie overload mismatch when adding a fifth tag-deletion transaction
  table; using the table-array overload fixes the type error without reducing transaction scope.
- The independent recovery harness first hung on an unbounded worker wait, then custom-response
  server variants stalled installation. Bounded diagnostics are retained. The staged standard-server
  run passes without a repository worker repair; the exact custom-server transport cause is unproven.
  Final readiness polling awaits async results, and refresh assertions count browser navigations,
  not network document requests that can be satisfied by the worker cache.
- Console capture exposed malformed ring SVG paths missed by page-error-only checks. This was a
  genuine rendering defect, repaired and covered by the final console-aware regression.

See the chronology below for per-attempt logs, outputs, and narrower historical results. Failed
attempts are never added to passing totals or treated as proof of a different root cause.

#### Pending work, separated by purpose

| Category | Still pending or not established | Consequence |
|----------|----------------------------------|-------------|
| Manual audit scope | Exhaustive per-file/per-line source/test reading, individual asset/font/PDF review, and pixel-perfect story docking/panning. | Automated inventory and sampled screenshots are not exhaustive manual sign-off. |
| Device/browser coverage | Physical-device usability/performance, Safari/Firefox, short-landscape/native-dialog compatibility, and all keyboard/backdrop paths. | Local Chromium passes do not establish universal browser/device behavior. |
| Deployment/recovery evidence | Actual two-deployment rehearsals, multi-tab and legacy-page landing refresh, failed-update retention, HTML-fallback host rejection, and Cache API write rejection. | The seven local scenarios clear only their tested paths. |
| Persistence/release evidence | Real storage pressure/eviction, real-user versioned upgrade preservation, and persistence-failure UX across every write. | Manually deleting a cache entry is not real eviction; existing schema versions are not a full deployment-upgrade rehearsal. |
| Advertised launch functionality | Live group updates and connected-device continuity require an approved sync/identity/conflict/security/recovery/cost design and implementation. | These remain launch blockers; audit repairs do not deliver SYNC-01. |
| Remaining local product work | Category activation/deactivation UI, receipt ingestion/compression/lazy loading, group duplication, backup reminders, and settlement-specific sharing. Other roadmap candidates and SEO remain separate scope. | Do not label the whole roadmap complete or implement these merely to make this commit. |
| Delivery | Review/stage the proposed files, confirm commit scope/message, then commit and separately authorize push/deployment. | Documentation preparation is not a commit, push, or deployment instruction. |
| Evidence retention | Raw logs/screenshots/inventories and the external recovery harness live in temporary locations, not Git. | The committed wiki preserves compiled outcomes; temporary files are not guaranteed permanent or available after a fresh clone. Archive externally only with approval. |

Licensing/contribution policy is also undecided: do not claim an open-source release until a license
is approved. Product priorities and launch claims remain canonical in [[product-roadmap]]. There are
no unfinished automated audit jobs; new execution requires authorization under the permission gate.

#### Initial proposed commit scope and checklist

The read-only preparation inspection found branch **`development`**, base commit **`818e417`**
(`feat(expenses): add descriptions and unify monetary and date-time inputs`), **91 modified tracked
files**, **seven new files**, and an empty staging area: **98 candidate paths** in total. Counts are
the preparation snapshot, not a promise that later user changes may be staged without review.
The tracked scope is the reviewed audit changes in `src/`, `landing/`, and `wiki/`.
This checklist records the initial preparation handoff. The user subsequently reviewed the unstaged
functional changes, accepted the archive-limit explanation, approved the receipt-photo capacity
prerequisite in [[product-roadmap]], and authorized staging all changed files and one detailed audit
commit. That later authorization does not request new tests, push, or deployment; Git records the
commit outcome rather than this historical checklist being a live repository-status monitor.

All seven new files must be considered explicitly; directory-only status output can hide their names:

- `landing/tests/browser/landing.e2e.ts`
- `playwright.landing.config.ts`
- `src/features/dashboard/tests/utils/dashboard-data.test.ts`
- `src/features/import-export/tests/utils/bounded-decompression.test.ts`
- `src/features/import-export/utils/bounded-decompression.ts`
- `src/features/settlements/tests/utils/payment-preview.test.ts`
- `src/features/settlements/utils/payment-preview.ts`

Suggested single audit-batch commit message:

```text
fix(audit): harden offline data integrity and reconcile verification

- keep derived money summaries and payment previews exact
- validate persisted deletion/name guards and bound transfer intake/exports
- repair landing overflow/SVG paths and add browser regression coverage
- document passing audit evidence, retained failures, and release gaps
```

- [x] Record completed repairs, command results, retry history, exclusions, and unfinished work.
- [x] Inspect branch/base, changed/new files, and staging state without modifying Git.
- [x] Prepare the proposed scope and message; preserve prior raw evidence outside the repository.
- [ ] Review and stage only the agreed audit paths, including the seven new files.
- [ ] Inspect the staged diff and decide whether a single audit-batch commit or a split is preferred.
- [ ] If desired, approve a fresh post-documentation integrity/static check or hash refresh. The
  preparation edits change four wiki pages after the last inventory; earlier whole-tree hashes and
  static/link results remain point-in-time evidence, not a fresh check of these prose edits.
- [ ] Create the approved commit; separately decide on push and deployment.

No tests, builds, formatter, server, hash refresh, or other verification ran during the initial documentation
preparation, and that step staged or committed no files. It changed no application or landing runtime
source. The last process inspection found an existing project `vite --host` development server;
all audit/recovery automation had finished. This is a process snapshot, not a promise about future
runtime state, and the existing server was left untouched.

### Approved hardening continuation

Cross-group summaries now retain exact BigInt totals, payment edit previews allow large intermediate
nets without weakening saved-net guards, date serialization pads early years, group/tag deletion
warnings include payments, and bounded decompression/file-size/receipt-index checks protect intake.
Fresh evidence: **644 unit cases across 45 files**, TypeScript, and the **eight-case desktop/mobile
hardening browser batch** pass. Logs: `/tmp/opencode/audit-hardening-unit.log`,
`audit-hardening-types.log`, and `audit-hardening-browser-focused.log`.
The post-edit `pnpm check` rerun passes (`audit-hardening-check-rerun.log`).
The standalone landing suite passes **12 desktop/mobile cases in 1.5 minutes**
(`/tmp/opencode/audit-landing-final.log`), covering the eight screenshot filters/wraps, modal focus and
scroll restoration, exact reduced-motion demo allocations, no-JavaScript links, complete prior-install
offline screenshot access, five responsive widths, runtime errors, and reversible story accounting.
An actual 280px overflow was repaired by clipping the privacy illustration's decorative orbits;
the offline snapshot version is bumped. Test corrections wait for font readiness, read the actual
captured scroll position after opening, follow the native new-tab screenshot, and click its image.
The test captures do not establish visual pixel parity or deployed update/storage-pressure behavior.
The tracked asset inventory validates 382 PNG CRCs/decoded payloads, nine WOFF2 headers, and ten
WebP headers with zero errors (`/tmp/opencode/audit-file-inventory.json`), not individual visual review.
The fresh frozen application batch subsequently passed **644 unit cases**, both builds, **18 PWA
cases**, and **580 full-browser cases with 44 viewport-specific skips and zero failures** (22.7 minutes).
Logs: `/tmp/opencode/audit-hardening-final-{unit,build,build-devtools,pwa,browser}.log`.
Only the three landing repair/test files changed during that run; application sources stayed frozen.
The later screenshot follow-up passes two cases after extending its budget for five full-page
captures per project (`audit-landing-screenshots-rerun.log`); the initial 30-second capture timeout
is preserved in `audit-landing-screenshots.log`. Captures are not pixel-parity evidence: long native
sticky-story spacers and offscreen lazy images make whole-page screenshots incomplete visual proof.

The approved final review repairs persisted member/person/category deletion guards and category/tag
name uniqueness, preserving newer persisted fields and atomic activity rollback. CSV/group ZIP/full
backup exports now enforce import-compatible quotas. **672 unit cases across 45 files pass**
(`/tmp/opencode/audit-closure-unit.log`). Static checks caught a Dexie transaction overload type issue
after adding the groups table to tag deletion; the transaction now uses a typed table array.
The frozen closure batch passes repository static checks, **672 units**, both builds, and **18 PWA
cases**, with zero source changes during execution (`audit-closure-final-results.json`). It stops
after landing has 11 passes and one mobile story failure: the test can attempt scrolling before
the first animation-frame layout has populated `--ss-story-height`. The test now waits for font
readiness and positive measured travel and scrolls explicitly without smooth animation.
An intervening static pass correctly stopped on test formatting; that one file was formatted.
The renewed frozen batch passes static checks, **36 landing cases** (each desktop/mobile scenario
repeated three times, 2.7 minutes), and **580 application browser cases with 44 viewport-specific
skips and zero failures** (22.8 minutes). No non-wiki source changed during the run. Logs:
`/tmp/opencode/audit-closure-stable-{check,landing,browser}.log`; results and freeze record:
`audit-closure-stable-results.json` and `audit-closure-stable-source-result.json`.

The separate recovery harness initially hung on an unbounded worker wait; only its identified Node
and Chromium parent were stopped. Bounded, awaited, and isolated custom-response-server attempts
retain three passing fallback scenarios and four failing worker scenarios in their separate
`/tmp/opencode/audit-landing-recovery-{bounded,diagnostic,awaited,isolated}/results.json` files.
Installation stalls also reproduce against the isolated custom server, while a standard static-server
probe succeeds; the exact transport cause is unproven. Early async `waitForFunction` predicates
returned without establishing readiness, so the final harness uses awaited `expect.poll` and captures
installation state transitions without a competing second registration. None of those earlier
worker failures is counted as a pass or evidence of a repository worker repair.

Browser-console collection reveals malformed notebook-ring SVG cubic coordinates, which the earlier
page-error-only listener missed. Explicit coordinate separators repair the artwork; landing cache
version is now `2026-10-12-v5`. The layout regression now collects console errors as well as page
errors. The final console-aware landing rerun passes **36 cases in 3.3 minutes**
(`/tmp/opencode/audit-closure-landing-console.log`); post-repair repository static checks, 13 JavaScript
syntax checks, and `git diff --check` pass (`audit-closure-console-static-results.json`). Fresh parsing
also passes all 251 TypeScript syntax trees and three JSONC configurations
(`audit-closure-final-syntax.json`). No application source changed after its clean full-browser run.

The final independent harness uses a staging copy under `/tmp/opencode/audit-landing-recovery-static/site`
and the same standard Python static server as the landing suite. **All seven scenarios pass**:
missing story script, missing gallery script, gallery-image failure/navigation recovery, installation
rejection from a missing snapshot asset, manually evicted-entry online repair, offline 503 guidance,
and a two-revision update. Results: `/tmp/opencode/audit-landing-recovery-static/results.json`.
The update changes only staged HTML/version markers and verifies no first-install refresh, exactly
one browser-observed upgrade navigation, query/fragment preservation, old-cache cleanup, and offline
reload of the second revision. Counting server document requests was unsuitable because controlled
navigation is cache-served; the final assertion counts main-frame navigations instead.

These seven scenarios do not establish an actual two-deployment rehearsal, multi-tab or legacy-page
refresh, failed-update retention, HTML-fallback rejection, Cache API write failure, or physical storage
pressure/eviction. Manually deleting one cached entry is not real browser eviction. No repository
worker repair, dependency installation, deployment, commit, or push occurred in the recovery follow-up.
`landing/README.md` now reconciles verification/cache status and excludes local tests/docs from the
runtime upload instructions. Earlier evidence and failures remain preserved.

File inventory covers **731 tracked and seven untracked files (738 total)**, with per-file hashes:
`/tmp/opencode/audit-closure-file-inventory.json`. Checks pass for 251 TypeScript syntax trees,
13 JavaScript/module syntax checks, three JSONC TypeScript configurations, JSON/XML documents,
382 PNG CRCs/decoded payloads, nine WOFF2 and ten WebP headers, and two PDF headers/end markers.
All **43 wiki Markdown pages** are indexed, with no unresolved wiki/local Markdown links; landing
HTML/CSS local asset references and `git diff --check` pass. This is file-level automated coverage,
not exhaustive manual reading of every source/test line, PDF, font glyph, or raster asset.
The final refreshed inventory is `/tmp/opencode/audit-final-file-inventory.json`, with results in
`audit-final-integrity-results.json`: all 738 file hashes refreshed, all 43 pages/Markdown links and
landing asset references checked, and final `pnpm check`/`git diff --check` passing. Binary validation
results are retained only where bytes match the earlier validated hash; syntax checks are refreshed.
The source comparison confirms zero `src/` changes after the clean 580-case browser run; only the
landing README, SVG artwork, worker version, and landing console-error regression changed afterward.
Final static log: `/tmp/opencode/audit-final-check.log`. At that verification point, audit changes
remained uncommitted and unpushed; subsequent delivery authorization is recorded in the handoff above.

Loaded visible landing views are captured separately at 280/390/820/1440/1920px in
`/tmp/opencode/audit-landing-viewport-captures` (40 top/bottom viewport captures). Sampled narrow
privacy/demo, tablet gallery, desktop gallery, and wide reduced-motion hero views have no observed
content clipping; the decorative orbit repair preserves the phone/backup illustration. Earlier
whole-element screenshots contain sticky/fixed-header capture artifacts and are retained separately
in `audit-landing-visible-sections`; they are not treated as actual overlapping content defects.
This remains sampled local Chromium visual review, not pixel parity or physical-device sign-off.
Exhaustive manual per-file review is not established. No deployment or real-device sign-off is implied.

### Initial audit phase

The approved audit corrected current-UI browser assumptions in expense recording/filtering, tag
suggestions, and shared modal layout. Optional description/tag controls are opened explicitly;
Sort helpers select the mobile dialog versus wider disclosure. Added cases exercise Add/Edit
Amount autofocus and optional-draft preservation, added-date sorting with recorded payments, and
mobile Sort scrolling, dismissal/focus, resize, and breakpoint teardown.

Completed evidence:
- `pnpm test`: 616 cases across 42 files pass in the fresh final unit run (21.03 seconds).
- `pnpm check`: ESLint, repository Prettier checks, and TypeScript pass after approved formatting
  repairs, including the post-wiki rerun.
- Ordinary production and `VITE_ENABLE_DEVTOOLS=true` builds pass. Existing chunk-size and
  deprecated `inlineDynamicImports` warnings remain non-failing.
- Production PWA suite: 18 cases pass across desktop/mobile projects.
- `node --check`: all tracked `.js`, `.mjs`, and `.cjs` files pass syntax checks.

Evidence logs are `/tmp/opencode/audit-unit-final.log`, `audit-check-final-wiki.log`,
`audit-build.log`, `audit-build-devtools.log`, and `audit-pwa.log`. Syntax checks emitted no errors.
The full browser run in `audit-browser.log` finished with **562 passes, 12 failures, and 44
viewport-specific skips** (618 scheduled combinations, two workers, 42.8 minutes).
Five failures came from Sort tests using `.check()` on radios removed when selection closes the
mobile dialog. Approved test-only repairs use `.click()` and assert the resulting URL/order.
The other seven failures involved lost editor/modal state, destroyed navigation contexts, or
responsive geometry. They did not recur in isolation; reload interference is suspected, not proven.

The single-worker focused rerun selected every failing scenario on both projects: **22 passed in
1.6 minutes**, including added-date/payment order, Sort scrolling/focus/dismissal/breakpoints,
Unequal input, date/time errors, Overview/Balances layout, payment modal, dashboard avatars, and
Link/CSV export. Evidence: `/tmp/opencode/audit-browser-focused.log`; separate artifacts:
`/tmp/opencode/audit-browser-focused`. Original traces remain in `/tmp/split-slate-playwright`.
This clears the selected failures, not a fresh clean full-suite run or proof of full-run stability.
The initial phase made no application behavior repair; changed non-test JavaScript/TypeScript had equivalent
emitted syntax after normalizing redundant parentheses, and landing HTML/CSS edits are formatting.
Earlier historical passes below do not supersede these scope limits.
No exhaustive file-by-file source sign-off is claimed. Standalone landing runtime/visual/offline
checks, real-device behavior, storage pressure, and deployment/update rehearsals are not established
by this batch; JavaScript syntax checks are not landing behavior tests.

## Scoped Description and Monetary Verification — 2026-10-11

The approved monetary-refactor batch passed **543 unit/store cases across 32 files** under
`src/shared/tests/utils`, `src/features/expenses/tests`, `src/features/settlements/tests`, and
`src/features/import-export/tests`. Repository lint and TypeScript passed. Prettier write/check
passed on the 17 monetary-refactor source/test files only; this was not repository-wide formatting.
The earlier description batch passed 299 cases across 21 files, six desktop/mobile description
browser cases, and a separate five-case ZIP rerun with a scoped ZIP-test formatting check.

The three-file desktop/mobile browser batch (`record-expense.e2e.ts`, `expense-filters.e2e.ts`,
`settlements.e2e.ts`) finished with **187 passes, 7 failures, and 4 expected viewport skips** in
9.7 minutes. All payment cases, description cases, Unequal/Adjust monetary entry, large monetary
prefills, current-time/Clear time, picker errors/typography, and four-digit year cases passed.
The Shares-only seven-total-digit entry cases also passed; that separate feature was preserved.

Failures comprised payer-selection test actions on visually hidden checkboxes (two projects),
filter locators whose exact label changed when validation text appeared (two projects), a Shares
test refilling its unchanged historical value rather than actually changing it (two projects), and
one desktop setup timeout. Approved fixes changed only the two expense browser test files:

- Click the visible payer label/pill, as existing payer journeys already do.
- Use stable input `name` selectors when an in-progress invalid amount adds text inside its label.
- Clear historical Shares before refilling to trigger a real React change event; merely reopening
  or submitting an untouched prefill must not apply the entry cap.

The approved single-worker rerun selected those four scenarios on desktop and mobile:
**8 passed in 41.6 seconds**, including the setup-timeout scenario without a timeout increase.
Scoped two-file formatting/lint and TypeScript passed after the test fixes. No production code
changed in this follow-up. The 543-case unit batch was not repeated after these test-only fixes;
Shares helper coverage was not separately rerun. This is a repaired focused batch, not a fresh
full-browser, build, PWA, or repository-formatting pass. All new execution needs approval.

Browser artifacts:
- `/tmp/opencode/currency-verification-2026-10-11` — original three-file failures/traces.
- `/tmp/opencode/currency-focused-rerun-2026-10-11` — focused rerun output directory.

That verification batch left unrelated landing edits and the `wiki/log.md` conflict untouched. See
[[money-representation-and-rounding]], [[main-screen]], [[paid-by]], [[filtering]],
[[split-types]], [[import-export]], and [[full-backup]].

## Current UI and Commit Reconciliation — 2026-10-11

The user approved resolving the wiki-log conflict, reconciling six wiki files, and committing the
remaining app/wiki changes. Both conflict histories are retained. Landing implementation was
already committed separately as `8e39f27`; this reconciliation does not modify landing files or
application source/tests. No tests, builds, lint, type checks, formatting, servers, or push ran.

Read-only source/test review found current Add/Edit uses closed-by-default Optional details for
Description and Tags, places Date and time first, and autofocuses Amount. Existing
`record-expense.e2e.ts` cases still access optional fields without opening the disclosure and
assert date/time lies beneath Tags. `expense-filters.e2e.ts` still expects a sort section named
Date; source now names it Expense date and adds Added date plus a mobile Sort dialog. These are
stale test assumptions, not failures observed in a new run.

Historical scoped passes above must not be treated as verification of this current layout,
mobile Sort/dialog sizing, added-date payment merging, recent-expense group ordering, or Overview
transfer-avatar refinements. Test updates and any fresh verification remain pending and require
separate explicit approval. See [[main-screen]] and [[filtering]] for current behavior.

## Responsive Browser Coverage

The 2026-10-08 pre-scaling full browser suite verified the mobile expense form's scroll boundary,
last split row, Save/Cancel toolbar, and absence of a second document/form scroller at 320px by
700px. The bounded form and Categories & Tags routes fix the body as well as clipping overflow.
Root-based mobile scaling was added afterward. Its scale-aware assertions and the later UI fixes
have now been exercised in the completed browser run and focused follow-ups documented below.
A final full-browser run after those fixes passes on 2026-10-10, including the Analytics change.
The 2026-10-11 stable full suite also verifies the subsequent navigation, editor, and input changes.
See [[layout-architecture]], [[main-screen]], and [[product-roadmap]].

## Decision

Split Slate uses Vitest 4.1 or newer as its primary unit and integration test runner. Vitest runs
through the existing Vite transformation pipeline and supports the project's TypeScript, ESM,
JSX, plugins, and `@/` aliases. Vitest 4 requires Node.js 20 or newer.

React Testing Library is the planned component-testing layer when interactive component coverage
is added. Playwright is installed for browser expense-recording workflows; it is not a substitute
for unit-level accounting tests.

Jest is not used because it would introduce a second transformation and module-resolution setup
beside Vite. TestCafe is not used because it overlaps the end-to-end role assigned to Playwright.

## Directory and File Structure

Tests live in dedicated `tests/` directories rather than beside production files. Every feature
gets a `src/features/<feature>/tests/` directory when its first test is added. Subdirectories mirror
the production structure where that improves navigation:

```text
src/
├── app/
│   └── tests/
│       ├── layouts/
│       └── router/
├── features/
│   └── <feature>/
│       └── tests/
│           ├── components/
│           ├── helpers/
│           ├── hooks/
│           └── store/
└── shared/
    └── tests/
        ├── components/
        ├── configs/
        ├── hooks/
        └── utils/
```

Only directories that contain tests are committed because Git does not retain empty directories.
Unit/integration test files use the production filename followed by `.test.ts` or `.test.tsx`.
Playwright journeys use `.e2e.ts` under feature `tests/browser/` directories or app
`tests/router/`. The main Playwright root is `src/`; its match patterns include both of those
locations, with shared desktop/mobile Chromium projects. PWA production-build tests use a separate
`playwright.pwa.config.ts` configuration and `.pwa.ts` files. Cross-directory imports continue to
use the `@/` alias.

Playwright's Node-side test loader does not apply Vite's asset transformations. Modules that
import images must be loaded inside `page.evaluate` through the running Vite server, not as
runtime imports in the test file. Type-only imports remain safe; return only serializable values
needed for assertions. The carousel layout tests load slide titles and descriptions this way.

## Test Boundaries

Vitest's assigned scope includes:

- monetary parsing, formatting, and validation
- split calculation and deterministic rounding
- balance and settlement-suggestion helpers
- schemas, finite-state transitions, hooks, and other deterministic logic
- store actions and persistence boundaries with controlled IndexedDB state
- component behavior that does not require a complete browser journey

Playwright's assigned scope includes:

- onboarding and group-creation journeys
- expense create, edit, and delete journeys
- persistence across page reloads using real IndexedDB
- import, export, PWA installation, and offline-start behavior
- critical responsive navigation behavior

## Test Authoring Protocol

Before writing a suite:

1. Read `wiki/index.md` and the pages relevant to the behavior under test.
2. Inspect the authoritative production source and its direct consumers.
3. Enumerate the observable contract, invariants, boundaries, and failure paths.
4. Test public behavior instead of private implementation details.
5. Propose the focused suite, `pnpm test`, and `pnpm check`; run only what the user explicitly
   approves under the execution-permission gate. If declined or deferred, report verification pending.

Test writing follows these rules:

- Name each `describe` block after the public unit or workflow and each test after observable
  behavior.
- Keep one behavioral reason for failure per test. Multiple assertions are appropriate when they
  jointly describe one outcome.
- Prefer explicit case tables for finite state transitions and equivalence classes.
- Use small typed fixture builders with fixed IDs and timestamps. Do not share mutable fixtures
  between tests.
- Keep tests deterministic: do not depend on the machine locale, current clock, random UUIDs,
  network, execution order, or data left by another test.
- Mock only external or nondeterministic boundaries. Do not mock the unit being tested or repeat
  its implementation inside the assertion.
- Assert persisted state as well as in-memory state for Dexie-first store mutations.
- Assert user-visible roles, labels, messages, and navigation in component and browser tests;
  avoid CSS selectors and internal React state.

For every behavior, consider all applicable cases from this checklist:

- normal success and every supported variant
- empty, first, last, zero, minimum, maximum, and precision boundaries
- invalid, missing, malformed, duplicate, and cross-entity references
- async rejection, database failure, and partial-write prevention
- repeated calls, idempotency, ordering, and state isolation
- accessibility, keyboard interaction, responsive layout, reload, and offline behavior

Coverage is behavior-based rather than percentage-only. Every executable source area must have
direct unit or integration coverage or be exercised through a higher-level test. Static
declarations, constants, and entry points may be covered through integrity or integration tests
when a direct test would only repeat the source. Any intentional exclusion requires an explicit
rationale.

## Definition of Done for a Test Slice

A test slice is complete when:

These are completion criteria, not authorization to run checks. Ask first; if verification is
declined or deferred, mark the slice unverified and continue only separately approved work.

- its applicable success, boundary, invalid-input, and failure cases are covered
- tests are deterministic and isolated
- the focused suite and complete Vitest suite pass
- ESLint, Prettier, and TypeScript checks pass through `pnpm check`
- any durable behavior or strategy change is reconciled with the wiki

## Historical Completed Baseline — 2026-10-11

The completed, approved 2026-10-11 verification supersedes the earlier automated baselines:

- `pnpm check` passes ESLint, Prettier, and TypeScript against the final code and tests.
- `pnpm test` passes all 503 cases across 41 files.
- The final stable `pnpm test:e2e` run passes 520 cases with 44 expected viewport-specific skips
  and zero failures (564 scheduled combinations, two workers, 19.7 minutes). It covers both mobile
  expanding navbars, history/viewport resets, editor focus, grouped/capped amounts, shared time
  controls, percentage suffixes, tags, filter colours, dashboard clocks/previews, and compact
  spending layouts in addition to existing accounting, transfer, and CRUD journeys.
- Production and Devtools-enabled builds pass. All 18 production-build PWA cases pass, covering
  offline launch, icon-cache repair, installation, reminders, and update consent.
- JavaScript syntax checks pass for the standalone landing animation and PWA icon generator.
- Artifacts are under `/tmp/opencode/full-verification-2026-10-11`; the clean full-suite log is
  `browser-stable-final.log`. Earlier diagnostic/failing runs are superseded, not counted as passes.

The verification repairs establish these additional invariants:

- Shared editor dialogs close before DOM removal in layout-effect cleanup and explicitly restore
  a connected opener. Passive-effect teardown after removal lost focus. Mobile Contacts must
  override the unlayered `.btn` display rule when hiding the redundant header creation action.
- Single-payer radios and controlled multiple-payer checkboxes need distinct React identities;
  reusing one input across control models emits warnings. Mode switching retains form drafts.
- Browser tests wait for a rendered destination, not just a changed URL or a link's local collapse.
  The history test waits for the destination's `aria-current="page"` before another action.
  Persistence checks and reloads wait for the post-save screen or next onboarding step: a submit
  click alone does not prove the asynchronous IndexedDB write completed. Reloading during Saving
  interrupted a noon/midnight update. Existing saved-value/reset assertions remain intact.
- Source and test files stay frozen during browser verification; edits and formatter writes can
  invalidate a Vite-served run through page reloads. Only stable runs establish the final baseline.

Builds retain non-failing large-chunk, plugin-timing, and service-worker `inlineDynamicImports`
deprecation warnings. These checks do not establish perfection, real-device coverage,
storage-pressure behavior, or a two-deployment update rehearsal. The previous production visual
smoke matrix below was not repeated for these latest changes. Future execution requires approval.
See [[layout-architecture]], [[member-management]], [[people-directory]], and [[paid-by]].

### Previous Completed Baseline (2026-10-10)

The 2026-10-10 verification superseded the older automated baselines below:

- `pnpm check` passes ESLint, Prettier, and TypeScript after the final repairs and scoped
  import-order/formatting fixes.
- `pnpm test` passes all 467 cases across 40 files after the final application fixes.
- `pnpm build` and `VITE_ENABLE_DEVTOOLS=true pnpm build` pass; the final PWA run builds the normal
  production variant again.
- `pnpm test:pwa` passes all 18 cases against the final application changes.
- The first full browser run after the modal/filter/dashboard refinements passed 359 cases,
  skipped 21 inapplicable project combinations, and failed 30. Repairs reduced those failures to
  shared UI defects and selector drift, not 30 independent defects. The four-file focused rerun
  passed all 115 applicable cases with 11 expected skips.
- The final `pnpm test:e2e` run with application source stable passes all 389 applicable cases,
  with 21 expected viewport-specific skips and zero failures (410 scheduled combinations). It covers
  group Analytics drill-down, compact horizontal filter pills, mobile Filters, shared modal margins
  and fixed controls, group identity/currency editing, outer-only expense/payment scrolling,
  compact colour-labelled payment tags, sidebar groups, and aligned dashboard summaries.
- Eight production smoke cases at 280, 320, 390, 640, 820, 1024, 1440, and 1920px pass in alternating
  light/dark themes. Each checks dashboard/pane overflow, member avatars, ledger scrolling, filter
  pills, modal margins/actions, payment tags, saved themes, and offline filtered reloads and editors.
  No browser page errors were observed. Logs, screenshots, and traces are under
  `/tmp/opencode/full-verification-2026-10-10`.

The verification repairs establish these reusable UI constraints:

- Custom unlayered `display` rules override Tailwind's layered hiding utilities. Dashboard preview
  and New group visibility therefore use explicit scoped media rules. Grid cards also need
  `min-width: 0` so long names do not expand their automatic minimum width beyond the main pane.
- Portaled popovers must follow layout changes, not just viewport resize/scroll. Filter edits and
  validation can remove insights or resize the sticky toolbar; render-time updates and observers
  keep the popover outside its trigger so it remains closable. See [[filtering]].
- A custom field's inline error inside a wrapping label changes its accessible name. Group-name
  editing separates the explicit label from the field/error wrapper, keeping the name stable after
  invalid submission and allowing correction without weakening the exact-label regression test.
- Browser tests scope repeated captions and use the current responsive controls: mobile Filters is
  a dialog, while expense Add tag remains intentionally mobile-only. Desktop tag-modal layout is
  exercised through Categories & Tags instead.

Those builds emitted non-failing large-chunk and service-worker option-deprecation warnings; expense
payer browser journeys emitted a React uncontrolled-to-controlled input warning despite passing.
The payer warning is repaired in the 2026-10-11 focused regression documented above.
These automated results do not claim storage-pressure or two-deployment update rehearsal
verification. See [[layout-architecture]] and [[mobile-pwa-install]].

### Earlier Verification History

Earlier on 2026-10-10, before the modal/filter/dashboard refinements, the stable full browser suite
passed 314 cases with 18 expected skips. Seven Analytics smoke cases at 280–1440px and four offline
cases verified category links, filtered reloads, saved themes, and unchanged app-wide Analytics.
Those artifacts remain under `/tmp/opencode/analytics-category-drill-down`; the current full run
supersedes that baseline.

On 2026-10-09, after the onboarding and data-transfer UI changes and execution-approval policy
updates, `pnpm check` and `pnpm build` passed, all 443 Vitest cases passed across 37 files, and
all 18 production-build PWA cases passed. Full browser and responsive visual verification were
pending at that point. These results predate the carousel browser-test import correction.

The subsequent full browser run completed with 258 passing cases, 19 viewport-specific skips,
and 7 failures: missing saved-theme initialization on entry pages, mobile person-editor focus
expectations, and a settlement-height assertion during viewport resizing. Theme initialization
has moved to `App`, with direct-entry regression checks.
The 28 initial responsive captures showed no horizontal overflow and confirmed the theme defect.

All six focused saved-theme/direct-entry browser cases then passed on desktop and mobile.
The shared editor dialog now focuses its first enabled form field after opening, and the
settlement layout test waits for the expected root font size at each viewport before measuring.
The four-worker targeted run passed all seven formerly failing cases. Its long public-entry
matrix exceeded the default test timeout under concurrent cold-start load, so that matrix now
uses separate cases per theme/onboarding state instead of increasing the timeout. All eight
split matrix cases passed the focused follow-up. Together these runs verify 22 current cases:
14 unchanged targeted cases plus the eight split theme cases. The full suite is not automatically
repeated after each fix, and no single post-fix full-suite pass is claimed.

The final 28 responsive captures at 320x568, 390x700 (dark), 900x900, and 1280x800 applied the
correct saved themes, showed no horizontal overflow, and kept modal/currency actions visible.
`VITE_ENABLE_DEVTOOLS=true pnpm build` passed after the final source/test corrections. The typed
onboarding fixture also resolves the TS2353 build failure reported from Netlify; deployment still
requires committing and pushing the local fix. Unit/PWA results above predate the final theme and
focus changes; those suites had not been rerun at that point. See [[layout-architecture]] and
[[member-management]].

On 2026-10-08, before root scaling, `pnpm lint` and `pnpm build` passed, `pnpm test` passed
443 cases across 37 files, and the full `pnpm test:e2e` run passed 207 cases with 19
viewport-specific skips and no failures. This cleared current assertion drift, host-versus-browser
timezone assumptions, the expense/payment timeline's non-date sorting regression, desktop
Add-tag visibility, and mobile document-scroll leaks. Export copied feedback now resets from
selection change events, and its selection ref is synchronized outside render. Browser time
assertions run in the configured browser timezone rather than assuming the Node host timezone.
The 18 PWA production-build cases also passed before the scaling refactor.

After root scaling, lint, build, all 443 unit cases, and all 18 PWA cases passed. The browser run
exposed assertions that assumed unscaled 320px layout: date/time fields now fit side by side at
that width, and the 38px-reference Settle up action measures 33.25px at the 14px root. Date/time
coverage now checks available width against both flex bases and the gap at 320px and 280px;
settlement-button height bounds use the actual root scale. Those corrections were subsequently
verified in the completed browser run and focused follow-ups above. See [[layout-architecture]].

On 2026-10-05, `pnpm check` passed, `pnpm test` passed 422 Vitest cases, the full
`pnpm test:e2e` run passed 154 cases with no failures and 18 viewport-specific skips, and
`pnpm test:pwa` passed 18 production-build cases. That clears the 30 failures recorded on
2026-10-04: transfer journeys now open the collapsed Settings **Export group** panel before
selecting content, remaining assertions match current dates, balances, and dialog markup, and the
update-notice PWA test seeds a timestamp dismissal because legacy boolean values intentionally
re-prompt. This run does not verify mobile Add/Edit Expense scroll-to-last-field or Save/Cancel
placement. See [[product-roadmap]].

Vitest covers the existing helpers and schemas plus money conversion, currency formatting, all five
split methods, expense input validation, and payer defaults/ranking. Expense-store integration tests
use `fake-indexeddb` and assert persisted state, hydration, concurrent writes, stale-reference
rejection, and rollback when either write fails.

`fake-indexeddb` is a development dependency imported by the expense-store tests. It supplies an
in-memory IndexedDB implementation in Node so the real Dexie/store code can exercise persistence
and rollback. The application uses browser IndexedDB; Playwright also uses real browser storage.

Playwright suites are configured for Chromium at desktop and mobile sizes. Expense journeys cover
form recording and editing across all five split methods, multiple payers, detail navigation, tags,
confirmed deletion, list/balance updates, reload persistence, cancellation, retry after rejection,
inactive historical categories, solo balances, and missing/cross-group expense routes. Tests also
cover app-route recovery, dashboard navigation/activity, group deletion, category/member/contact
flows, group transfer, and whole-app backup. PWA tests exercise the production service worker and
offline/cache paths separately. Test data lives in isolated browser contexts. With explicit user
approval for the relevant commands, `pnpm test:e2e` runs browser journeys and `pnpm test:pwa` runs
production-build PWA checks. If Chromium is missing, separately request approval to install it with
`pnpm exec playwright install chromium`; test approval does not implicitly authorize installation.
Traces/results are written under their configured `/tmp`
Playwright output directories. Component tests with React Testing Library remain planned.

### Expected Project-Specific Skips

`playwright.config.ts` schedules the shared browser suites in both desktop and mobile projects.
Some tests exercise UI that exists in only one layout, so `test.skip` excludes the inapplicable
project rather than dropping the behavior from coverage.

The 2026-10-11 final run scheduled 564 test/project combinations:

| Test scope | Count | Skipped project | Passing project |
|------------|-------|-----------------|-----------------|
| Mobile-only UI | 36 | Desktop | Mobile |
| Desktop/sidebar UI | 5 | Mobile | Desktop, including resized sidebar widths |
| Explicit tablet viewport | 3 | Mobile | Desktop, resized to tablet width |

All 44 skipped combinations have a corresponding passing execution in the appropriate project.
Examples include mobile footer navigation, desktop dashboard cards, sidebar rows, and tablet
outer-only ledger scrolling.
These tests remain necessary regression coverage; the skip avoids asserting a layout-specific
contract against a different layout. The result is 520 passing combinations, 44 inapplicable
combinations, and zero failures—not 44 behaviors left untested.

Additional Vitest suites cover form-value round-trips and fixed two-decimal precision across currency labels; all-member balances,
transfer conservation, ID tie-breaking, and safe-integer boundaries; member reference checks,
concurrent duplicate additions, and persisted self-deletion protection. Expense-store tests cover
update ownership and validation, old-total replacement at the aggregate limit, payer-ranking
refresh, timestamp/attachment preservation, attachment cascades, concurrent update/delete, and
rollback when writes fail.

Expense-filter utility tests cover all eight logical fields, cross-field AND and within-field OR
matching, local-calendar inclusivity, all five split types, multi-payer totals, fixed precision,
safe amount bounds, active-field counting, empty inputs, invalid date/amount ranges, and stale-option
pruning. Dedicated desktop/mobile journeys manipulate every filter, assert range validation and
clear behavior, verify child-route state retention, and confirm deletion removes a selected option.

Group-settings browser coverage checks that dismissing the currency warning makes no change,
accepting it relabels an expense without rewriting saved paid/owed amounts, and the UI shows two
decimal places for JPY. Fixed-scale utilities and transfer round-trips have unit coverage.

Ratio regression cases cover exact decimal metadata, minimum and maximum supported shares,
values that Number would round, preserved decimal zeros, six-decimal percentages, and maximum
money totals. Form tests cover legacy numeric metadata and reject an already-rounded out-of-range
legacy ratio without clamping it. Store cases verify hydration and name-only edits preserve
allocations; desktop/mobile browser journeys verify maximum shares in detail, editing, and reload.

Tag-store integration tests in `src/shared/tests/configs/store/tags.test.ts` cover cleanup using
persisted tag/group records, stale deleted or edited expenses, references absent from memory,
preservation of unrelated data and receipts, unused/missing/repeated deletion, concurrent tag
removals, and overlapping expense creation/editing/deletion in both orders. Write-failure cases
verify rollback of the tag and earlier expense changes, unchanged memory, and successful retry.
These tests use fake IndexedDB; stale snapshots simulate another tab's retained state.

Import/export utility and integration suites cover consistent persisted snapshot reads, independent
content selection, expense/receipt dependency closure, omitted-reference cleanup, cross-record and
count validation, paid/owed and aggregate limits, canonical SHA-256 checks, and malformed/tampered
payload rejection. Link cases cover Unicode round-trips, the 32,000-character and 256 KiB guards,
file fallback, and a fixed 25-member/25-category/25-tag/50-expense acceptance fixture. CSV cases
cover deterministic typed rows and spreadsheet escaping. ZIP cases verify manifest/CSV agreement,
declared paths, receipt hashes, missing/surplus/corrupt files, and archives without receipts.

Import-store cases use fake IndexedDB to verify fresh group-owned IDs, internal-reference rewrites,
recipient identity mapping, default categories, same-name numbering, receipt persistence,
preservation of completed onboarding state, post-write counts, and full transaction rollback.
Dedicated desktop/mobile browser journeys exercise questionnaire defaults and dependency dialogs,
format availability, Link/CSV/ZIP generation, fresh-device Link/CSV import, existing-device ZIP
import, identity setup, count-only review, same-name import, and receipt-byte persistence.

This is an inventory of existing suites, not a substitute for running them. Direct browser coverage
for the member-management repeated-add UI guard remains pending; store-level concurrent membership
and aggregate group-spending boundary cases are covered.

With explicit user approval, `pnpm test` performs a single complete run; `pnpm test:watch` is an
optional watch task requiring approval for that persistent process. Neither runs automatically.

## Related

- [[balance-calculation]] — first implemented unit-test target
- [[onboarding-persistence]] — setup-step resume and monotonic-progress invariants
- [[money-representation-and-rounding]] — required accounting edge-case coverage
- [[product-roadmap]] — release-critical workflows and test requirements
