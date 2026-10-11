import type { ComponentProps } from "react";

import Input from "@/shared/components/form-elements/input";

import { formatAmountInput, sanitizeAmountInput } from "@/shared/utils/amount-input";

import type { AmountInputFormatOptions } from "@/shared/types/currency-format.types";

interface PropsType extends Omit<
  ComponentProps<typeof Input>,
  "type" | "inputMode" | "sanitize" | "formatValue"
> {
  allowNegative?: boolean;
  formatOptions?: AmountInputFormatOptions;
}

const MoneyInput = ({ allowNegative = false, formatOptions, placeholder, ...props }: PropsType) => {
  const handleSanitize = (value: string) => sanitizeAmountInput(value, allowNegative);
  const handleFormat = (value: string) => formatAmountInput(value, formatOptions);

  return (
    <Input
      {...props}
      type="text"
      inputMode="decimal"
      sanitize={handleSanitize}
      formatValue={handleFormat}
      placeholder={placeholder === undefined ? undefined : handleFormat(placeholder)}
    />
  );
};

export default MoneyInput;
