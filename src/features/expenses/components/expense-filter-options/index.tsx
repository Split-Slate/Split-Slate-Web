import { useFormContext } from "react-hook-form";

import type {
  ExpenseFilterOptionField,
  ExpenseFilterValues,
} from "@/features/expenses/types/expense-filters.types";

import EmojiImage from "@/shared/ui/emoji-image";

interface PropsType {
  name: ExpenseFilterOptionField;
  label: string;
  options: readonly { value: string; label: string; icon?: string; color?: string }[];
}

const ExpenseFilterOptions = ({ name, label, options }: PropsType) => {
  const { register } = useFormContext<ExpenseFilterValues>();
  return (
    <fieldset className="min-w-0">
      <legend className="mb-2 text-sm font-bold">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <label key={option.value} className="choice-option choice-option-compact">
            <input
              type="checkbox"
              value={option.value}
              {...register(name)}
              className="choice-control"
            />
            {name === "categoryIds" && (
              <span aria-hidden="true" className="inline-flex shrink-0">
                <EmojiImage icon={option.icon} />
              </span>
            )}
            {name === "tagIds" && option.color && (
              <span
                aria-hidden="true"
                className="h-3 w-3 shrink-0 rounded-full border border-[var(--line)]"
                style={{ backgroundColor: option.color }}
              />
            )}
            {option.label}
          </label>
        ))}
        {!options.length && <p className="text-sm text-gray-500">None available.</p>}
      </div>
    </fieldset>
  );
};

export default ExpenseFilterOptions;
