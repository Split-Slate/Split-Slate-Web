import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";

import type { Expense } from "@/shared/types/domain.types";

const referencingExpense = (memberId: string, role: "createdBy" | "paid" | "owes"): Expense => ({
  expenseId: "expense",
  groupId: "g",
  expenseName: "Lunch",
  createdBy: role === "createdBy" ? memberId : "a",
  createdAt: 1,
  when: 1,
  categoryId: "food",
  tagIds: [],
  attachmentIds: [],
  splitType: "equal",
  splitMeta: [],
  transactions: {
    paid: [{ memberId: role === "paid" ? memberId : "a", amount: 100 }],
    owes: [{ memberId: role === "owes" ? memberId : "a", amount: 100 }],
  },
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  useStore.setState(useStore.getInitialState(), true);
  await db.localUser.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.people.bulkAdd([
    { id: "self", name: "Amy", icon: "🦊" },
    { id: "friend", name: "Bea", icon: "🐻" },
  ]);
  await db.groups.add({
    id: "g",
    name: "Trip",
    icon: "🏕️",
    currency: "INR",
    createdAt: 1,
    frequentPayerIds: ["a"],
  });
  await db.members.add({ id: "a", groupId: "g", personId: "self" });
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("addMember", () => {
  it.each(["group", "person"])(
    "rejects a missing persisted %s even when memory is stale",
    async (missing) => {
      if (missing === "group") await db.groups.delete("g");
      else await db.people.delete("friend");
      await expect(useStore.getState().addMember("g", "friend")).rejects.toThrow("not found");
      expect(await db.members.count()).toBe(1);
      expect(useStore.getState().members).toHaveLength(1);
    },
  );
  it("serializes concurrent additions and rejects the duplicate", async () => {
    const results = await Promise.allSettled([
      useStore.getState().addMember("g", "friend"),
      useStore.getState().addMember("g", "friend"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(results.filter((result) => result.status === "rejected")).toHaveLength(1);
    const rows = await db.members.where("personId").equals("friend").toArray();
    expect(rows).toHaveLength(1);
    expect(useStore.getState().members.filter((member) => member.personId === "friend")).toEqual(
      rows,
    );
  });
  it("does not update memory after a write failure", async () => {
    vi.spyOn(db.members, "add").mockRejectedValueOnce(new Error("Disk full"));
    await expect(useStore.getState().addMember("g", "friend")).rejects.toThrow("Disk full");
    expect(await db.members.count()).toBe(1);
    expect(useStore.getState().members).toHaveLength(1);
  });
});

describe("removePerson", () => {
  it.each(["createdBy", "paid", "owes"] as const)(
    "protects persisted %s references absent from hydration for both deletion paths",
    async (role) => {
      await db.members.add({ id: "b", groupId: "g", personId: "friend" });
      await db.expenses.add(referencingExpense("b", role));
      const state = useStore.getState();
      const events = await db.activityEvents.toArray();
      await expect(state.removePerson("friend")).rejects.toThrow("expenses");
      await expect(state.removeMember("b")).rejects.toThrow("expenses");
      expect(await db.people.get("friend")).toBeDefined();
      expect(await db.members.get("b")).toBeDefined();
      expect(await db.activityEvents.toArray()).toEqual(events);
      expect(useStore.getState()).toBe(state);
    },
  );
  it("protects self membership from missing hydrated identity", async () => {
    useStore.setState({ localUser: null, members: [] });
    await expect(useStore.getState().removeMember("a")).rejects.toThrow("cannot remove yourself");
    expect(await db.members.get("a")).toBeDefined();
  });
  it.each(["person", "member"])("cleans persisted payer rankings on %s deletion", async (kind) => {
    await db.members.add({ id: "b", groupId: "g", personId: "friend" });
    await db.groups.update("g", { name: "New title", frequentPayerIds: ["b", "a"] });
    if (kind === "person") await useStore.getState().removePerson("friend");
    else await useStore.getState().removeMember("b");
    expect(await db.members.get("b")).toBeUndefined();
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["a"]);
    expect(useStore.getState().groups[0]).toMatchObject({
      name: "New title",
      frequentPayerIds: ["a"],
    });
  });
  it.each(["person", "member"])(
    "rolls back all %s deletion writes when activity fails",
    async (kind) => {
      const friend = await useStore.getState().addMember("g", "friend");
      await db.groups.update("g", { frequentPayerIds: [friend.id, "a"] });
      const state = useStore.getState();
      vi.spyOn(db.activityEvents, "add").mockRejectedValueOnce(new Error("Disk full"));
      const result =
        kind === "person" ? state.removePerson("friend") : state.removeMember(friend.id);
      await expect(result).rejects.toThrow("Disk full");
      expect(await db.people.get("friend")).toBeDefined();
      expect(await db.members.get(friend.id)).toBeDefined();
      expect((await db.groups.get("g"))?.frequentPayerIds).toEqual([friend.id, "a"]);
      expect(useStore.getState()).toBe(state);
    },
  );
  it("does not delete a contact referenced only by a recorded payment", async () => {
    const friend = await useStore.getState().addMember("g", "friend");
    await db.settlements.add({
      id: "payment",
      groupId: "g",
      kind: "payment",
      fromMemberId: friend.id,
      toMemberId: "a",
      recordedBy: "a",
      amount: 100,
      when: 1,
      createdAt: 1,
      tagIds: [],
    });
    await useStore.getState().init();
    await expect(useStore.getState().removeMember(friend.id)).rejects.toThrow("payments");
    await expect(useStore.getState().removePerson("friend")).rejects.toThrow("payments");
    expect(await db.people.get("friend")).toBeDefined();
  });
  it("protects persisted self identity even when client identity and memberships are missing", async () => {
    useStore.setState({ localUser: null, members: [] });
    const before = await db.people.get("self");
    await expect(useStore.getState().removePerson("self")).rejects.toThrow(
      "cannot delete yourself",
    );
    expect(await db.people.get("self")).toEqual(before);
    expect(await db.members.get("a")).toBeDefined();
    expect((await db.groups.get("g"))?.frequentPayerIds).toEqual(["a"]);
    expect(useStore.getState().people.find((person) => person.id === "self")).toEqual(before);
  });
  it("still allows deletion of an unreferenced friend", async () => {
    await useStore.getState().addMember("g", "friend");
    await useStore.getState().removePerson("friend");
    expect(await db.people.get("friend")).toBeUndefined();
    expect(await db.members.where("personId").equals("friend").count()).toBe(0);
    expect(useStore.getState().people.some((person) => person.id === "friend")).toBe(false);
  });
});

describe("persisted category guards", () => {
  beforeEach(async () => {
    await db.categories.bulkAdd([
      { id: "food", groupId: "g", name: "Food", icon: "🍔", isActive: true },
      { id: "other", groupId: "g", name: "Other", icon: "📦", isActive: true },
    ]);
    await useStore.getState().init();
  });
  it("rejects a persisted expense unseen in memory", async () => {
    await db.expenses.add(referencingExpense("a", "paid"));
    await expect(useStore.getState().removeCategory("food")).rejects.toThrow("used by expenses");
    expect(await db.categories.get("food")).toBeDefined();
  });
  it("rejects removing the last persisted category despite stale memory", async () => {
    await db.categories.delete("other");
    await expect(useStore.getState().removeCategory("food")).rejects.toThrow("at least one");
    expect(await db.categories.get("food")).toBeDefined();
  });
  it("serializes concurrent removals so one category remains", async () => {
    const results = await Promise.allSettled([
      useStore.getState().removeCategory("food"),
      useStore.getState().removeCategory("other"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect(await db.categories.count()).toBe(1);
    expect(useStore.getState().categories).toEqual(await db.categories.toArray());
  });
  it("serializes duplicate additions against persisted names", async () => {
    const results = await Promise.allSettled([
      useStore.getState().addCategory("g", "Travel", "🚗"),
      useStore.getState().addCategory("g", " travel ", "🚗"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    await expect(useStore.getState().updateCategory("other", { name: " FOOD " })).rejects.toThrow(
      "already exists",
    );
  });
  it("uses persisted current fields rather than overwriting them with hydration", async () => {
    await db.categories.update("food", { name: "New name", isActive: false });
    const updated = await useStore.getState().updateCategory("food", { icon: "🥦" });
    expect(updated).toMatchObject({ name: "New name", isActive: false, icon: "🥦" });
    expect(useStore.getState().categories.find((item) => item.id === "food")).toEqual(updated);
  });
  it.each(["add", "update", "remove"])(
    "rolls back category %s on activity failure",
    async (action) => {
      const rows = await db.categories.toArray();
      const state = useStore.getState();
      vi.spyOn(db.activityEvents, "add").mockRejectedValueOnce(new Error("Disk full"));
      const result =
        action === "add"
          ? state.addCategory("g", "Travel", "🚗")
          : action === "update"
            ? state.updateCategory("food", { name: "Dining" })
            : state.removeCategory("food");
      await expect(result).rejects.toThrow("Disk full");
      expect(await db.categories.toArray()).toEqual(rows);
      expect(useStore.getState()).toBe(state);
    },
  );
});
