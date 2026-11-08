---
name: expense-edit-delete
description: Rules for editing and deleting expenses in MVP — access, scope, and deletion behaviour
metadata:
  type: decisions
---

# Decision: Expense Edit and Delete

Purpose: document expense correction, permanent deletion, and their persistence guarantees.

Last updated: 2026-11-09

## Implementation Status

Expense detail, editing, list actions/selection, and confirmed single/bulk hard deletion are
implemented. The shared form supports
all five split types, payer/participant changes, optional plain-text description, date/time,
category, and tags. Attachment ingestion
and receipt editing remain pending; updates preserve existing attachment IDs and deletion cleans
up owned attachment records.

Detail also offers immediate category and tag changes without entering the full editor. A focused
persisted-reference update reads the current expense inside an IndexedDB transaction, validates
the chosen category or tags against the expense's group, and changes only those references. A new
category must be active; the current historical category may remain inactive. Tag IDs must be
distinct. Monetary transactions, split metadata, creation fields, attachments, and payer ranking
are not recalculated. Failure leaves the expense unchanged and shows an error for retry; selecting
a different category or toggling a tag saves without a separate Save button. The full editor
remains available for all other changes. See [[category-management]] and [[tag-management]].

## Decision

Expenses will be fully editable and deletable in MVP.

## Access Control

None in MVP. Since the app is single-device and local, there is only ever one person using the app on a given device. Restricting who can edit or delete an expense is meaningless in this context.

Implemented editable fields:
- Expense name
- Description (optional multiline plain text)
- Amount
- When (date + time)
- Category
- Split type and split details
- Paid-by
- Tags

Adding/removing attachments through the editor remains planned with receipt ingestion.

## Edit Behavior

Expense list and recent-overview names link to `/groups/:groupId/expenses/:expenseId`; editing uses
its `/edit` child path. Both screens constrain lookup to the active group and show a not-found
state for missing or foreign IDs.

The editor restores paid amounts, selected participants (including zero allocations), split method,
and saved ratio/adjustment metadata. Payer and participant array order is retained. Newly added
group members are not automatically selected on historical expenses. Exact-amount blanks reopen
as their resolved stored allocations.

Updates preserve `expenseId`, `groupId`, `createdBy`, `createdAt`, and attachment IDs. If the entered
local minute is unchanged, the original `when` timestamp retains seconds and milliseconds. An
expense may retain its existing inactive category; changing to a different category requires an
active one.

Create and update share monetary/reference validation. Updates replace the old amount when
checking the aggregate spending ceiling, and separately validate payment-aware member balances.
The expense and recalculated payer ranking commit in one
transaction; memory changes only after commit. Cancellation writes nothing; failures retain input
and allow retry. Save handlers guard repeated submissions.

Descriptions reopen exactly as saved; historical expenses without the optional property show an
empty field. Saving trims only outer whitespace, preserves internal spacing/line breaks, and a
blank field clears the saved property. Quick category/tag changes preserve the description because
they update only references. Detail shows a full-width themed Description card above Paid by/Split
only when a description is present; it renders plain text with preserved whitespace and safe
wrapping, never HTML. Description store and responsive browser regressions passed in the focused
299-unit/store and six-browser batch before the shared MoneyInput refactor, and again in the scoped
543-unit/store and three-file browser batch. Monetary/historical-prefill cases passed, with all four
initially affected scenarios passing in an eight-case follow-up after test-only fixes. Exact scope
and limits live in [[testing-strategy]]; reuse rules live in [[money-representation-and-rounding]].

### Resolved: Shares Metadata Precision Loss

New expense saves retain validated shares and percentage inputs as trimmed decimal strings in
`splitMeta.value`. Display and form reconstruction preserve that text; allocation continues to use
scaled BigInt weights. The maximum accepted shares value `9007199254.740991` now survives storage,
reload, and a name-only edit without changing allocations. Monetary adjustment metadata remains
an integer number of hundredths. See [[split-types]] and [[money-representation-and-rounding]].

Earlier numeric ratio metadata is still readable and becomes text on a successful validated save.
Already-lost precision cannot be reconstructed: for example, an old numeric record containing
`9007199254.740992` still fails the range check until the user corrects its share input. It is not
silently clamped or rewritten. Even an in-range legacy ratio may have lost digits; the original
input must be re-entered if that precision matters. Rejected edits leave persisted data unchanged.

## Delete Behaviour

**Hard delete** — the expense record is permanently removed from IndexedDB.

### Expense-list actions and selection

The Expenses ledger offers a floating Edit / Select / Delete menu through touch/pen long-press,
desktop right-click, or an explicit per-row action button. Long-press waits 500 ms and cancels
after movement beyond 10 pixels, scrolling, pointer cancellation/release, or window blur.
The menu is positioned beside the press and constrained to the visible viewport; it does not
replace mobile bottom navigation. Outside presses, scrolling/resizing, Escape, and Tab dismiss
it. Arrow keys and Home/End navigate its actions. A completed long-press suppresses its following
row click, and releasing the initiating gesture cannot activate a menu item beneath the finger.

Select enters component-local selection mode with native checkboxes and row highlighting.
Tapping an expense row toggles selection instead of following its detail link. A checkbox replaces
the row's action button in the same reserved slot; titles, tags, dates, and row dimensions do not
shift with selection. The highlight is paint-only rather than conditional margins or padding.
The expense container retains equal padding on all four sides and rows retain their compact
spacing in every state, including when nothing is selected.

The sticky toolbar keeps checkbox + **All** on the left and icon-only Edit/Delete controls on the
right, with the selected count on a second line. All is indeterminate for partial selection and
checked when every matching expense is selected. Clicking the indeterminate control selects all
matching expenses; unchecking the checked control clears selection and exits selection mode.
Manually unchecking the last expense, or losing the last selected row from the hydrated collection,
also exits immediately. There is no Cancel button; Escape remains available. Edit is disabled
unless exactly one expense is selected. Accessible labels remain on the icon buttons.

All includes only the currently matching expenses, never filtered-out rows or recorded payments.
Selection mode is derived from the nonempty live selection. Filter/sort URL changes and source
deletions reconcile local state before the next commit rather than cascading state updates inside
effects. Navigation/remount, Escape, or successful deletion also clears selection. This does not
add automatic cross-tab synchronization. Recorded payments retain their separate controls and
are not selectable as expenses. See [[filtering]] and [[state-management]].

Two gesture ordering guards are required: scrolling a row into view can queue an event before
the menu mounts, so older scroll events must not dismiss the new menu. Releasing a native touch
or pen hold can generate a compatibility mouse-down that focuses the original expense link and
dismisses the menu before a fresh action tap. The gesture hook prevents that compatibility focus
and the following row click, while a genuine new pointer-down or keyboard action clears the
suppression. Suppression is not limited to a short timeout: an extended hold is covered too.

Single-row deletion and selection deletion both use the shared confirmation dialog. It shows
the name or selection count, an exact fixed-hundredths total, the permanent receipt-deletion and
balance-recalculation warnings, and explicitly preserves recorded payments. Cancellation retains
selection; errors keep the confirmation open with retry and leave the selection intact. Pending
confirmation disables repeated submission through the shared dialog.

`removeExpenses` validates a nonempty, duplicate-free ID list and every persisted expense's group
inside one read-write transaction. It validates payment-aware balances for the final remaining
expense set, not intermediate single deletions, then removes owned receipts and expenses, writes
one deletion activity per expense, and updates payer ranking once. Any failure rolls back the
entire selection, including receipts, events, and ranking; Zustand changes only after commit.
`removeExpense` delegates to this same operation with one ID, retaining detail-screen behavior.

The 2026-11-09 closure passes 773 unit/store cases across 50 files and a complete 710-combination
application browser run: 664 passes, 46 expected project/viewport skips, zero failures. All 38
applicable expense-action cases pass, including native mobile CDP touch hold/release and subsequent
real taps, plus two category-image/tag-color marker cases. Layout checks cover long titles, tags,
equal container padding, and stable row geometry at 320px/440px; sampled captures were reviewed.
TypeScript, lint, formatting, both production build variants, 22 production PWA cases, and 12 landing
cases also pass. Initial lint/format failures, premature menu dismissal, a native release failure,
and the older scroll test's stale padding assumption are retained in [[testing-strategy]].
This is Chromium desktop/mobile-emulation evidence, not exhaustive physical-device, Safari/Firefox,
storage-pressure, installed-OS, or successful remote-deployment verification.

**Confirmation:** the detail screen opens the shared in-app [[confirmation-dialogs]] modal, names
the expense, and warns that its receipts will be deleted permanently and balances recalculated.
Cancel or Escape closes it without writing; a failed deletion keeps it open with an error for retry.

**Cascade:** one transaction deletes attachments by their `expenseId` owner index, deletes the
expense, recalculates the group's payer ranking from remaining expenses, and writes deletion
activity. The same transaction first validates remaining payment-aware member balances. Index-based cleanup
includes owned receipts omitted from `attachmentIds` and preserves other expenses' attachments.
Any failure rolls back all writes. Missing/foreign expense IDs are rejected; `updateExpense`
after deletion cannot recreate the expense. The UI guards repeated deletion and offers retry on failure.

**Tag-cleanup interaction:** the stale-tag resurrection bug is resolved. `removeTag` now reads
persisted expenses and updates only existing tag references inside its transaction; it cannot
insert a deleted expense or overwrite a newer edit from hydrated state. Regression tests cover
both stale snapshots and overlapping expense/tag mutations. See [[tag-management]].

## When This Changes

Access control would become relevant if optional synchronization lets multiple users share live
group data. Group roles, administrative controls, read-only access, and paid packaging remain
candidates requiring separate design and approval. The historical V3/Pro labels are not delivery
or pricing commitments; see [[product-roadmap]].

## Related

- [[domain-models]] — Expense shape
- [[indexeddb-schema]] — attachments cascade on expense delete
- [[tag-management]] — persisted-reference cleanup prevents deleted-expense resurrection
- [[import-export]] — imported groups are fresh editable copies and use the same correction controls
- [[product-roadmap]] — current delivery horizons and uncommitted online capabilities
