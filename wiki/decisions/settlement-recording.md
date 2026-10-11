---
name: settlement-recording
description: Device-local recording of external payments within one group
metadata:
  type: decisions
---

# Decision: Offline Payment Recording

Purpose: distinguish recorded external repayments from expenses, payment processing, and cross-group netting.

Last updated: 2026-10-11

## Decision

The device owner may record a payment made **outside Split Slate** between any two members of a
group. One record belongs to one group; the user divides a real payment covering multiple groups
into separate records themselves. A record stores payer, recipient, positive integer hundredths,
editable local date/time, recording member and time, and optional group tag IDs. It has no category
or split allocation. Records may be edited or deleted; deleting one does not reverse a real-world
transfer. There is no money movement, automatic confirmation, sync, currency conversion, or
cross-group allocation/netting. See [[domain-models]].

**Add payment** accepts a positive amount. **Settle up** preselects a suggested payer, recipient,
and amount. A value above the current suggested amount shows a warning but remains saveable; actual
overpayments can reverse a member's net position. Suggestions themselves are not records.
The Add, Settle up, and Edit actions open a payment modal. Payer and recipient use searchable
avatar-and-name group-member dropdowns labeled **Paid by** and **Received by**. The shared expense
date/time controls prefill new Add/Settle up payments with today's local date and current local
time at form opening; editing restores the saved local date and time. **Clear time** replaces
**Use current time**, empties Hour and Minute without changing the date or AM/PM setting, and does
not refill automatically. Time remains required before saving. Default/clear/edit browser
coverage passed in the scoped desktop/mobile three-file batch; future execution requires approval.
See [[main-screen]] and [[testing-strategy]].

Shared picker errors are field-specific in every payment modal: date errors appear beneath Date,
time errors beneath Time, and both appear independently when both are invalid. Error styling and
accessible descriptions apply only to the affected field; Hour and Minute share a time message.
Local clock-transition gaps are time errors. Correcting one part leaves any other error visible;
combined date/time save validation and persistence are unchanged. Picker error browser cases passed
in the scoped desktop/mobile batch; shared helper checks passed in the 543-case unit/store batch.
See [[main-screen]] and [[testing-strategy]].

Payment dates share the application's four-digit year entry limit, also applied to expense dates
and From/To date filters. Native date controls use `0001-01-01`–`9999-12-31` bounds, and a shared
limiter discards extra year digits while keeping month/day unchanged. No year-length error is
introduced; shared keyboard tracking blocks extra digits instead of native year rollover, and
clearing/reentry and date-segment navigation remain available. Shared helper and desktop/mobile
year-limit browser cases passed in the scoped verification batch. See [[main-screen]] and
[[testing-strategy]].

Payment Add/Settle up/Edit Amount shares expense input formatting and filtering: three-digit
comma grouping regardless of currency, digits and one decimal point only, and at most eight
whole-number digits plus two fractional digits on user entry, without rounding. Trailing decimal
points/zeros and caret-aware comma deletion are preserved; commas never enter form values or
persisted hundredths. Existing and suggested prefills are displayed without silently truncating
their amounts. Positive/safe-integer validation and overpayment warnings are unchanged. The shared
date and hour/minute inputs also have matching font family, 0.9375rem size, and 800 weight. Payment
amount and typography cases passed on desktop/mobile in the three-file browser batch. See
[[testing-strategy]], [[main-screen]], and [[money-representation-and-rounding]].

These payment fields use `src/shared/ui/money-input`, also shared by payer contributions,
Unequal/Adjust splits, and amount-filter bounds. The wrapper owns filtering, limits, caret-aware
grouping, and numeric placeholder formatting; payment components no longer supply their own
sanitizer/formatter props. Global display and input utilities accept formatting options for a
future preference feature while keeping current defaults and fixed-hundredths storage. Shares and
percentages are not monetary fields. Shared-wrapper browser coverage passed for Add/Settle up/Edit
and non-INR payments in both projects. This scoped verification is not a new full-browser/build/PWA
pass; future monetary fields must reuse the contract in [[money-representation-and-rounding]].

Optional payment tags use compact native checkbox options with 12px-reference label text at every
screen width and a colour dot beside each tag name. The dot uses the saved tag colour and is
decorative; the tag name remains the checkbox's accessible label. Selection, keyboard handling,
and saved tag IDs are unchanged. Record, Settle up, and Edit share these controls. The colour/sizing
browser cases at mobile/tablet/desktop widths and in light/dark themes pass in the final 2026-10-10
full suite. Production smoke checks also verify the saved-colour dot and compact text with long tag
names at 280–1920px. See [[selection-controls]], [[tag-management]], and [[testing-strategy]].

Balances add payments made to each payer's net and subtract payments received from each recipient's
net, without modifying expenses. Expense spending totals, categories, insights, and filtering remain
expense-only. Payments appear as green blocks with a transfer icon in unfiltered date-sorted group
history, recent Overview entries, and recorded-payment history on Balances. Expense filters and
non-date sorting hide payment blocks in the ledger with an explanation; Balances still shows them.
See [[balance-calculation]] and [[main-screen]].

The **Expenses** choice in selective group export also includes payment records, with member and
optional tag references remapped on fresh import. Version 2 group transfers include them; signed
version 1 transfers import with no payments. Whole-app backups preserve payment rows and payment
activity events and accept older backups without either field. Member/person removal checks payment
references; tag deletion clears payment tag IDs; group deletion removes its payment rows. See
[[import-export]], [[full-backup]], and [[indexeddb-schema]].

## Deferred

Cross-group settlement, automatic allocation of one transfer among groups, exchange conversion,
cross-group netting, and human-readable settlement sharing are separate future decisions. See
[[product-roadmap]].
