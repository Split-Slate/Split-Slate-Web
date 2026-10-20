# Selection Controls

Purpose: keep checkboxes and radios legible and consistent without losing native form behavior.

Last updated: 2026-10-21

## Decision

Visible checkbox and radio inputs retain their native input types, labels, form registration, and
keyboard semantics. A shared `.choice-control` style draws a 20px rounded checkbox or circular
radio with the app's brand colors. Checked, hover, focus-visible, and disabled states use the
existing light/dark theme tokens. `.choice-option` presents selectable rows as compact cards;
disabled required export selections remain visibly checked but use muted rows and explanatory text
to distinguish them from editable choices. Chip-style payer and category radios
keep their native visually hidden inputs, with selection and keyboard focus shown on the chips.

This applies to expense participants, payer mode, categories and tags, expense filters, group
export options, and import identity selection. App settings' Dark theme control is a switch, not
a checkbox or radio, so it keeps its separate switch appearance. Group-creation category and
currency buttons use `aria-pressed` chips rather than native checkbox/radio inputs.

## Ordered PDF Field Selection

The Expenses PDF modal uses numbered native checkboxes: each selected box contains its 1-based
selection position instead of a checkmark. The ordinal overlay is decorative and does not change
the accessible label; an accessible description states the selected position. Native checked state,
labels, keyboard toggling, focus styling, and disabled state remain intact. A react-hook-form
Controller holds the ordered field array rather than relying on grouped-checkbox DOM order.

Selecting appends a field, unchecking removes it and renumbers the rest, and reselecting appends it
at the end. The PDF expands fields in that order after automatic first-column Sl. No., which is not
selectable. Member shares moves as one block with group member order unchanged. Fields empty for
every report row are omitted without changing selected ordinals, saved choices, or remaining order.
Selections/order persist only after successful generation; all-empty selections cannot generate.
Balances has no selection modal and retains its fixed candidate order. All 28 report-browser cases
pass in the original 2026-10-21 full browser batch. Separate production offline smoke checks on
desktop/mobile Chromium emulation assert ordinals 1–5 with the checkmark hidden and expense-only
preferences. All 758 units pass after the fixture correction and isolated recheck; lint, formatting,
TypeScript, and both builds pass. A two-worker focused batch retains four failures, including
desktop numbered/empty-field interactions; the unchanged single-worker recheck passes all 35
selected cases, including all 28 report cases. Post-repair production PWA checks pass all 22 cases,
and first-use offline checkbox/download smoke passes on both layouts. This is not physical-device or installed-app
verification. See [[import-export]] and [[testing-strategy]] for results and limits.

## Related

- [[filtering]] — multi-select expense filters
- [[paid-by]] — payer selection modes
- [[group-creation]] — existing chip-based setup steps
- [[import-export]] — import identity and export content selection
