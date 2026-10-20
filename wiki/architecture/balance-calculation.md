---
name: balance-calculation
description: Algorithm for computing net balances and deriving who owes whom
metadata:
  type: architecture
---

# Balance Calculation

Purpose: explain exact member balances and deterministic suggested transfers.

Last updated: 2026-10-21

## Implementation Status

Four pure helpers are implemented in `src/shared/utils/balances.ts`:

- `calculateMemberNet(expenses, memberId, settlements?)` — expense net plus external payments made minus payments received
- `calculateGroupTotal(expenses)` — sums every paid allocation
- `calculateBalances(expenses, memberIds, settlements?)` — includes all members and recorded group payments
- `suggestTransfers(balances)` — returns positive integer transfers that clear a zero-sum balance map

Overview uses `calculateBalances`/`suggestTransfers` and derives spending from category totals;
the sidebar uses `calculateMemberNet`. Dashboard group previews use `calculateGroupTotal`.
The `/groups/:groupId/balances` route shows
all-member balances and suggested payments, updating after expense or payment changes.
Solo groups show zero net and no suggested payments, with explanatory personal-spending copy.

Accumulation uses BigInt internally and returns safe-integer hundredths; changing a group's
currency relabels the same numeric balance without exchange conversion. All-member calculation
rejects missing member references, invalid allocations, and invalid payment amounts or members.
Expense and payment writes/deletions also reject a change that would push a derived member balance
outside the safe-integer range; spending totals alone do not guard against offsetting large payments.
Transfer calculation rejects unsafe/fractional balances and nonzero sums instead of silently
showing incomplete settlements. Neither helper mutates inputs.

## Balance PDF Scope

**Download PDF** on Balances remains direct, with no options modal or saved field preferences.
Its fixed candidate column order is **Sl. No. | Date | Expense name | Amount | Paid by | Category | Tags |
each member's share**. The table covers all group expenses. Member balances, recorded repayment
history, and suggested payments follow below it. Paid by identifies actual contributors rather than
the expense recorder, showing individual contributions for multi-payer expenses. It uses
`calculateBalances` and `suggestTransfers`, so recorded payments affect the statement without
inflating expense spending. BigInt repayment accumulators retain exact totals even when several
large offsetting repayments keep the final net inside the safe-integer range.

Expense-list filters and expense-PDF field preferences do not apply to this fixed full-group
statement. Only the separate Expenses PDF opens a configurable-field modal; it covers matching
expenses, excludes repayments, and explicitly says it is not a full-group settlement statement.
Neither report records a payment, rewrites allocations, or
reconstructs original bilateral debts from the suggested transfers.

Member share cells contain the saved monetary owed amount only, not paid-minus-owed nets or ratio
weights. Absent owed allocations are blank, and a saved zero is displayed as zero. Ratio metadata
never replaces stored owed amounts. Sl. No. is automatic in all report tables. The fixed expense
columns and all member-share columns remain in one table: actual bundled PDF font measurements set
each width from its largest header/body line, without stretching, shrinking, or member bands. The
page widens as needed and paginates vertically only. Columns blank across all rows are omitted,
including Tags and individual member-share columns. Zero shares/amounts are values and remain;
Sl. No. stays first and surviving columns retain the fixed candidate order. The separate balance,
repayment, and suggestion tables apply the same empty-column omission and sizing rules. Description's 240-point wrap
cap applies only to selectable expense PDFs, since Description is not a fixed balance column.

Both report actions are disabled for a group without expenses, even if repayments exist. Availability
is rechecked at generation and empty expense rows are rejected by the data compiler and renderer.
Expense-PDF selected order/numbered checkboxes do not affect Balances. No blank or Sl. No.-only
report is generated, and empty-column omission never edits expense preferences.

PDF creation/download code is in `src/features/reports/`. The earlier 12 focused PDF-unit/TypeScript
passes cover a superseded layout. The current revision's initial batch passes TypeScript, both
production builds, 22 PWA cases, and all 28 report-browser cases within a full browser run of
617 passes, 44 skips, and seven failures. Full units record 757 passes and one incorrect report-data
fixture expectation; its saved arithmetic yields Amy −2833, Bea +2833, Cal 0 and Amy → Bea 2833
in integer hundredths. Initial lint/formatting also fail. Approved corrections are applied;
post-repair lint, formatting, TypeScript, both builds, and an isolated 758-case full-unit run pass.
Intermediate concurrent-unit and focused-browser failures are retained; the unchanged single-worker
recheck passes all 35 selected browser cases and post-repair PWA checks pass all 22 cases. Separate
post-repair offline downloads/text checks pass on both layouts, including saved zero/omission rules
and expected ₹80.01 balances after a ₹20.00 repayment. See [[testing-strategy]] for exact scope.

Desktop/mobile Chromium-emulated expense/balance PDFs were generated and sampled rendered pages
reviewed without page errors. The synthetic balance layout sample is not independent financial
reconciliation. Production smoke checks confirm first-ever expense and balance downloads offline
after renderer/font precaching, retaining zero shares and omitting an uninvolved member's share
column without changing expense-only preferences. This does not establish physical-device,
installed-app/OS handling, Safari/Firefox, or general script/emoji support. See [[filtering]] and
[[import-export]] for download semantics, geometry limits, and evidence. No commit, push, or
deployment occurred.

## Core Formula

For each member within a group:

```
net = expensePaid - expenseOwed + paymentsMade - paymentsReceived
```

- **Positive net** → others owe this member
- **Negative net** → this member owes others
- **Zero** → settled

"Balance" here is NOT a bank balance. It is the net position within a group only.

---

## All-Member Algorithm

Initialize every member's net to zero. For every expense, add each paid allocation to its member
and subtract each owed allocation. For each group payment, add its amount to the payer's net and
subtract it from the recipient's. Convert exact accumulated values to safe integers at the boundary.
Positive values are receivable; negative values are payable. `calculateGroupTotal` and category
analytics still sum only expense allocations. See [[settlement-recording]].

## Deriving Who Pays Whom

1. Separate positive creditors and negative debtors; work with positive remaining magnitudes.
2. Sort each side by largest remaining amount, breaking equal amounts by ascending member ID.
3. Transfer the smaller of the largest debt and credit, then subtract it from both sides.
4. Remove zero remainders and re-sort before the next match.

Each step clears at least one remaining position. This deterministic greedy algorithm is not
guaranteed to minimize the number of transfers. Suggestions are one way to clear the net balances,
not records of original bilateral debts or payments. A suggested transfer pre-fills **Settle up**;
only saving that form creates a payment record. Overpayment is warned about, not blocked.

Ties use IDs, so names and input array order do not change suggested matches. No transfers are
produced for an empty or all-zero balance map.

## Worked Example

**Members:** Alice, Bob, Carol

**Expense 1 — Dinner ₹300**
- paid: Alice ₹300
- owes: Alice ₹100, Bob ₹100, Carol ₹100

**Expense 2 — Taxi ₹120**
- paid: Bob ₹120
- owes: Alice ₹40, Bob ₹40, Carol ₹40

**Net calculation:**

| Member | Paid  | Owes  | Net    |
|--------|-------|-------|--------|
| Alice  | 300   | 140   | +160   |
| Bob    | 120   | 140   | −20    |
| Carol  | 0     | 140   | −140   |

**Suggested transfers before payments:**
- Carol pays Alice ₹140
- Bob pays Alice ₹20

If Carol records an external payment of ₹50 to Alice, Carol's net becomes −₹90 and Alice's becomes
+₹110. The original expenses still total ₹420.

---

## Related

- [[domain-models]] — Expense shape (paid[] and owes[] arrays)
- [[expense-model-design]] — why both arrays are stored on the expense
- [[settlement-recording]] — payment scope, form, correction, and exclusions
