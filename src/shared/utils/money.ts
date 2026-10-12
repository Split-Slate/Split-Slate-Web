import { CURRENCIES } from "@/shared/constants/currencies";

// Monetary values always use integer hundredths, independently of the currency label.
const MONEY_DECIMALS = 2;

export const currencyDecimals = (currency: string): number => {
  if (!CURRENCIES.some((item) => item.code === currency)) throw new Error("Unsupported currency");
  return MONEY_DECIMALS;
};

export const parseMoney = (text: string, currency: string, signed = false): number => {
  const decimals = currencyDecimals(currency);
  const value = text.trim();
  if (!(signed ? /^-?\d+(?:\.\d+)?$/ : /^\d+(?:\.\d+)?$/).test(value)) {
    throw new Error("Enter a valid decimal amount");
  }
  const [whole, fraction = ""] = value.replace(/^-/, "").split(".");
  if (fraction.length > decimals) {
    throw new Error(`${currency} supports ${decimals} decimal places`);
  }
  const magnitude =
    BigInt(whole) * 10n ** BigInt(decimals) + BigInt(fraction.padEnd(decimals, "0") || "0");
  const amount = Number(value.startsWith("-") ? -magnitude : magnitude);
  if (!Number.isSafeInteger(amount)) throw new Error("Amount is too large");
  return amount;
};

// BigInt is for derived summaries only; persisted amounts and parsed form input remain safe numbers.
export const moneyToDecimal = (amount: number | bigint, currency: string): string => {
  if (typeof amount === "number" && !Number.isSafeInteger(amount))
    throw new Error("Amount must be a safe integer");
  const decimals = currencyDecimals(currency);
  const value = BigInt(amount);
  const digits = (value < 0n ? -value : value).toString().padStart(decimals + 1, "0");
  const magnitude = decimals ? `${digits.slice(0, -decimals)}.${digits.slice(-decimals)}` : digits;
  return `${value < 0n ? "-" : ""}${magnitude}`;
};

// Chart percentages are presentation, never an accounting amount. Bound conversion to a small ratio.
export const moneyPercentage = (amount: number | bigint, total: number | bigint): number => {
  const numerator = BigInt(amount);
  const denominator = BigInt(total);
  if (numerator <= 0n || denominator <= 0n) return 0;
  return (
    Math.min(100, Number((numerator * 1_000_000_000n) / denominator) / 10_000_000) ||
    Number.MIN_VALUE
  );
};
