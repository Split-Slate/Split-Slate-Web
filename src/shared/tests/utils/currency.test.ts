import { describe, expect, it } from "vitest";

import { formatCurrency } from "@/shared/utils/currency";

describe("formatCurrency", () => {
  it.each([
    ["INR", 12345, 123.45, 2],
    ["JPY", 50000, 500, 2],
    ["BHD", 125, 1.25, 2],
    ["AFN", 123, 1.23, 2],
    ["USD", -125, -1.25, 2],
  ] as const)(
    "formats %s hundredths at the display boundary",
    (currency, amount, expected, decimals) => {
      expect(formatCurrency(amount, currency)).toBe(
        new Intl.NumberFormat(undefined, {
          style: "currency",
          currency,
          currencyDisplay: "narrowSymbol",
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(expected),
      );
    },
  );
  it("relabels the same stored amount without changing its numeric value", () => {
    for (const currency of ["INR", "USD", "JPY", "BHD"]) {
      expect(formatCurrency(12345, currency)).toContain("123.45");
    }
  });
  it("retains the last cent at the maximum safe integer", () => {
    const expected = new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
    }).format("90071992547409.91" as unknown as number);
    expect(formatCurrency(Number.MAX_SAFE_INTEGER, "USD")).toBe(expected);
    expect(formatCurrency(Number.MAX_SAFE_INTEGER, "USD")).not.toBe(
      formatCurrency(Number.MAX_SAFE_INTEGER - 1, "USD"),
    );
  });

  it("keeps locale-based grouping by default while supporting explicit display preferences", () => {
    const amount = 123456789;
    expect(formatCurrency(amount, "INR", { locale: "en-IN" })).toBe("₹12,34,567.89");
    expect(formatCurrency(amount, "INR", { locale: "en-IN", grouping: "international" })).toBe(
      "₹1,234,567.89",
    );
    expect(formatCurrency(amount, "INR", { locale: "en-US", grouping: "indian" })).toBe(
      "₹12,34,567.89",
    );
    expect(formatCurrency(amount, "INR", { locale: "en-IN", grouping: "none" })).toBe(
      "₹1234567.89",
    );
    expect(amount).toBe(123456789);
  });

  it("retains locale decimal separators, currency placement, and negative signs", () => {
    const options = { locale: "de-DE", grouping: "international" } as const;
    expect(formatCurrency(-123456789, "EUR", options)).toBe(
      new Intl.NumberFormat("de-DE", {
        style: "currency",
        currency: "EUR",
        currencyDisplay: "narrowSymbol",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(-1234567.89),
    );
    expect(formatCurrency(123456789, "EUR", { ...options, grouping: "indian" })).toContain(
      "12.34.567,89",
    );
    expect(formatCurrency(12345, "USD", { locale: "en-US", currencyDisplay: "code" })).toContain(
      "USD",
    );
  });

  it("groups localized digits without replacing locale literals or fractional text", () => {
    const options = { locale: "ar-EG", grouping: "international" } as const;
    const expected = new Intl.NumberFormat("ar-EG", {
      style: "currency",
      currency: "USD",
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true,
    }).format(-1234567.89);
    expect(formatCurrency(-123456789, "USD", options)).toBe(expected);
  });

  it.each(["international", "indian", "none"] as const)(
    "retains maximum-amount cents with %s grouping",
    (grouping) => {
      const options = { locale: "en-US", grouping };
      const formatted = formatCurrency(Number.MAX_SAFE_INTEGER, "USD", options);
      expect(formatted).toContain(".91");
      expect(formatted).not.toBe(formatCurrency(Number.MAX_SAFE_INTEGER - 1, "USD", options));
    },
  );

  it.each([0.1, NaN, Infinity, Number.MAX_SAFE_INTEGER + 1])(
    "rejects invalid stored monetary numbers %j rather than formatting rounded data",
    (amount) => {
      expect(() => formatCurrency(amount, "USD")).toThrow("safe integer");
    },
  );
});
