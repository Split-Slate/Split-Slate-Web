---
name: import-export
description: Durable group transfer through selective Link, CSV, and ZIP snapshots
metadata:
  type: decisions
---

# Decision: Import / Export Design

Purpose: define offline group transfer and distinguish it from human-readable PDF reports and
future settlement links/spreadsheets.

Last updated: 2026-10-21

## Decision

Import/export is a **durable group-transfer mechanism**. A recipient validates the package and
creates a new editable local group; there is no temporary read-only share mode. Transfer is a
snapshot, not synchronization: later changes on either device do not propagate or merge.

Human-readable reporting is separate from group transfer. Direct PDF reports are implemented in
`src/features/reports/`; settlement-specific Link/Excel sharing remains pending. Reports are not
importable group snapshots and cannot restore an editable group. See [[filtering]] and
[[balance-calculation]]. The roadmap's older future-PDF wording awaits a separately proposed correction.

## Direct PDF Reports

The user approved direct file downloads rather than browser printing, specifically for installed
PWA use. `pdfmake` is the selected renderer: the reports are table-heavy, need repeated headings
and multipage tables, and retain configurable fonts, colours, spacing, borders, and page furniture.
The browser PDF engine and its Roboto virtual font files are dynamically imported bundled JavaScript;
generation does not fetch a remote font, upload group data, open a window, or invoke printing.
The production build passes, and desktop/mobile-emulated Chromium smoke checks confirm the worker
precaches the renderer/font chunks before any PDF generation: first-ever expense and balance
downloads then succeed offline. This does not establish installed-app or OS download handling.

- **Expenses → Download PDF → Choose PDF fields → Generate PDF:** only this action opens an options
  modal. The checkboxes are Expense name, Amount, Paid by, Expense date, Added date, Category, Tags,
  Description, Split method, and Member shares. Sl. No. is always included and is never a checkbox;
  at least one selectable field is required even though serial numbers are automatic. Defaults are
  expense name, amount, paid by, expense date, and member shares. Selected fields with values are
  printed in **one expense table**. There is no separate share matrix,
  horizontal member band, member-total summary, or stacked Paid/Owes cell. A share-only selection
  prints Sl. No. and the member-share columns without exposing unselected expense names or metadata.
  Selected checkboxes display their 1-based selection position inside the box instead of a checkmark.
  Selecting appends a field; removing it renumbers the remainder, and reselecting appends it at the
  end. Sl. No. always stays first. Member shares expands as a block at its selected position, with
  members in group order. Blank-column omission does not reorder the surviving fields or members.
  Total spending appears in the heading only when Amount is selected. Report context still includes
  group currency, generation time, filters, sort, and counts.
- On Generate, Expenses revalidates the current filters and reuses the list's exact filtering/sorting
  helpers. Every matching expense is included. Recorded repayments are excluded even when the
  unfiltered timeline displays them. Invalid filters, groups with no expenses, and valid filters with
  no matches disable downloading and explain why. Availability is rechecked at generation; the data
  compiler and renderer also reject empty report rows. Repayments alone never enable a download.
  Member/payer filters select whole expenses, never
  just the filtered person's share.
- Expense field choices are stored only after successful PDF generation/download initiation in
  localStorage under `split-slate-expense-pdf-options`, as `{ version: 1, fields: [...] }`. Every
  successful generation saves the latest selection **and order**. Validation/loading deduplicate
  without restoring a predefined order; loading removes unknown fields while preserving known order.
  Each new modal open reloads these preferences;
  Cancel, Close, Escape, empty selections, blocked generation, and failures do not save drafts. This is one
  device/browser-wide expense preference, not a per-group or balance preference. Missing, corrupt,
  blocked, empty, unsupported-version, or wholly obsolete preferences fall back to defaults; known
  saved fields survive removal of unknown fields. Failed storage writes do not block the download
  and show a message that the choices could not be remembered.
- **Balances → Download PDF:** remains a direct download, with no modal, preferences, or configurable
  fields. Its fixed candidate column order is **Sl. No. | Date | Expense name | Amount | Paid by | Category |
  Tags | each member's share**. It includes all group expenses and then member balances, recorded
  repayments, and suggested payments. Expense-list filters and expense-PDF preferences never narrow
  or alter it. Empty columns are omitted without changing this relative order. Groups without expenses
  cannot download it, even if they have repayments. Suggestions are labelled as suggestions, not actual
  payments or original bilateral debts.
- Dates in expense-table columns are the local expense date and, when selected, local added date.
  Paid by comes from actual paid allocations, not the recorder: a single payer shows their name;
  multiple payers show each contributor's name and exact contribution. Member share columns show
  only the saved monetary owed allocation, not signed debit/credit pairs or ratio weights. A missing
  allocation is blank, and an explicitly saved zero remains `0.00`. Ratios never recompute owed amounts.
- Both PDFs omit columns whose values are blank throughout every report row, including selected
  fields, individual member-share columns, and optional columns in the balance/payment tables.
  Null/undefined/whitespace-only strings are empty; actual zero amounts/shares are values. Sl. No.
  remains first. A field populated in even one row remains, with its other blank cells intact.
  Omission happens before column sizing and never changes saved selections/order. The modal disables
  Generate if every selected field is empty, with an explanatory message; data preparation and the
  renderer recheck this rather than producing a Sl. No.-only PDF. Nothing is saved on a blocked attempt.
- The page uses custom dimensions: at least A4-landscape width, widened to contain the widest table
  plus margins when needed, with a fixed 595.28-point page height. There is no A3 width ceiling,
  horizontal member splitting, or repeated expense data. Expenses paginate only vertically, repeating
  column headers. Balances retains its agreed combined fixed columns and separate balance/payment
  sections; those tables use the same content-sizing rules. The supplied external Splid PDF is
  context, not a design to replicate. A PDF table has no HTML-style scrollbar: viewer fit-to-page
  modes may initially shrink the view, and users zoom/pan horizontally at a readable scale.
- Both reports use 10.5-point body text, a smaller title/metadata block, and compact table spacing.
  Each column's content width is the largest bold-header or regular-body line measured using the
  actual bundled PDF font at that size, plus 0.5 point of rounding tolerance and four points of cell
  padding on each side. No guessed character widths, fixed field minima, proportional shrinking,
  or spare-space stretching determine the widths. All-empty columns are omitted, not header-only.
  Existing line breaks remain lines rather than widening to the full multiline string.
- **Description alone** has a 240-point content-width maximum. Ordinary paragraphs use native word
  wrapping; overlong single tokens receive invisible break opportunities without truncation. Other
  fields and member columns have no content-width cap. A measurement-only PDFKit stream uses public
  `font`/`fontSize`/`widthOfString` APIs and the same Roboto files as rendering, then is discarded.
  `createPdfDefinition` is now asynchronous; no extra font package or remote font request is added.
- Widths above the supported 14,400-point PDF page limit are rejected with a plain-language error;
  populated columns are never silently dropped, split, or shrunk to bypass it. A failed generation does not
  overwrite the saved expense-field preferences. This geometry bound is not an expense/member count cap.
- Report data is compiled synchronously from the Generate/direct-download click's in-memory view before asynchronous
  renderer loading. This is not a fresh persisted Dexie transaction or a multi-device snapshot.
  Monetary totals use exact integer hundredths, with BigInt for cumulative repayment totals.
- Download uses a named PDF Blob and a temporary anchor, retaining its object URL for 60 seconds
  before cleanup. Browser/OS handling of downloads still applies; installing a PWA does not give
  arbitrary filesystem access. No report or new financial record is persisted.
- The bundled Roboto font is not a guarantee of every script or emoji glyph. Receipt image
  embedding is not included in this implementation.

Styling and layout live in `src/features/reports/utils/download-pdf.ts`; data preparation and
scope are separate in `report-data.ts`. Unit cases cover data/layout and real PDF byte generation;
desktop/mobile browser cases cover filter-to-renderer handoff, numbered selection order, removal/
reselection and keyboard interaction, preference saving/cancellation/reload, blocked storage,
actual downloads, fixed full-group balance scope, empty-group/no-match/no-field-value guards,
live removal while the modal is open, and retryable errors. Unit cases cover column/block ordering,
empty-column pruning, zeros, and non-mutating omission. The approved initial full batch records
**757 unit passes and one fixture failure across 758 cases/50 files**, passing TypeScript, both
production builds, **22 PWA cases**, and **12 landing cases**. ESLint fails on the render-time
ref-bearing submit callback; formatting flags nine files. The full browser batch finishes with
**617 passes, 44 skips, and seven failures across 668 combinations** in 26.6 minutes, including
**all 28 report-browser cases passing**. Failures are six ambiguous filter-status assertions and
one desktop activity-panel 30-second timeout whose cause is unproven. The unit fixture's saved
arithmetic yields Amy −2833, Bea +2833, Cal 0 and Amy → Bea 2833, not its expected ±1067 nets.

The approved handler/fixture/locator corrections and scoped formatting are applied. Post-repair
lint, formatting, TypeScript, both builds, and an isolated **758-case full-unit run** pass. A preceding
concurrent unit run retains an unrelated ZIP timeout; that case passes unchanged in isolation.
The first 35-case focused browser batch records **31 passes/four failures**. Its approved unchanged
single-worker rerun passes **all 35 cases**, including every report case and all seven original
browser failures, with default timeouts retained. Post-repair production PWA checks pass **all 22
cases**. Separate post-repair production first-use offline expense/balance smoke also passes on both
layouts, including extracted zero/omission/payment amounts. This is not a clean full browser rerun.
See [[testing-strategy]] for the
canonical initial results, retained failures, evidence paths, and follow-up boundaries. Earlier
**12 PDF-unit/TypeScript passes** cover the superseded split-table layout only. No commit, push,
or deployment occurred.

### Supplied Generated-PDF Review — 2026-10-21

The user supplied `weekend-trip-expenses.pdf`: eight matching expenses out of 33, total ₹14,120.00,
12 members, and three pages. Reading its pages showed repeated expense details for three groups of
four member columns, tiny text, oversized empty Tags/Description allocations, an awkwardly broken
Accommodation label, and substantial unused page height. Its MediaBox is already A3 landscape
(`1190.55 × 841.89` points), so changing orientation was not the cause or remedy.

An initial approved repair separated expense details from a Sl. No.-linked share matrix and passed
the earlier focused batch below, including one landscape page for the supplied-size fixture in
memory. The user subsequently chose a single extra-wide table with actual-font content widths and
only Description capped/wrapped. That later decision supersedes the split-table design and its
current-applicability claim, not the historical test result. The updated fixture expects all selected
populated fields and all 12 involved members in one table, omits blank Tags/Description, preserves
exact amounts, and expects a custom-wide
one-page PDF for this dataset; additional cases cover proportional font metrics, no width stretching,
description wrapping, all 25 members without bands, and explicit page-width rejection. These revised
cases have now been exercised in the initial full-unit batch, which retains the separate report-data
fixture failure described above. Real expense, balance, and long-description PDFs were generated
on desktop/mobile Chromium emulation without page errors. Modal screenshots and sampled PDF pages
rendered with `pdftoppm` were visually reviewed. The original-size expense fixture is one
1776.17 × 595.28-point page with blank Tags/Description omitted; long-description output exercises
paragraph/token wrapping and two-page vertical pagination. The synthetic balance layout sample
is not independent financial reconciliation. Evidence is
`/tmp/opencode/verification-pdf-review/results.json`; production first-use offline evidence is
`/tmp/opencode/verification-offline-pdf/results.json`. Extracted offline PDFs retain an explicit
zero share and omit wholly uninvolved Cal's share column; expense preferences remain isolated
from Balances. These sampled checks do not establish exhaustive visual, installed-app/OS,
physical-device, Safari/Firefox, or general script/emoji support. The supplied file remains
evidence of the earlier layout failure; no supplied PDF binary is added to the repository.

### Earlier Focused PDF Verification — 2026-10-21, Superseded Split-Table Layout

The user explicitly approved these two commands for the earlier split-table implementation; both
passed on their first run. This table records that historical scope, not the later full batch:

| Command | Result |
|---------|--------|
| `pnpm exec vitest run src/features/reports/tests/utils/download-pdf.test.ts` | 12 passed in one file; includes separate expense/share tables, the eight-expense/12-member regression, compact empty columns, preserved amounts/serials, larger groups, optional fields, unchanged fixed balance columns, actual PDF bytes, and simulated anchor/URL cleanup |
| `pnpm exec tsc -b` | Passed |

That revision's supplied-size byte regression confirmed one landscape page and embedded fonts;
its multi-page regression also passed. The download unit used a simulated DOM, so those results do not
establish a real browser/OS download, modal behavior, localStorage persistence, or installed-PWA
operation. At that earlier checkpoint, separate report-options/report-data units, browser/PWA
cases, lint/formatting, production builds, real devices, and repaired-PDF visual inspection were
pending. The later approved current-layout batch and sampled reviews are recorded above and in
[[testing-strategy]]; physical-device and installed-app handling remain unverified. The historical
result-documentation step itself ran no additional commands and changed no source.

## Export Questionnaire

Opening **Export group** in Group Settings scrolls the main pane to the revealed questionnaire,
leaving its heading below the sticky group header at any viewport width. Hiding it does not
trigger a scroll.

Group Settings first reads a consistent persisted snapshot and rejects missing, duplicate, surplus,
or cross-expense receipt references even when receipts will be omitted. This keeps source and
omission counts trustworthy. It starts with only **Group information** selected. That required option includes the
group name, icon, currency, and creation metadata and cannot be unchecked. The sender may
independently select:

- categories
- tags
- members (with the referenced Person snapshots)
- expenses and recorded payments (one choice; selecting expenses includes all group payments)
- receipt attachments, shown only when an expense references at least one receipt

Expenses depend on categories and members. Selecting expenses automatically selects and locks both,
with an app-styled native modal that distinguishes the chosen content from the categories and members
added automatically. Deselecting expenses unlocks them without clearing their current selection.
Locked selections use muted rows and explanatory copy so they look unavailable even when
the user points at their labels. Tags remain optional, and omitted tag references are removed from
transferred expenses and payments.

Receipts depend on expenses. Selecting receipts automatically selects and locks expenses, which in
turn selects and locks categories and members. The same modal shows receipts as the chosen content
and expenses, categories, and members as automatically included content. The modal can be
dismissed with its button or Escape. Deselecting receipts leaves the dependency content
selected but unlocks expenses. When receipts are omitted, transferred expenses contain no dangling
attachment references. The manifest records source and included counts so omission is explicit.

## Planned Same-Device Group Duplication

Group duplication is a planned next task, not an implemented export format.
It reuses this questionnaire's selectable group content and dependency rules, but creates a new
local group from the selected content rather than producing a Link, CSV, or ZIP. The original group
is not changed. The exact same-device identity, ID-remapping, and write behavior should be resolved
when designing the clone operation rather than inferred from cross-device import. See
[[product-roadmap]].

## Portable Dataset Contract

Schema version `2` carries:

- the required group snapshot and selection manifest
- source and included counts for categories, tags, members, expenses, payments, and attachments
- selected categories and tags
- selected Member records and snapshots of their referenced global Person records
- selected expenses with paid/owed rows, exact split metadata, and optional plain-text descriptions
- all recorded group payments when expenses are selected; optional tag IDs follow the tag selection
- selected attachment metadata; ZIP additionally carries the receipt blobs
- a SHA-256 digest of the canonical logical dataset

All formats reconstruct and validate the same logical contract. Validation covers schema version,
selection dependencies, declared counts, unique IDs, group ownership, complete references,
paid/owed equality, split metadata, aggregate safe-integer spending, and safe final payment-aware
member nets. Stored owed amounts are not recomputed from split metadata: validation checks
references, metadata shape/ranges, and string-percentage sums rather than proving every stored
allocation matches the split algorithm. Legacy numeric ratio validation is intentionally more
permissive than current string inputs. Any digest, schema, count,
or reference mismatch rejects the complete package before writes. Monetary values remain integer
hundredths under [[money-representation-and-rounding]]. Previously signed version 1 transfers
remain importable: after verification they become version 2 groups with no recorded payments.

Expense `description` is an additive optional nonblank string. It has no schema default, so older
datasets remain description-free and their integrity inputs are not changed. Link compaction,
snapshot selection, and import ID remapping retain the text. Descriptions increase link payload
size; existing URL/decoded-size limits and file fallbacks remain unchanged. This is compatibility
of older files with the updated app, not a promise that older app builds can read new descriptions
or the extended CSV header. Description compatibility/round-trip and actual-import coverage passed
in the focused 299-case expense/import-export unit/store batch. The ZIP-only rerun also passed all
five cases, followed by a passing scoped ZIP-test formatting check. Import/export unit/store cases
also passed within the subsequent 543-case monetary-refactor batch; portable numbers remain
unchanged. See [[testing-strategy]] for the three-file browser batch and passing eight-case test-only
follow-up, and [[money-representation-and-rounding]] for display-only formatting boundaries.

CSV and ZIP retain source IDs. Links replace the group ID and group-owned Member, Category, Tag,
Expense, Payment, and Attachment IDs (including every internal reference) with short, sequential strings
before compression, then reseal the logical dataset. Person IDs remain unchanged for directory
reconciliation. Both old UUID-bearing `v1` links and compact `v1` links validate and import; the
link is still unencrypted. Import always creates a fresh group UUID and fresh IDs for group-owned
records, then rewrites every internal reference. The source group is never overwritten or merged.

## Formats

### Transfer Link

- Validated JSON is zlib-compressed, base64url-encoded, and placed after `/import#v2.`; signed
  `v1` links remain importable.
- Link transfer is available only when receipts are not selected.
- The complete generated URL is capped at **32,000 characters** and decoded JSON at **256 KiB**.
- Group Settings checks link availability as the selected content changes. An oversized selection
  presents the link action as unavailable; selecting it opens an in-app explanation to download CSV
  or ZIP, or select less content. The actual creation still checks the current persisted snapshot
  before yielding a link. The UI does not present the character count to users.
- **Copy transfer link** generates the selected snapshot and copies its URL in one action. A short
  success message appears below that button only after the clipboard write completes; there is no
  read-only link field or separate Copy button. Clipboard failures report an error without claiming
  success, and the user can retry or use CSV/ZIP. Changing the selection clears the success message.
- A regression fixture proves that 25 members, 25 categories, 25 tags, and 50 realistic expenses
  fit beneath the implemented URL limit.
- Link-only short group-owned IDs reduce the compressed URL length; tests compare the result with
  an old UUID-bearing link for a representative group. Person IDs are not shortened.
- Current major browser engines support this size, but no guarantee is possible for every chat,
  email, SMS, scanner, or embedded webview. CSV or ZIP is the fallback when generation exceeds the
  limit or the chosen channel cannot carry the link.
- A truncated or changed payload fails decoding, integrity, or schema validation; partial data is
  never imported.
- When receipts are selected, the link action remains explanatory rather than generating a link:
  it directs the user to ZIP or to deselect receipt files.
- The fragment is client-side but not encrypted. Anyone holding the link can decode the selected
  group data, so the UI displays a privacy warning.

### CSV

CSV is a reconstructable typed-row transfer without receipt blobs. It has one fixed union header and
typed rows for the manifest, group, people, members, categories, tags, expenses, payments, and selected
attachment metadata. Nested values use JSON cells. Every cell is quoted, embedded quotes/newlines
follow CSV escaping, UTF-8 output starts with a BOM, and formula-leading text is tab-prefixed and
restored by the parser.

The current version 2 header includes a `description` column for expense rows. An empty cell means
the logical property is absent, not an empty string injected into the dataset. Description cells
use the same quoting, newline/quote escaping, Unicode, and spreadsheet-formula protection as
other text. The parser also accepts the previous description-free version 2 header (including
payment columns) and the version 1 header (without payment or description columns), preserving
their original integrity inputs before the existing version 1 migration.

The export UI disables CSV while receipts are selected. A standalone CSV import also rejects a
manifest that claims to carry receipts because receipt bytes require ZIP. The older fixed version 1
header remains readable.

### ZIP

ZIP is always available and is the only format enabled when receipts are selected. It contains:

- `manifest.json` — canonical versioned dataset
- `group.csv` — the same logical dataset as typed rows
- `README.txt`
- `attachments/index.json`
- selected receipt blobs under sanitized `attachments/` paths

Creation rejects missing, surplus, or duplicate receipt files, and enforces import-compatible quotas
before returning output: 16 MiB CSV/JSON entries, 64 MiB compressed ZIP, 128 MiB total expanded ZIP,
and 10,000 entries including metadata. Receipt sizes are checked before reading bytes; aggregate
quotas include CSV, manifest, index, and README. CSV creation also rejects output above 16 MiB.
Import requires the manifest and CSV to describe
the same dataset, checks the declared archive paths, verifies each receipt's SHA-256 digest, and
rejects undeclared files. A ZIP without receipts remains a valid transfer option.
Exported group files use the sanitized group name with `.zip` or `.csv`; renaming does not change
their validity. Export and import screens warn users to keep the downloaded contents unchanged,
because changes can invalidate the transfer. The group import picker tells users which kind of file
to find. Choosing a whole-app backup ZIP here shows a **Restore app backup** link instead of a
missing-CSV error; an unrelated or damaged ZIP produces a plain-language error. Conversely, the
restore screen directs group ZIP and CSV files to **Import group**; see [[full-backup]].

## Import Flow

`/import` is public so a fresh device can open a Link or choose a CSV/ZIP before standard onboarding.
The same route is reachable from the welcome carousel and the dashboard.

After validation and store initialization, a matching local group name (case-insensitive, ignoring
outer whitespace) opens **A group with this name already exists** before review or identity choice:

- **Go to existing group** opens the saved group's normal route without importing or changing its
  records. This lets recipients reuse the original shared link as a return entry point.
- **Import as a new group** continues normal review/identity choice and fresh-ID import with the
  numbered destination name. The modal explains that the saved group is not updated or merged.
- Close/Escape cancels without import writes and returns to the file chooser with the URL fragment
  removed. A different validated transfer requires its own choice. If legacy data contains multiple
  same-name groups, the modal exposes each saved destination instead of arbitrarily opening one.

This guard applies to Link, CSV, and ZIP intake. A name match is not proof of a previous import;
wording says the recipient **may** have imported it before. It depends on retained data in the same
browser/profile and does not identify renamed groups or data stored elsewhere. It does not add
transfer provenance, synchronization, deduplication, or a schema migration.

After complete validation, review shows the group name and included counts for categories, tags,
members, expenses, payments, and receipts; it does not reveal item details or receipt previews. It also states
the destination name, omitted receipt count when applicable, identity choice, and default-category
behavior before the single **Import group** action.

Identity behavior:

- When members were transferred, the recipient chooses which member represents them or chooses
  **I'm not listed**.
- On a fresh device, selecting a transferred member creates LocalUser from that snapshot.
- On a fresh device with no transferred member selection, the import-specific identity form asks
  for name and icon and adds the recipient as a member.
- On an existing device, the current LocalUser is mapped to the chosen member or added as a new
  member when **I'm not listed** is selected.
- The selected source member is always remapped to the recipient's local Person, even when their
  source member and Person IDs differ between transfers. Each new group gets a distinct member ID.

If no categories were transferred, the device's configured default categories are created. No tags
or expenses/payments are created when those sections were omitted. Imported group names are trimmed.
Name collisions ignore case and outer whitespace, matching the create/rename uniqueness rule in
[[group-creation]]. If the destination already has the same group name, import uses `Name (2)`, then
`Name (3)`, and so on, skipping suffixes already taken under the same comparison. Existing groups
are never replaced or renamed. Import review and the write operation share the numbering helper;
the write transaction rechecks persisted groups, so a concurrent save can change the final suffix
from the earlier preview. All 17 import-store cases pass after correcting two new fixtures to seal
normalized names before exercising accepted outer padding. The full browser batch passes all
group-name and group-import cases on desktop/mobile, including the existing-group choice and
post-import installation hint. See [[group-creation]] for the full verification counts, retained
failures, and focused reruns; this is not a claim of a single clean full-suite run. Existing
duplicate cleanup and special handling of old backups are out of scope; whole-app restore is
unchanged.

## People Reconciliation and Atomicity

People are global device-local records rather than group-owned records; see
[[global-people-directory]]. The member selected as the recipient is mapped to LocalUser's self
Person. For other transferred people, an existing identical ID/name/icon record is reused. An ID
collision with different details creates a new Person ID instead of overwriting local data.

A different source Person ID with the same case-insensitive name as a local contact is never merged
by name alone. Before import, a modal lists the incoming person with the source group and existing
same-name contacts with their groups. The recipient explicitly chooses **same person** to reuse an
existing contact, or **different people** and distinct final names. They can rename the incoming
person, the existing person, or both. Renaming an existing Person also changes their name in every
other group; the modal warns about this. Same-name people within a transfer also require distinct
names. Cancel writes nothing. Final names, targets, and one-person-per-group membership are
revalidated against persisted data inside the import transaction; unresolved or duplicate names
abort the entire import. A fresh import may still reuse a Person ID with an exact matching snapshot.

The complete import runs in one Dexie transaction across identity, groups, people, members,
categories, tags, expenses, payments, attachments, settings, and activity events. It validates receipt metadata before the
transaction, remaps IDs, applies approved contact renames, writes every selected record, verifies persisted collection counts, and
then commits. Any failure rolls back all import writes. Zustand is rehydrated only after commit.

A fresh or incomplete device is marked onboarding-complete and opens the imported group. An
already-completed device retains its existing onboarding progress record.

A successful import also presents a non-blocking top-bar hint: **Your group is ready. Keep Split
Slate handy.** It explains adding the app to the home screen and offers **Install app**, using the
same native-prompt/browser-instruction flow as Settings. Known installation suppresses the hint;
opening an existing group does not trigger it. Dismissing the hint shares the 24-hour automatic
installation reminder timestamp. See [[mobile-pwa-install]]. New duplicate-choice, unchanged-record,
cancel, separate-import, and installation-hint browser cases are written but unrun.

## Deliberate Limits

- Group CSV and textual ZIP entries are limited to 16 MiB; group ZIP input to 64 MiB and total
  expanded ZIP content to 128 MiB, with at most 10,000 entries. File size is checked before reading;
  direct CSV parsing also checks UTF-8 bytes. Link output remains bounded to 256 KiB after expansion.
- Shared bounded decompression inspects ZIP directory metadata before inflation, rejects duplicate
  file names, and counts actual streamed output using small compressed slices. Local records must
  match the directory, and actual sizes must match declarations; forged sizes cannot bypass quotas.
  Receipt index IDs and archive paths must each be unique. These bounds do not promise constant
  memory or availability on every device; permitted output still needs memory for validation/blobs.
- Choosing to import the same transfer again creates an independent group; a name collision now
  offers opening the saved group first. There is no merge, replacement, or add-new-expenses mode.
- Integrity digests detect accidental change or corruption; they are not signatures or encryption.
- Transfer links are bounded client-side payloads, not server-hosted short links.
- Receipt ingestion/compression in the expense form remains pending even though valid existing
  attachment rows can be transferred in ZIP.

## Related

- [[domain-models]] — transferred entity shapes
- [[state-management]] — atomic import and rehydration boundary
- [[onboarding]] — fresh-device import identity path
- [[indexeddb-schema]] — destination tables
- [[global-people-directory]] — Person reconciliation
- [[money-representation-and-rounding]] — portable amount invariants
- [[main-screen]] — Group Settings export workflow
- [[product-roadmap]] — snapshot transfer and separate future settlement sharing
- [[settlement-recording]] — why group payments travel with the Expenses choice
