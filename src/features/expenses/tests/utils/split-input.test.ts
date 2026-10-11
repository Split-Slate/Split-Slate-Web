import { describe, expect, it } from "vitest";

import {
  capPercentageInput,
  previewIncompleteSplit,
  sanitizeDecimalInput,
  sanitizeSplitInput,
} from "@/features/expenses/utils/split-input";

describe("sanitizeSplitInput", () => {
  it("keeps decimal digits without exponent syntax or repeated separators", () => {
    expect(sanitizeSplitInput("12a.3.4e5", "amount")).toBe("12.34");
    expect(sanitizeSplitInput("-1,200.50", "amount")).toBe("1200.50");
    expect(sanitizeSplitInput("9007199254.740991", "shares")).toBe("9007199");
  });

  it("allows a leading minus sign only for adjustments", () => {
    expect(sanitizeSplitInput("-10.25", "adjustment")).toBe("-10.25");
    expect(sanitizeSplitInput("--1.2", "adjustment")).toBe("-1.2");
    expect(sanitizeSplitInput("1-2", "adjustment")).toBe("12");
    expect(sanitizeSplitInput("-20", "percentage")).toBe("20");
  });

  it("keeps the uncapped decimal helper for non-monetary ratio drafts", () => {
    expect(sanitizeDecimalInput("12abc.50")).toBe("12.50");
    expect(sanitizeDecimalInput("-1,200.00")).toBe("1200.00");
    expect(sanitizeDecimalInput("9007199254.740991")).toBe("9007199254.740991");
  });

  it("shares the eight-whole-digit and two-decimal monetary limits", () => {
    expect(sanitizeSplitInput("123456789.999", "amount")).toBe("12345678.99");
    expect(sanitizeSplitInput("-123456789.999", "adjustment")).toBe("-12345678.99");
    expect(sanitizeSplitInput("99.999999", "percentage")).toBe("99.999999");
    expect(sanitizeSplitInput("9007199254.740991", "shares")).toBe("9007199");
  });

  it.each([
    ["", ""],
    ["1", "1"],
    ["1234567", "1234567"],
    ["123456789", "1234567"],
    ["1234567.", "1234567"],
    ["1234567.89", "1234567"],
    ["1.234567", "1.234567"],
    ["1.23456789", "1.234567"],
    ["12.345678", "12.34567"],
    ["12345.6789", "12345.67"],
    ["0.000001", "0.000001"],
    ["00001234.56", "0000123"],
    ["12.", "12."],
    ["12.3400", "12.3400"],
    ["Shares -12,345.6.789e+", "12345.67"],
  ])("silently caps share input %j at seven numeric digits as %j", (value, expected) => {
    expect(sanitizeSplitInput(value, "shares")).toBe(expected);
  });

  it("caps a typed percentage to the remainder after other entered fields", () => {
    expect(capPercentageInput("125", [])).toBe("100");
    expect(capPercentageInput("70", [{ memberId: "a", value: "40" }])).toBe("60");
    expect(capPercentageInput("66.666667", [{ memberId: "a", value: "33.333334" }])).toBe(
      "66.666666",
    );
    expect(capPercentageInput(".5", [{ memberId: "a", value: "50" }])).toBe(".5");
    expect(capPercentageInput("40.", [{ memberId: "a", value: "20" }])).toBe("40.");
  });
});

describe("previewIncompleteSplit", () => {
  const participants = [
    { memberId: "a", value: "25" },
    { memberId: "b", value: "" },
  ];

  it("previews entered percentages against the full total before they add to 100", () => {
    expect(previewIncompleteSplit(10001, "percentage", participants, "INR")).toEqual([
      { memberId: "a", amount: 2500 },
    ]);
    expect(
      previewIncompleteSplit(10001, "percentage", [{ memberId: "a", value: "125" }], "INR"),
    ).toEqual([]);
  });

  it("previews available shares and exact amounts while other entries are blank", () => {
    expect(previewIncompleteSplit(10000, "shares", participants, "INR")).toEqual([
      { memberId: "a", amount: 10000 },
    ]);
    expect(previewIncompleteSplit(10000, "amount", participants, "INR")).toEqual([
      { memberId: "a", amount: 2500 },
      { memberId: "b", amount: 0 },
    ]);
  });
});
