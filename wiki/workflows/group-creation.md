# Group Creation

One-line purpose: the standalone flow for creating a new group after onboarding is complete.

Last updated: 2026-10-17

## Relationship to onboarding

Group creation and onboarding share the same building blocks. The reusable steps — name/icon, currency, categories, and members — are owned by the group-creation domain. Onboarding is a superset: it adds an identity step in front and layers on per-step persistence and resume. The standalone flow reuses the steps directly, with none of that onboarding machinery.

This means the two flows present the same screens for the shared steps, and a change to any shared step affects both. Only copy that must differ (e.g. "Create your first group" vs "Create a group") is parameterised per flow.

## The flow

Four steps, in order: group (name + icon), currency, categories (at least one, defaults pre-selected), members (optional — the creator is always in the group, so a solo group is valid). Each step validates its own slice before advancing. Back is available; the final action is "Create group".

The category editor suggests names/icons already used in other groups from the first typed letter,
including matches inside a name. Choosing one adds that spelling to the in-memory selection; it
does not write a category to the database before final submission. See [[category-management]].

The creator is not added as a member in this flow's member step — they are added automatically when the group is created (see [[domain-models]] invariant on the creator member).

## Group name uniqueness

To avoid ambiguous group references, new group names must be unique across all groups on the
device, regardless of members, icon, or currency. Comparison trims outer whitespace and ignores
case: `Trip`, `trip`, and ` Trip ` conflict. Internal spacing remains meaningful, and the saved
name retains the user's case after trimming.

The standalone name step checks persisted groups before advancing. Creation, onboarding, and
renaming enforce the same rule inside the group write transaction, so stale hydrated state and
concurrent app saves cannot bypass it. Renaming excludes the current group's ID, allowing an
unchanged name or a case-only change. A conflict writes no group, creator member, or activity
change and displays **A group with this name already exists.** against the name field. A conflict
on the standalone final submission returns to the name step without discarding the form draft.

Import uses the same comparison but automatically selects an available numbered name; see
[[import-export]]. This is a forward-write rule, not a database migration: existing duplicates are
not cleaned up or automatically renamed, and whole-app backup/restore behavior is unchanged.
See [[full-backup]] for the snapshot-preserving restore boundary. No special handling of old
duplicate-bearing backups was requested.

Regression tests cover comparison, persistence, concurrency, import numbering, and form errors.
All eight new desktop/mobile group-name browser cases pass in the full browser batch.

### Verification — 2026-10-17

The user approved full automated verification after initially deferring it. Existing passing cases
were not rerun unnecessarily after server interruptions; failed cases received focused follow-up.

- Full unit batch: 702 passed and two new import-fixture cases failed out of 704 across 47 files.
  The fixtures had sealed padded names before transfer normalization. They now seal normalized
  names before exercising outer padding at import; all 17 import-store cases pass on follow-up.
  All 704 cases therefore have passing evidence, but this is not a single clean full-unit rerun.
- Repository lint, formatting, and TypeScript pass after import sorting, scoped formatting, and
  explicit onboarding-setting fixture types. The final PWA-test edits also pass scoped lint/formatting
  and the TypeScript step embedded in the production build.
- Ordinary and `VITE_ENABLE_DEVTOOLS=true` production builds pass. Existing large-chunk and
  service-worker bundler-deprecation warnings remain non-failing.
- Full desktop/mobile browser batch: 595 passed, 44 viewport-specific skips, and one expense-ratio
  test timed out. That desktop case passes unchanged in a focused rerun. All 596 non-skipped cases
  have passing evidence; the original timeout's cause is not established, and a clean full-browser
  rerun is not claimed.
- Production PWA batch: 20 passed and two installed-app cases failed. A startup-wait-only retry
  still failed; the test's `Object.assign` attempted to overwrite the native read-only
  `MediaQueryList.matches` getter and prevented rendering. The test now overrides the mock property
  explicitly, waits for rendered UI and the persisted flag, and asserts no page errors. Both
  desktop/mobile cases pass on focused follow-up, covering all 22 PWA cases without changing
  production behavior or repeating the other 20 cases.

Evidence is retained under `/tmp/opencode/group-names-*.log`, with the original expense-timeout
trace copied to `/tmp/opencode/group-names-expense-timeout-trace.zip` before its focused rerun.
This verifies the local automated scope, not real-device installation, storage pressure, deployed
updates, or unrelated roadmap completion. No commit, push, or deployment was requested.

## Create-on-finish

Nothing is written until the final "Create group" action. Up to that point the form is in-memory,
with a separate memory-only draft mirrored into the Zustand store for live preview. Abandoning the
flow before that action leaves no partial group, categories, members, or people behind.

The final action starts a sequence of database writes; it is not one atomic transaction across
the entire flow. `createGroup` atomically writes the group, creator member, and creation activity
event. Categories and selected member links
are written afterward, one at a time. A newly entered person is added to the global directory
immediately before that person's member link. If a later write fails, earlier successful database
writes remain saved.
"Create-on-finish" describes when persistence begins, not an all-or-nothing commit guarantee.

This is the deliberate contrast with onboarding, which persists each step as it completes so an interrupted first-launch can resume. A returning user creating an Nth group has no resume need, so the simpler create-on-finish model applies.

After creation the user lands on the dashboard, where the new group appears. (The in-group view is a separate, later destination.)

## Related
- [[onboarding]] — the first-launch superset flow
- [[import-export]] — numbered group names use the same collision comparison
- [[full-backup]] — unchanged snapshot-preserving restore behavior
- [[category-management]] — category selection rules reused here
- [[solo-group-support]] — why the members step is optional
- [[domain-models]] — group and member shapes
