import type { Expense, Group } from "@/shared/types/domain.types";

export const sortGroupsByRecentExpense = (
  groups: readonly Group[],
  expenses: readonly Expense[],
) => {
  const latestExpenseByGroup = new Map<string, number>();

  for (const expense of expenses) {
    const latestCreatedAt = latestExpenseByGroup.get(expense.groupId) ?? -Infinity;
    if (expense.createdAt > latestCreatedAt) {
      latestExpenseByGroup.set(expense.groupId, expense.createdAt);
    }
  }

  return [...groups].sort((a, b) => {
    const aLatest = latestExpenseByGroup.get(a.id) ?? -Infinity;
    const bLatest = latestExpenseByGroup.get(b.id) ?? -Infinity;

    if (aLatest !== bLatest) return bLatest - aLatest;
    return b.createdAt - a.createdAt;
  });
};
