# split-slate Wiki

Synthesized knowledge for the split-slate expense splitting PWA.
This wiki is the sole persistent compiled knowledge layer. The implementation in `src/` remains
authoritative; `app-featureset-context/spec-sheet.md` is a historical baseline where later source
and approved decisions have superseded it. Changes: [log.md](log.md)

Last updated: 2026-10-12

---

> **HIGHEST PROJECT PRIORITY — ASK BEFORE RUNNING:** Tests, builds, lint, type checks,
> formatting/auto-fixes, Playwright/E2E/PWA, browser automation, watch tasks, servers, tool
> installation, and routine session-start/task-completion execution require explicit user approval.
> **No means no. Wait means wait and remind as requested, not execute.** Approval is limited to
> the agreed scope in the current session and never carries into a new one. Urgency, pending tasks,
> release gates, and conflicting project notes are not permission. Editing/commit approval is not
> verification approval. See [[testing-strategy]]; `AGENTS.md` and `CLAUDE.md` state the same gate.

---

> **Current audit evidence (2026-10-12; scoped automated verification):** 672 unit cases across
> 45 files, repository lint/formatting/TypeScript, ordinary and Devtools-enabled builds, and 18
> production PWA cases pass. The final frozen browser batch passes 580 application cases with
> 44 viewport-specific skips and zero failures, plus 36 repeated landing cases; source stayed unchanged.
> Earlier failures and focused retries are retained in [[testing-strategy]]. Exhaustive manual
> per-file review, real-device/storage-pressure behavior, and deployed updates are not established.

> **Approved hardening continuation:** exact cross-group summaries, safe payment-edit previews,
> padded local years, payment-aware deletion warnings, and bounded intake/decompression are implemented.
> Fresh 644-unit/45-file, TypeScript, eight focused browser cases, and post-edit static checks pass.
> The 12-case local landing suite also passes after a 280px decorative-overflow repair; the landing
> cache version is bumped. Persisted deletion/name guards and import-compatible export quotas are
> now repaired, with 672 unit cases, static checks, both builds, and 18 PWA cases passing. A landing
> first-frame test synchronization repair passes repeated verification. A subsequent independent
> recovery harness detects malformed notebook-ring SVG coordinates; they are repaired, console-error
> assertions added, and 36 repeated landing cases pass again. Seven staged-copy recovery/local-update
> scenarios pass with the standard static server; earlier custom-server stalls are retained without
> a proven transport cause. Final static/hash/link checks pass across all 738
> tracked/untracked files and 43 wiki pages; no application source changed after the clean browser run.
> Sampled loaded
> viewport captures are reviewed, but exhaustive manual per-line review is not claimed. See [[testing-strategy]].

> **Commit preparation:** the consolidated repair list, executed command/result table, retained
> failures, categorized pending work, seven new files, and proposed commit/checklist are in
> [Audit Closure and Commit Preparation](decisions/testing-strategy.md#audit-closure-and-commit-preparation).
> Initial preparation was documentation-only: 91 modified tracked files plus seven new files on
> `development`, with nothing staged or committed at that step. The user subsequently approved
> staging all changes and a single detailed audit commit, plus a receipt-photo backup/restore capacity
> prerequisite in [[product-roadmap]]. Push/deployment are not requested. Existing verification is
> historical evidence; no fresh checks ran for these later prose edits.

> **Earlier automated baseline (2026-10-11):** Lint, formatting, TypeScript, production build, and
> Devtools-enabled build pass. All 503 unit cases across 41 files, 520 full-browser cases, and
> 18 production-build PWA cases pass. The stable full-browser run has zero failures and 44 expected
> viewport-specific skips, each covered in its appropriate project. This includes expanding mobile
> navbars, editor focus, numeric/time inputs, percentage suffixes, tag creation, filter colours,
> dashboard clocks/previews, and compact spending layouts. Earlier failing runs are superseded.
> Build warnings remain non-failing; real-device/storage-pressure/deployment update rehearsals remain
> release checks. Earlier production visual smoke checks were not repeated for these latest changes.
> Artifacts: `/tmp/opencode/full-verification-2026-10-11` (`browser-stable-final.log`).
> The later scoped batch below exercises current-time defaults, **Clear time**, picker typography,
> field-specific errors, four-digit years, and expanded shared monetary input. It does not repeat
> the full-browser/build/PWA baseline. Future execution requires approval. See [[testing-strategy]],
> [[layout-architecture]], and [[main-screen]].

> Shares Add/Edit now silently limits user entry to seven numeric digits total, excluding the decimal
> point and retaining up-to-six-decimal precision. Untouched historical ratios and store/import
> limits are preserved. Seven-digit Shares browser cases passed in both projects; historical Shares
> also passed in the focused rerun after a test-only change-event fix. Shares helper coverage was not
> separately rerun. See [[split-types]] and [[testing-strategy]].

> Optional plain-text expense descriptions are implemented in Add/Edit and detail, with Link/CSV/ZIP
> and whole-app backup/restore support. Older description-free records/files remain supported without
> an IndexedDB migration. The approved focused batch passed 299 expense/import-export unit/store
> cases across 21 files and six desktop/mobile description browser cases. Lint and a later TypeScript
> check passed; all five ZIP rerun cases and the scoped ZIP-test formatting check passed.
> Repository-wide formatting stopped on that test and pre-existing `landing/index.html` edits;
> the ZIP test alone was fixed. Description/import/restore cases also passed in the subsequent
> scoped monetary-refactor batch below. See [[domain-models]], [[import-export]], and [[full-backup]].

> Mandatory monetary reuse: `formatCurrency` for saved/derived integer hundredths; `MoneyInput`
> plus shared amount-input helpers for every monetary form/filter field, including payers and
> Unequal/Adjust. Entry caps are eight whole digits/two decimals, with a leading minus only for
> Adjust. Formatting options prepare future preferences without a preference UI or storage changes.
> Current defaults remain unchanged. See [[money-representation-and-rounding]].

> **Historical scoped verification (2026-10-11):** 543 unit/store cases across 32 files pass; repository lint,
> TypeScript, and formatting of the 17 monetary-refactor source/test files pass. The three-file
> desktop/mobile browser batch had 187 passes, 7 failures, and 4 expected viewport skips. After
> fixes only to two expense browser test files, all four affected scenarios passed in an eight-case
> single-worker desktop/mobile rerun; scoped formatting/lint and TypeScript also pass afterward.
> All payment and description browser cases passed in the original batch. This is not a new full
> browser/build/PWA/repository-formatting pass. Artifacts: `/tmp/opencode/currency-verification-2026-10-11`
> and `/tmp/opencode/currency-focused-rerun-2026-10-11`. Future execution requires approval; see
> [[testing-strategy]]. That batch left unrelated landing edits and the wiki-log conflict untouched.

> **Historical source reconciliation (2026-10-11):** the approved conflict resolution retains both
> app-workflow and landing-design log histories. Landing code is already in separate commit `8e39f27`.
> Add/Edit now uses collapsed Optional details, date/time-first fields, and Amount autofocus;
> mobile Sort uses a dialog, Added date sorts use recording timestamps, and dashboard/sidebar
> groups share latest-expense recording order. Existing description/tag/date-layout and Sort-section
> browser assumptions are stale. No fresh checks or test/source changes ran in this reconciliation;
> historical passes do not verify the current UI refinements. See [[main-screen]], [[filtering]],
> and [[testing-strategy]].

---

## Navigation

### Roadmap
- [Product Direction and Roadmap](roadmap/product-roadmap.md) — audit/release readiness, receipt-photo backup-capacity prerequisite, local backlog, landing evidence, and pending promises

### Architecture
- [Domain Models](architecture/domain-models.md) — expense/payment shapes, preserved recorder identity, fixed hundredths, payment-aware net guards, and current-time defaults
- [Balance Calculation](architecture/balance-calculation.md) — safe payment-aware balances, reconciled Overview/sidebar/dashboard callers, expense-only spending, and deterministic transfers
- [State Management](architecture/state-management.md) — persisted transactional deletion/name guards, atomic activity cleanup, and cross-tab UI-sync limits
- [Split Types](architecture/split-types.md) — 5 exact methods, preserved historical ratios, scoped Shares browser evidence, and fresh full-unit split-input coverage (2026-10-12)
- [Layout Architecture](architecture/layout-architecture.md) — responsive shell, Balances/tablet Activity navigation, shared mobile Filter/Sort dialogs, and editor teardown

### Decisions
- [Global People Directory](decisions/global-people-directory.md) — shared device-local identity, expense/payment removal guards, and group-owned category labels
- [Expense Model Design](decisions/expense-model-design.md) — fixed-hundredths paid/owed allocations and exact decimal ratio metadata, with numeric legacy read compatibility
- [Solo Group Support](decisions/solo-group-support.md) — single-member groups work; onboarding story names the solo path, while the shared member-step helper remains generic
- [Onboarding Persistence](decisions/onboarding-persistence.md) — resumable but sequential standard setup, hydrated group/category guards, and atomic import-specific completion
- [Import / Export Design](decisions/import-export.md) — version 2 snapshots, bounded streamed intake, payment-aware safe nets, validation limits, and atomic fresh-ID import
- [Whole-App Backup and Restore](decisions/full-backup.md) — replace-only recovery with streamed actual-size quotas and shared validation; no deleted-group payment history in later snapshots
- [Expense Edit and Delete](decisions/expense-edit-delete.md) — reference-only quick changes, preserved metadata, atomic deletion/activity/receipt cleanup, and payment-aware balance validation
- [Group Deletion](decisions/group-deletion.md) — atomic expense/payment/receipt cascade with payment-aware warnings; only group-created/deleted activity and contacts survive
- [Money Representation and Rounding](decisions/money-representation-and-rounding.md) — fixed-hundredths storage, exact large BigInt summaries, deterministic splits, and payment-aware net guards
- [Iconography](decisions/iconography.md) — PNG picker, offline caching/repair, unknown-icon fallback without record resets, and Lucide controls
- [Confirmation Dialogs](decisions/confirmation-dialogs.md) — shared destructive confirmation including payments, with expense/payment blocker links
- [Selection Controls](decisions/selection-controls.md) — native checkboxes/radios with selected and visibly locked states across forms, filters, and transfer
- [Offline Payment Recording](decisions/settlement-recording.md) — MoneyInput payments, exact local dates and Clear time, expense-date/added-date history; latest evidence is in Testing Strategy
- [String Input Normalization](decisions/string-input-normalization.md) — create/edit normalization versus exact payment dates/restored snapshots; explicit blank suggestion semantics
- [Testing Strategy](decisions/testing-strategy.md) — consolidated audit/commit handoff, executed checks and retry history, 580 browser/672 unit/36 landing/seven recovery passes, and pending work

### Systems
- [IndexedDB Schema](systems/indexeddb-schema.md) — version 3 payments, additive descriptions, persisted transaction-time cleanup, and preserved payment recorder metadata

### Debugging
- [Browser App Installation](debugging/mobile-pwa-install.md) — Netlify manifest response type, five-day install reminders, and Settings retry

### Workflows
- [Development Tools](workflows/development-tools.md) — development/build-time opt-in panel, realistic presets, atomic sample replacement, and sequential creation boundaries
- [Onboarding](workflows/onboarding.md) — stable intro rows, themed restore chooser, modal category/person drafts, and a fixed mobile currency heading above scrolling choices
- [Group Creation](workflows/group-creation.md) — standalone 4-step flow, cross-group category suggestions, and sequential save after final submission
- [Main Screen](workflows/main-screen.md) — recording/form entry guards, recent-expense order and optional details, repaired browser assumptions, and passing focused follow-up
- [Paid-By](workflows/paid-by.md) — shared capped/grouped contributions and suggestions, preserved remainder behavior; scoped payer browser follow-up passes after visible-label test fixes
- [People Directory](workflows/people-directory.md) — mobile More entry, all-width editors, persisted expense/payment deletion guards, and atomic membership/ranking cleanup
- [Member Management](workflows/member-management.md) — all-width editors, persisted linking/removal/self guards, and cross-tab UI-sync limits
- [Category Management](workflows/category-management.md) — persisted uniqueness/reference/last-category guards, sequential creation limits, and pending deactivation controls
- [Tag Management](workflows/tag-management.md) — Optional details entry, transactional expense/payment cleanup, and payment-aware confirmation counts
- [Filtering](workflows/filtering.md) — ten sorts/payment merging and mobile Sort, repaired disappearing-radio test actions, and passing focused regressions
- [Dashboard](workflows/dashboard.md) — mobile More, recent-expense group order, payment-aware activity, and exact BigInt cross-group balance/spending summaries

### Ideas (captured, not committed)
- [Rewarded Ads](ideas/rewarded-ads.md) — uncommitted opt-in ad-watch/credits idea; no approved monetization strategy
- [Itemized Split](ideas/itemized-split.md) — exploratory receipt-item assignment/OCR idea, separate from implemented receipt-file transfer
- [Category Settings UI](ideas/category-settings-ui.md) — data layer built (DB-backed master/default category lists); settings screen still TODO

### Research
- [Competitive Landscape](research/competitive-landscape.md) — dated competitor lessons/landing direction and local landing browser evidence; not fresh competitor verification
- [Market Opportunity](research/market-opportunity.md) — dated research hypotheses; third-party Splitwise CSV import is not implemented
- [User Pain Points](research/user-pain-points.md) — dated complaint synthesis, not a fresh external competitor/protocol audit
- [Monetization Model](research/monetization-model.md) — unimplemented dated pricing/packaging proposal, not a verified blanket competitor claim

---

## Implementation Status

| Area                               | Status      |
|------------------------------------|-------------|
| Project scaffold                   | DONE        |
| Routing and responsive app shell   | IN PROGRESS |
| IndexedDB layer + Zustand store    | DONE        |
| Onboarding flow (5 steps)          | DONE        |
| Dashboard / groups list (home)     | IN PROGRESS |
| Group detail routes                | DONE        |
| Group overview                     | DONE        |
| Group creation flow                | DONE        |
| People directory (friends list)    | IN PROGRESS |
| Member management                  | DONE        |
| Category management                | IN PROGRESS |
| Tag management                     | IN PROGRESS |
| Add expense                       | DONE        |
| Edit / delete expense             | DONE        |
| Optional expense descriptions     | SCOPED VERIFIED |
| Shared monetary input/formatting  | SCOPED VERIFIED — TEST-ONLY FOLLOW-UP PASSES |
| Split types (5 types)              | DONE        |
| Paid-by (frequent payers UI)       | DONE        |
| Expense list + filtering           | DONE        |
| Mobile expense-form scroll/actions | AUTOMATED VERIFIED |
| Balances / who-owes-whom view      | DONE        |
| Offline repayment recording        | DONE        |
| Receipt attachments                | PENDING     |
| Group settings + deletion          | DONE        |
| Group transfer (Link / CSV / ZIP)  | DONE        |
| Group duplication                 | PENDING     |
| Whole-app ZIP backup and restore  | DONE        |
| Settlement sharing                | PENDING     |
| Installable/offline PWA support    | IN PROGRESS |
| Automated tests                    | IN PROGRESS |

The Contacts screen supports contact CRUD and is now reachable on mobile through dashboard More →
Contacts (`/friends`). The expanded dashboard row also exposes app Analytics, Import, Restore,
and Settings. Revised navigation coverage passes the final 2026-10-11 full browser suite.
See [[people-directory]] and [[dashboard]].

The IndexedDB layer and Zustand store are complete for the current development scope. Dexie
version 2 adds activity events and version 3 adds payments without clearing existing data. All group-detail
destinations have routes, but several are lightweight or partial. Dashboard-level footer
destinations have routes, although some remain lightweight; see [[layout-architecture]].

Balances include recorded payments made outside the app; the suggestions themselves are read-only.
Payments do not rewrite expenses or spending analytics. See [[settlement-recording]] and
[[balance-calculation]].

Both reviewed defects are fixed for current writes: persisted tag cleanup cannot recreate deleted
expenses or overwrite newer edits, and saved ratio text preserves accepted shares through
reopening and editing. Legacy numeric ratio records remain readable, but digits already lost
cannot be recovered automatically; invalid legacy inputs need correction before saving. See
[[tag-management]] and [[expense-edit-delete]].

Expense filtering is implemented across eight logical fields with cross-field AND matching,
within-field OR selection, URL-backed state (not IndexedDB persistence), active counts, and distinct
empty states. Utility tests cover the current predicate and validation contract; browser suites
exercise filters on desktop and mobile in the passing full suite.
Selected IDs deleted on another group route are removed automatically when the list remounts.
Ten URL-backed sort modes apply after filtering without increasing the active count, including
single-category and exact tag-set grouping. See [[filtering]].

Group transfer is implemented as selective snapshot export and fresh editable import. Link is
bounded to 32,000 characters without receipts; CSV carries typed data without blobs; ZIP optionally
carries verified receipts. Fresh group-owned IDs, count/reference/integrity validation, recipient
identity mapping, default categories, same-name numbering, and the complete IndexedDB transaction
have passing desktop/mobile browser journeys in the 2026-10-10 post-scaling full suite, including
opening the export questionnaire. Settlement Link/PDF/Excel
sharing remains separate and pending.
See [[import-export]] and [[testing-strategy]].

The production build now has install metadata, a five-day install reminder with a Settings retry, an offline app
shell, background verified icon downloads with incremental repair, and a user-controlled update prompt. Desktop/mobile-emulated PWA
browser checks cover offline launch and cache repair. A real two-deployment update rehearsal,
storage pressure behavior, and versioned IndexedDB upgrades remain release checks; caches cannot guarantee
permanent storage. See [[mobile-pwa-install]], [[iconography]] and [[product-roadmap]].

---

## Key Invariants (Quick Reference)

1. Expense creation and editing enforce `sum(paid[].amount) == sum(owes[].amount)` with positive totals and safe-integer hundredths
2. People are global (one device-local directory); a group member is a link to a person, so the same person in two groups is one Person referenced twice
3. Balance = expense paid − expense owed + external payments made − external payments received (per member, per group); spending totals remain expense-only
4. Categories can be renamed and guard-deleted now; new expenses omit inactive categories, while an edit may retain its current inactive category; the management toggle is planned
5. No global user in MVP/V2 — only a device-local `localUser`
6. Group creation automatically adds the LocalUser as a Member linked to their self Person; the picker excludes existing members, `addMember` atomically verifies referenced group/person existence and rejects duplicate links; `removeMember` blocks removing the local user, and `removePerson` checks persisted identity to block directory-wide self deletion
7. `categoryId` is mandatory on every expense — no uncategorised expenses
8. Currency is single per group (defaults to INR); Settings can relabel saved numbers without exchange conversion after confirmation — no mixed-currency expenses in MVP
9. Tags are named and colored group-scoped records referenced optionally by expenses and payments; deletion updates persisted tag references in one transaction without recreating deleted records
10. Creation UIs require at least one selected category; group and category writes are sequential, so this is not an atomic database invariant
11. Expense creation and editing parse and store fixed integer hundredths for every currency; splits use deterministic largest-remainder allocation, and displays always use two decimal places
12. Expense creation and editing reject group spending above `Number.MAX_SAFE_INTEGER` hundredths, with updates replacing the old amount; a separate payment-aware balance check protects each derived member net during expense/payment writes and deletions
13. Shares and percentage metadata are written as validated decimal strings and calculated with scaled BigInt weights; monetary adjustments remain integer hundredths. Legacy numeric ratios remain readable without automatic precision recovery
14. Export rejects inconsistent persisted receipt ownership before counting omissions; import never overwrites or merges a source group, creates fresh group-owned IDs in one transaction, and rehydrates Zustand only after commit
