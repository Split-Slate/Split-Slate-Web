import "fake-indexeddb/auto";

import { describe, expect, it } from "vitest";

import {
  dashboardCategories,
  dashboardPositions,
  dashboardTransfers,
} from "@/features/dashboard/utils/dashboard-data";
import { useStore } from "@/shared/configs/store";

import type { AppStore } from "@/shared/configs/store/types";
import type { Expense } from "@/shared/types/domain.types";

const createState = (): AppStore => {
  const state = {
    ...useStore.getInitialState(),
    localUser: { id: "self", name: "Amy", icon: "🦊" },
  };
  for (let index = 0; index < 4; index += 1) {
    const id = String(index);
    state.groups = [
      ...state.groups,
      { id, name: id, icon: "🏕️", currency: "INR", createdAt: index, frequentPayerIds: [] },
    ];
    state.members = [
      ...state.members,
      { id: `self-${id}`, groupId: id, personId: "self" },
      { id: `friend-${id}`, groupId: id, personId: "friend" },
    ];
    state.categories = [
      ...state.categories,
      { id, groupId: id, name: "Food", icon: "🍽️", isActive: true },
    ];
    const payer = index < 2 ? `self-${id}` : `friend-${id}`;
    const recipient = index < 2 ? `friend-${id}` : `self-${id}`;
    const expense: Expense = {
      expenseId: id,
      groupId: id,
      expenseName: id,
      categoryId: id,
      createdBy: `self-${id}`,
      createdAt: index,
      when: index,
      splitType: "amount",
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: payer, amount: Number.MAX_SAFE_INTEGER }],
        owes: [{ memberId: recipient, amount: Number.MAX_SAFE_INTEGER }],
      },
    };
    state.expenses = [...state.expenses, expense];
  }
  return state;
};

describe("dashboard aggregate accounting", () => {
  it("keeps get, give, spending and every group transfer exact beyond the safe-number total", () => {
    const state = createState();
    const positions = dashboardPositions(state);
    expect(positions.get).toBe(BigInt(Number.MAX_SAFE_INTEGER) * 2n);
    expect(positions.give).toBe(BigInt(Number.MAX_SAFE_INTEGER) * 2n);
    expect(positions.currency).toBe("INR");
    expect(dashboardTransfers(state)).toHaveLength(4);
    expect(dashboardCategories(state, "INR")[0].amount).toBe(BigInt(Number.MAX_SAFE_INTEGER) * 4n);
  });
  it("does not combine unlike currencies in spending", () => {
    const state = createState();
    state.groups[0] = { ...state.groups[0], currency: "USD" };
    expect(dashboardPositions(state).currency).toBeNull();
    expect(dashboardCategories(state, "USD")[0].amount).toBe(Number.MAX_SAFE_INTEGER);
  });
});
