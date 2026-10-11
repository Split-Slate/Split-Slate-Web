export type AmountGrouping = "international" | "indian" | "none";

export interface CurrencyFormatOptions {
  locale?: string;
  grouping?: AmountGrouping | "locale";
  currencyDisplay?: "symbol" | "narrowSymbol" | "code" | "name";
}

export interface AmountInputFormatOptions {
  grouping?: AmountGrouping;
}
