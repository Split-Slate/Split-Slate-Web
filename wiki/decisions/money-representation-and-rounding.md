---
name: money-representation-and-rounding
description: How Split Slate stores money and deterministically allocates indivisible remainders
metadata:
  type: decisions
---

# Decision: Money Representation and Rounding

Purpose: prevent floating-point accounting errors while guaranteeing that every computed split
adds back to its expense total.

Last updated: 2026-10-12

## Implementation Status

Implemented for expense/payment creation and editing, filtering, display, and group currency relabeling.
`shared/utils/money.ts` parses decimal strings with BigInt arithmetic into fixed integer
hundredths for every supported currency. The formatter always shows two decimal places, regardless
of locale or ISO defaults. Persisted amounts remain safe-integer numbers; derived cross-group
summaries may use BigInt to retain totals above the persisted-number limit.

The split calculator uses exact integer quotas, largest remainders, and ascending member IDs for
ties. Shares/percentage inputs allow six decimal places and use scaled integer ratios. The form
and store reject invalid amounts and unbalanced contributions for creation and updates.

Development IndexedDB was cleared before the fixed-hundredths change. At that time no saved records
or transfer files required money migration, so the transfer schema retained its version. This is a
historical migration decision, not a claim that the app has never been deployed. See
[[indexeddb-schema]].

## Currency-Independent Hundredths

- Accept at most two fractional digits for monetary input in every supported currency. Persist
  and calculate amounts as safe integer hundredths, including paid/owed rows and adjustment
  metadata; preserve exact integer allocation and balanced-split guarantees.
- Treat group currency as a display/grouping label, not the scale of persisted monetary amounts.
  Changing it when expenses exist requires confirmation that existing numeric amounts will be
  relabeled without exchange conversion. A saved `500.00` stays numerically `500.00`.
- Parsing, display, validation, and transfer use the same fixed scale. There is no automatic FX
  conversion and no per-expense currency field.

This decision favors understandable user-controlled currency labels over ISO-specific decimal
precision while keeping integer accounting rather than floating-point arithmetic.

## Decision

Every persisted or derived **monetary** amount uses integer hundredths, independent of currency.

Examples:

- INR 123.45 is stored as `12345`
- USD 12.50 is stored as `1250`
- JPY 500.00 is stored as `50000`
- BHD 1.25 is stored as `125`

The scale is always 100. A currency label change does not change the stored integers.

This applies to:

- `transactions.paid[].amount`
- `transactions.owes[].amount`
- expense totals derived from those arrays
- adjustment split values in `splitMeta[]`
- recorded external payment amounts (`Settlement.amount`)

Shares and percentage metadata are ratios, not money, and therefore do not use hundredths.
Their validated decimal input is stored as text, while computation converts it directly to scaled
BigInt weights with six fractional digits and a maximum weight of `Number.MAX_SAFE_INTEGER`.
This preserves values such as `9007199254.740991` that would round if stored as a Number.
Adjustment metadata remains an integer hundredths number. Legacy numeric ratio records retain
their already-stored precision; the fix does not infer missing digits or silently clamp them.
See [[expense-edit-delete]].

## Input and Formatting Boundary

- Parse user-entered decimal text into hundredths without using binary floating-point arithmetic
  as the accounting representation.
- Reject more than two fractional digits for every supported currency.
- Persist monetary amounts only as finite safe integers; validate with `Number.isSafeInteger` at the
  write boundary.
- Convert hundredths back to entered numeric amounts only at the display boundary before calling currency
  formatting APIs.

## Mandatory Shared Formatting and Input Reuse

All application monetary displays use `src/shared/utils/currency.ts` →
`formatCurrency(amount, currency, options?)`. Its number or BigInt argument is stored/derived integer
hundredths, not a floating-point major-unit amount. Output is display-only text: formatting never
writes to the database or changes calculations. Existing callers retain locale-based grouping,
narrow currency symbols, and fixed two-decimal display. Optional `CurrencyFormatOptions` supports
locale, locale/international/Indian/no grouping, and symbol/narrow-symbol/code/name presentation.
Custom grouping preserves localized digits, decimal separators, currency placement, and signs.
Exact decimal text reaches Intl without conversion to Number so large amounts retain their cents.

All monetary fields must use `src/shared/ui/money-input` → `MoneyInput`, not an ordinary Input with
a feature-local formatter. It wraps the existing React Hook Form Input and uses
`src/shared/utils/amount-input.ts` → `sanitizeAmountInput` and `formatAmountInput`:

- User entry keeps ASCII digits and one `.`; disallowed characters are filtered before limits.
- At most **8 whole digits and 2 fractional digits**, without rounding, from shared constants in
  `src/shared/constants/currency-format.constants.ts`.
- `allowNegative` is enabled only for Adjust; one leading `-` is retained without counting toward
  the digit cap. Other monetary fields discard signs.
- Default input grouping is international three-digit comma grouping, independent of currency.
- Formatting uses raw decimal text to preserve unfinished `12.`, zeros in `12.50`, and exact
  values; `AmountInputFormatOptions` supports international/Indian/no grouping.
- Display commas never enter form values, URL filters, parsed hundredths, or persisted records.
- Caret/selection and comma-aware Backspace/Delete use the shared Input implementation.
- Existing/suggested prefills are formatted, not sanitized or truncated at render time; the cap
  applies when the user changes an input, not when an old/imported amount is opened.
- Invalid URL drafts remain visible for correction rather than being silently rewritten.

Coverage: expense Add/Edit total Amount, payment Add/Settle up/Edit Amount, every payer contribution
(including numeric suggestion placeholders), Unequal owed amounts, signed Adjust amounts, and both
expense amount-filter bounds. Shares and percentages are ratios, not money: their existing
six-decimal precision and range rules remain unchanged. Currency selectors show labels/symbols,
not monetary amounts. Free-text names/descriptions are not monetary inputs.

Options/types and central defaults are extension points for future user preferences; no preference
UI or stored preference is implemented here. Do not introduce fresh currency formatting, grouping
regexes, digit caps, or Number conversions in feature components. Reuse these APIs so future
preferences can change presentation without changing accounting or import/backup contracts.
Format-option/input-limit coverage passed in the scoped 543-case unit/store batch, with lint,
TypeScript, and 17-file formatting also passing. The three-file browser batch had 187 passes,
7 failures, and 4 expected skips; all four affected scenarios subsequently passed on desktop/mobile
in an eight-case focused rerun after test-only fixes. No full-suite/build/PWA rerun is implied;
future execution requires approval. See [[testing-strategy]] for scope and artifacts, plus
[[main-screen]], [[paid-by]], [[split-types]], [[filtering]], and [[settlement-recording]].

## Aggregate Limit

Expense creation and editing cap total group spending at `Number.MAX_SAFE_INTEGER` hundredths. The store
sums persisted paid amounts and the proposed expense with BigInt inside the same transaction as
the expense and payer-ranking writes. A total above the limit rejects the save with a visible
error and leaves the expense history and ranking unchanged; the form retains its inputs. Updates
exclude the old expense before adding its replacement, so its total is not counted twice.

Individually valid expenses can otherwise overflow a derived total and make the safe-integer
formatter throw during rendering. With nonnegative balanced transactions, bounding total group
spending bounds expense-only paid, owed, and net amounts. Recorded payments can exceed those
expense-only bounds; `calculateBalances` separately rejects unsafe final member nets inside
expense/payment write and deletion transactions. It accumulates with BigInt so offsetting payments
are evaluated exactly. Concurrent saves are
serialized by the transaction, so they cannot independently pass against an outdated total.

This guard applies to creation and updates; it does not repair existing invalid development data.
The implemented group-transfer import enforces the same limit. See [[import-export]] and
[[state-management]].

Valid individual groups can exceed the number limit when combined. Dashboard get/give and
cross-group category spending accumulate exactly with BigInt; shared formatting accepts those
derived totals without converting them to Number or imposing a device-wide spending cap. Group
amounts and storage schemas stay unchanged. Charts use bounded presentation percentages, never
those approximate ratios for accounting. Payment editing similarly undoes the edited payment with
BigInt after validating saved final nets, so an unsafe intermediate net cannot crash its modal.
See [[dashboard]] and [[settlement-recording]].

## Deterministic Split Rounding

Equal, shares, percentage, and adjustment splits may produce fractional hundredths. Split Slate
uses the **largest remainder method**:

1. Compute each participant's exact mathematical quota from the integer total.
2. Give each participant the floor of that quota in hundredths.
3. Calculate how many hundredths remain unallocated.
4. Assign one remaining hundredth at a time to participants in descending order of fractional
   remainder.
5. Break equal fractional remainders by ascending `memberId` so the result is stable across runs and
   devices.

The resulting `owes[]` values are stored explicitly. They are not recomputed during ordinary reads.

For adjustment splits, validate the exact final quotas as non-negative, then apply the same
allocation method to those final quotas. Manually entered exact amounts and payer contributions
are already hundredths. Blank fields in those modes share the remaining amount using deterministic
equal allocation; explicit and resolved amounts must sum exactly. See [[paid-by]] and [[split-types]].

## Required Invariants

At an expense write boundary:

- every monetary amount is a finite safe integer
- no paid or final owed amount is negative
- every referenced member belongs to the expense's group
- `sum(paid[].amount) == sum(owes[].amount)`
- the common sum is the expense total
- total group spending after the write must not exceed `Number.MAX_SAFE_INTEGER` hundredths

Intermediate adjustment metadata may be negative, but it cannot produce a negative final owed
amount.

## Why

- Decimal currency values cannot be represented reliably with unrestricted binary floating point.
- Integer totals make equality validation exact rather than tolerance-based.
- Largest-remainder allocation preserves the total while minimizing per-participant rounding
  error.
- A stable tie-break makes editing, import, tests, and future synchronization reproducible.

## Consequences

- Form parsing and currency formatting use a fixed hundredths scale for every currency label.
- Split calculations and filtering are tested with zero-, two-, and three-decimal ISO currency
  labels while accepting at most two decimal places for all of them.
- Import validation rejects non-integer monetary data in the current transfer schema.
- Mixed-currency expenses remain out of scope; one group currency defines the unit for every
  expense in that group.

## Related

- [[domain-models]] — monetary fields on Expense transactions and adjustment metadata
- [[split-types]] — formulas that feed deterministic allocation
- [[expense-model-design]] — why final paid and owed values are persisted
- [[expense-edit-delete]] — exact ratio edits and legacy numeric metadata limits
- [[balance-calculation]] — integer transaction amounts consumed by balance helpers
- [[import-export]] — portable formats must retain integer amounts and currency metadata
