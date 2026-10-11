import { groupAmountDigits } from "@/shared/utils/amount-input";
import { currencyDecimals, moneyToDecimal } from "@/shared/utils/money";

import {
  DEFAULT_CURRENCY_DISPLAY,
  DEFAULT_CURRENCY_GROUPING,
} from "@/shared/constants/currency-format.constants";
import type { CurrencyFormatOptions } from "@/shared/types/currency-format.types";

// Input is stored/derived integer hundredths, never a floating-point major-unit amount.
// Options affect presentation only; future preferences should feed this shared boundary.
export const formatCurrency = (
  amount: number,
  currency: string,
  options: CurrencyFormatOptions = {},
): string => {
  const decimals = currencyDecimals(currency);
  const grouping = options.grouping ?? DEFAULT_CURRENCY_GROUPING;
  const formatter = new Intl.NumberFormat(options.locale, {
    style: "currency",
    currency,
    currencyDisplay: options.currencyDisplay ?? DEFAULT_CURRENCY_DISPLAY,
    useGrouping: grouping === "locale" ? undefined : grouping !== "none",
    // Do not let locale or ISO defaults change the app's fixed-hundredths scale.
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // Intl accepts exact decimal strings at runtime; converting to Number could lose the last cent.
  const decimal = moneyToDecimal(amount, currency) as unknown as number;
  if (grouping === "locale" || grouping === "none") return formatter.format(decimal);

  const parts = formatter.formatToParts(decimal);
  const digits = parts
    .filter((part) => part.type === "integer")
    .map((part) => part.value)
    .join("");
  const separator =
    parts.find((part) => part.type === "group")?.value ??
    formatter.formatToParts(1_000_000).find((part) => part.type === "group")?.value ??
    ",";
  const grouped = groupAmountDigits(digits, grouping, separator);
  let inserted = false;
  return parts
    .map((part) => {
      if (part.type === "group") return "";
      if (part.type !== "integer") return part.value;
      if (inserted) return "";
      inserted = true;
      return grouped;
    })
    .join("");
};
