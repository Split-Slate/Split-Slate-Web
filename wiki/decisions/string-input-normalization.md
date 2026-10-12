---
name: string-input-normalization
description: How user-provided strings are normalized and rejected at form and store boundaries
metadata:
  type: decisions
---

# Decision: String Input Normalization

Purpose: prevent blank or accidentally padded user input from being accepted as valid or entering
persistent domain state.

Last updated: 2026-10-12

## Decision

Human-entered identity, group, category, tag, and expense text is trimmed before field-specific
validation and persistence. This is not a blanket transformation of every string in the database:
opaque IDs, restored snapshots, and payment date text have separate contracts below.
Required fields reject an empty trimmed value, including input containing only spaces, tabs, line
breaks, non-breaking spaces, or other whitespace. Optional numeric entry fields may use a blank
value with explicit semantics, as described below.

Trimming removes only leading and trailing whitespace. Meaningful internal spaces are preserved;
for example, `"  Goa   Trip  "` becomes `"Goa   Trip"`.

The trimming contract applies to:

- LocalUser and Person names and icons
- Group names, icons, and currencies
- Category names and icons
- Tag names and colors
- onboarding and standalone group-creation form values
- expense names, optional descriptions, amount/date text, and payer/split entry text
- payment amount text through `parseMoney`; payment date text must already match the exact local
  date/time format rather than being trimmed. Its store checks numeric amounts and timestamps

Opaque IDs and optional internal values that users do not enter are outside this blanket
required-string rule; individual schemas may still trim and validate them.

## Expense Blank-Value Semantics

Expense name, total amount, date/time, and category selection are required. The expense form and
store share a Zod schema that trims text before calculating transactions. Blank numeric fields
have defined meanings only where the selected mode allows them:

- Multiple-payer amount: blank selected payers divide the remaining amount deterministically;
  only positive contributions are stored.
- Exact-amount split: blank shares divide the remaining amount deterministically.
- Adjustment split: blank means zero adjustment.
- Shares: selected participants must have positive entered values; blank is invalid.
- Percentages: blank selected fields share the remaining percentage deterministically; explicit
  zero is invalid, and a zero suggestion is omitted from owed rows and metadata. Resolved
  percentages must total exactly 100%.
- Unselected participant values and fields belonging to an inactive payer/split mode do not
  contribute to the saved transactions.

These blanks are form inputs, not empty strings persisted as money. See [[split-types]] and
[[paid-by]].

## Enforcement Boundaries

### Shared Monetary Input

Monetary UI fields must reuse the shared `MoneyInput` and amount-input helpers rather than inventing
feature-local filtering. Typed/pasted entry keeps ASCII digits and one decimal point, then caps at
eight whole digits/two fractional digits without rounding. Only Adjust enables a leading minus.
Display grouping is separate from raw values and never enters form/URL/storage data. Existing
larger prefills and invalid URL drafts are not silently rewritten on load; programmatic/store/import
validation remains independent. Shares/percentages retain their non-monetary ratio precision.
Expanded shared monetary helpers passed in the 543-case scoped unit/store batch. Payer/filter
browser cases passed in the eight-case desktop/mobile rerun after test-only action/selector fixes;
other monetary cases passed in the original three-file batch. See [[testing-strategy]] for scope
and [[money-representation-and-rounding]] for mandatory reuse.

### Optional Expense Description

Descriptions use multiline plain text rather than a rich-text document format. The form and store
trim outer whitespace without changing case, internal spacing, or line breaks. Missing, empty, and
whitespace-only description inputs mean no description: creation omits the property and editing
with a blank field removes a previously saved description. Historical records need no backfill;
editing presents their missing description as an empty field.

Transfer schemas accept an optional nonblank string without introducing a default into old signed
datasets; CSV omits the logical property when its cell is empty. Full backup preserves the optional
string and rejects non-string descriptions. See [[domain-models]], [[import-export]], and
[[full-backup]]. Description normalization/persistence coverage passed in the focused 299-case
expense/import-export unit/store batch and the subsequent scoped 543-case batch. Description
browser cases also passed in both projects after the monetary refactor. See [[testing-strategy]]
for the original browser failures and passing focused follow-up; no fresh full-suite pass is implied.

### Validation Boundaries

Expense `handleSubmit` receives parsed schema values. Some group/setup flows validate with
`trigger` then read raw `getValues`; their store text helpers normalize before writing. Field-specific
rules, such as tag-color format and case-insensitive uniqueness, run against normalized values.
Payment form validation parses amount text and validates exact local date/time text; its store
accepts numeric values rather than string form fields. Full-backup restore preserves validated
snapshot strings and is not an outer-whitespace migration. See [[full-backup]].

Trimming is not performed on every keystroke because that would interfere with ordinary typing.
It occurs when validation or persistence is attempted.

Future forms and mutations must use the shared string-validation helpers or enforce the same
contract at both boundaries.

## Consequences

- whitespace-only input is treated the same as an empty string under the field's required or
  optional semantics
- ordinary create/edit text mutations remove outer whitespace; restored historical snapshots are
  not automatically rewritten
- case and internal spacing remain unchanged unless a field has an additional canonical format
- validation tests must include ordinary spaces, tabs, line breaks, and Unicode whitespace

## Related

- [[testing-strategy]] — required boundary and invalid-input test cases
- [[onboarding]] — identity and first-group form validation
- [[group-creation]] — shared group-building form validation
- [[people-directory]] — person creation and editing
- [[category-management]] — normalized category names and icons
- [[tag-management]] — normalized tag names and colors
