import type { Category, Expense } from "@/shared/types/domain.types";

export const categorySpending = (expenses: Expense[], categories: Category[]) => {
  const categoryById = new Map(categories.map((category) => [category.id, category]));
  const totals = new Map<string, { name: string; icon: string; amount: bigint }>();
  for (const expense of expenses) {
    const category = categoryById.get(expense.categoryId);
    const name = category?.name ?? "Other";
    const previous = totals.get(name);
    totals.set(name, {
      name,
      icon: category?.icon ?? "✦",
      amount:
        (previous?.amount ?? 0n) +
        expense.transactions.paid.reduce((sum, row) => sum + BigInt(row.amount), 0n),
    });
  }
  return [...totals.values()]
    .sort((a, b) => (a.amount > b.amount ? -1 : a.amount < b.amount ? 1 : 0))
    .map((entry) => ({
      ...entry,
      amount: Number.isSafeInteger(Number(entry.amount)) ? Number(entry.amount) : entry.amount,
    }));
};
