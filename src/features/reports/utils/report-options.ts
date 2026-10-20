import { z } from "zod";

import type { ExpensePdfField, ExpensePdfOptions } from "@/features/reports/types/reports.types";

export const EXPENSE_PDF_STORAGE_KEY = "split-slate-expense-pdf-options";

export const EXPENSE_PDF_FIELD_OPTIONS = [
  { value: "name", label: "Expense name" },
  { value: "amount", label: "Amount" },
  { value: "paid-by", label: "Paid by" },
  { value: "date", label: "Expense date" },
  { value: "added-date", label: "Added date" },
  { value: "category", label: "Category" },
  { value: "tags", label: "Tags" },
  { value: "description", label: "Description" },
  { value: "split-method", label: "Split method" },
  { value: "member-shares", label: "Member shares" },
] as const satisfies ReadonlyArray<{ value: ExpensePdfField; label: string }>;

const FIELD_VALUES = EXPENSE_PDF_FIELD_OPTIONS.map((option) => option.value);

export const DEFAULT_EXPENSE_PDF_FIELDS: readonly ExpensePdfField[] = [
  "name",
  "amount",
  "paid-by",
  "date",
  "member-shares",
];

export const expensePdfOptionsSchema = z.object({
  fields: z
    .array(z.enum(FIELD_VALUES))
    .min(1, "Select at least one field to generate a PDF.")
    .transform((fields) => [...new Set(fields)]),
});

const storedOptionsSchema = z.object({ version: z.literal(1), fields: z.array(z.string()) });

export const defaultExpensePdfOptions = (): ExpensePdfOptions => ({
  fields: [...DEFAULT_EXPENSE_PDF_FIELDS],
});

export const readExpensePdfOptions = (): ExpensePdfOptions => {
  try {
    const text = localStorage.getItem(EXPENSE_PDF_STORAGE_KEY);
    if (!text) return defaultExpensePdfOptions();
    const stored = storedOptionsSchema.safeParse(JSON.parse(text));
    if (!stored.success) return defaultExpensePdfOptions();
    const fields = [...new Set(stored.data.fields)].filter((field): field is ExpensePdfField =>
      FIELD_VALUES.some((value) => value === field),
    );
    return fields.length ? { fields } : defaultExpensePdfOptions();
  } catch {
    // Corrupt, unavailable, or blocked browser storage must not prevent a PDF download.
    return defaultExpensePdfOptions();
  }
};

export const saveExpensePdfOptions = (options: ExpensePdfOptions): boolean => {
  const parsed = expensePdfOptionsSchema.parse(options);
  try {
    localStorage.setItem(
      EXPENSE_PDF_STORAGE_KEY,
      JSON.stringify({ version: 1, fields: parsed.fields }),
    );
    return true;
  } catch {
    return false;
  }
};
