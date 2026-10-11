import {
  AMOUNT_INPUT_FRACTION_DIGITS,
  AMOUNT_INPUT_WHOLE_DIGITS,
  DEFAULT_AMOUNT_INPUT_GROUPING,
} from "@/shared/constants/currency-format.constants";
import type {
  AmountGrouping,
  AmountInputFormatOptions,
} from "@/shared/types/currency-format.types";

export const sanitizeAmountInput = (value: string, allowNegative = false): string => {
  const sign = allowNegative && value.trimStart().startsWith("-") ? "-" : "";
  const [whole, ...fractions] = value.replace(/[^\d.]/gu, "").split(".");
  const limitedWhole = whole.slice(0, AMOUNT_INPUT_WHOLE_DIGITS);
  return (
    sign +
    limitedWhole +
    (fractions.length ? `.${fractions.join("").slice(0, AMOUNT_INPUT_FRACTION_DIGITS)}` : "")
  );
};

// Shared grouping primitive for raw ASCII input digits and Intl-localized display digits.
// Slice text rather than converting to Number: leading zeros and exact large amounts must survive.
export const groupAmountDigits = (
  digits: string,
  grouping: AmountGrouping,
  separator = ",",
): string => {
  if (grouping === "none") return digits;
  const groups: string[] = [];
  let end = digits.length;
  let size = 3;
  while (end > 0) {
    const start = Math.max(0, end - size);
    groups.unshift(digits.slice(start, end));
    end = start;
    if (grouping === "indian") size = 2;
  }
  return groups.join(separator);
};

// Formatting never limits or rounds existing values. Only user entry goes through the sanitizer.
export const formatAmountInput = (
  value: string,
  options: AmountInputFormatOptions = {},
): string => {
  // Invalid URL-provided drafts must remain visible for correction, not become grouped "text".
  if (!/^-?\d*(?:\.\d*)?$/u.test(value)) return value;
  const sign = value.startsWith("-") ? "-" : "";
  const [whole, fraction] = value.slice(sign.length).split(".");
  const grouped = groupAmountDigits(whole, options.grouping ?? DEFAULT_AMOUNT_INPUT_GROUPING);
  return sign + grouped + (fraction === undefined ? "" : `.${fraction}`);
};
