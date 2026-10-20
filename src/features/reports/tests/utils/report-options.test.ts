import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defaultExpensePdfOptions,
  EXPENSE_PDF_FIELD_OPTIONS,
  EXPENSE_PDF_STORAGE_KEY,
  expensePdfOptionsSchema,
  readExpensePdfOptions,
  saveExpensePdfOptions,
} from "@/features/reports/utils/report-options";

const storage = (initial: string | null = null) => {
  let value = initial;
  const getItem = vi.fn(() => value);
  const setItem = vi.fn((_key: string, next: string) => {
    value = next;
  });
  vi.stubGlobal("localStorage", { getItem, setItem });
  return { getItem, setItem };
};

afterEach(() => vi.unstubAllGlobals());

describe("expense PDF options", () => {
  it("uses sensible defaults without writing preferences on read", () => {
    const mock = storage();
    expect(readExpensePdfOptions()).toEqual(defaultExpensePdfOptions());
    expect(mock.setItem).not.toHaveBeenCalled();
    expect(mock.getItem).toHaveBeenCalledWith(EXPENSE_PDF_STORAGE_KEY);
  });

  it("requires an optional field and never offers a serial-number option", () => {
    expect(expensePdfOptionsSchema.safeParse({ fields: [] }).success).toBe(false);
    expect(expensePdfOptionsSchema.safeParse({ fields: ["slno"] }).success).toBe(false);
    expect(EXPENSE_PDF_FIELD_OPTIONS.some((field) => /sl\.?\s*no/iu.test(field.label))).toBe(false);
    expect(expensePdfOptionsSchema.parse({ fields: ["name"] })).toEqual({ fields: ["name"] });
  });

  it("saves selection order and removes duplicates without restoring predefined order", () => {
    const mock = storage();
    expect(saveExpensePdfOptions({ fields: ["tags", "name", "tags"] })).toBe(true);
    expect(mock.setItem).toHaveBeenCalledWith(
      EXPENSE_PDF_STORAGE_KEY,
      JSON.stringify({ version: 1, fields: ["tags", "name"] }),
    );
    expect(readExpensePdfOptions()).toEqual({ fields: ["tags", "name"] });
    expect(saveExpensePdfOptions({ fields: ["date"] })).toBe(true);
    expect(readExpensePdfOptions()).toEqual({ fields: ["date"] });
  });

  it.each([
    "not JSON",
    "null",
    "[]",
    '{"version":2,"fields":["name"]}',
    '{"version":1,"fields":[]}',
    '{"version":1,"fields":["removed-option"]}',
    '{"version":1,"fields":"name"}',
  ])("recovers invalid stored preferences: %s", (text) => {
    storage(text);
    expect(readExpensePdfOptions()).toEqual(defaultExpensePdfOptions());
  });

  it("drops unavailable fields but retains still-supported saved choices", () => {
    storage('{"version":1,"fields":["removed-option","tags","name","tags"]}');
    expect(readExpensePdfOptions()).toEqual({ fields: ["tags", "name"] });
  });

  it("preserves a member-share block in any selected position through validation and storage", () => {
    storage();
    const fields = ["description", "member-shares", "amount", "name"] as const;
    const options = expensePdfOptionsSchema.parse({ fields: [...fields, "amount"] });
    expect(options.fields).toEqual(fields);
    expect(saveExpensePdfOptions(options)).toBe(true);
    expect(readExpensePdfOptions().fields).toEqual(fields);
  });

  it("handles blocked reads and writes without stopping PDF generation", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage blocked");
      },
      setItem: () => {
        throw new Error("Quota exceeded");
      },
    });
    expect(readExpensePdfOptions()).toEqual(defaultExpensePdfOptions());
    expect(saveExpensePdfOptions({ fields: ["name"] })).toBe(false);
  });

  it("does not persist an empty selection", () => {
    const mock = storage();
    expect(() => saveExpensePdfOptions({ fields: [] })).toThrow();
    expect(mock.setItem).not.toHaveBeenCalled();
  });

  it("returns fresh default arrays so cancelled drafts cannot change the defaults", () => {
    const first = defaultExpensePdfOptions();
    first.fields.length = 0;
    expect(defaultExpensePdfOptions().fields.length).toBeGreaterThan(0);
  });
});
