import { calculateBalances } from "@/shared/utils/balances";

import type { Expense, Settlement } from "@/shared/types/domain.types";

// Saved final nets are safe, but undoing an edited payment can temporarily exceed the number limit.
export const paymentPreviewBalances = (
  expenses: Expense[],
  memberIds: string[],
  settlements: Settlement[],
  editedId?: string,
): Map<string, bigint> => {
  const balances = new Map(
    [...calculateBalances(expenses, memberIds, settlements)].map(([id, amount]) => [
      id,
      BigInt(amount),
    ]),
  );
  const edited = settlements.find((item) => item.id === editedId);
  if (edited) {
    balances.set(edited.fromMemberId, balances.get(edited.fromMemberId)! - BigInt(edited.amount));
    balances.set(edited.toMemberId, balances.get(edited.toMemberId)! + BigInt(edited.amount));
  }
  return balances;
};
