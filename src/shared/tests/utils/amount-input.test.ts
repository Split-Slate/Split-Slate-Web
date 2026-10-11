import { describe, expect, it } from "vitest";

import { formatAmountInput, sanitizeAmountInput } from "@/shared/utils/amount-input";

describe("sanitizeAmountInput", () => {
  it.each([
    ["", ""],
    ["0", "0"],
    ["1234", "1234"],
    ["1234.", "1234."],
    ["1234.5", "1234.5"],
    ["1234.50", "1234.50"],
    ["1234.56789", "1234.56"],
    ["1234.999", "1234.99"],
    [".", "."],
    [".009", ".00"],
    ["0001234.050", "0001234.05"],
    ["INR -1,234.5.6e789", "1234.56"],
    ["letters only!", ""],
    ["99999999.99", "99999999.99"],
    ["123456789", "12345678"],
    ["123456789.123", "12345678.12"],
    ["99,999,999,999.999", "99999999.99"],
    ["90071992547409.91999", "90071992.91"],
    ["000012345.67", "00001234.67"],
  ])("limits %j to %j without rounding", (value, expected) => {
    expect(sanitizeAmountInput(value)).toBe(expected);
  });

  it("groups the limited value without persisting display commas", () => {
    const value = sanitizeAmountInput("1,23,456.789");
    expect(value).toBe("123456.78");
    expect(formatAmountInput(value)).toBe("123,456.78");
  });

  it.each([
    ["-", "-"],
    ["-.", "-."],
    [" -12abc.345", "-12.34"],
    ["--1,234.50", "-1234.50"],
    ["-123456789.999", "-12345678.99"],
    ["1-2", "12"],
    ["+1234.50", "1234.50"],
  ])("allows an optional adjustment sign while limiting %j to %j", (value, expected) => {
    expect(sanitizeAmountInput(value, true)).toBe(expected);
  });
});

describe("formatAmountInput", () => {
  it.each([
    ["", ""],
    ["1", "1"],
    ["123", "123"],
    ["1234", "1,234"],
    ["12345", "12,345"],
    ["123456", "123,456"],
    ["1234567", "1,234,567"],
    ["1234567.89", "1,234,567.89"],
    ["1234.00", "1,234.00"],
    ["1234.", "1,234."],
    [".", "."],
    [".50", ".50"],
    ["0001234.050", "0,001,234.050"],
    ["1234567.123", "1,234,567.123"],
    ["90071992547409.91", "90,071,992,547,409.91"],
    ["9007199254740993123456789.01", "9,007,199,254,740,993,123,456,789.01"],
    ["-1234567.89", "-1,234,567.89"],
    ["-", "-"],
    ["-.", "-."],
    ["invalid", "invalid"],
    ["1234.5.6", "1234.5.6"],
  ])("formats %j as %j without changing entered precision", (value, expected) => {
    expect(formatAmountInput(value)).toBe(expected);
  });

  it.each([
    ["1234567.89", "12,34,567.89"],
    ["-1234567.00", "-12,34,567.00"],
    ["1234.", "1,234."],
    ["0001234.050", "00,01,234.050"],
    ["90071992547409.91", "9,00,71,99,25,47,409.91"],
  ])("supports Indian input grouping without numerical conversion (%j)", (value, expected) => {
    expect(formatAmountInput(value, { grouping: "indian" })).toBe(expected);
  });

  it.each(["1234567.00", "1234.", "-1234.50", "90071992547409.91"])(
    "supports ungrouped presentation without changing %j",
    (value) => {
      expect(formatAmountInput(value, { grouping: "none" })).toBe(value);
    },
  );
});
