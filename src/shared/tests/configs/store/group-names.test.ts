import "fake-indexeddb/auto";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { db } from "@/shared/configs/db";
import { useStore } from "@/shared/configs/store";
import { GroupNameConflictError } from "@/shared/utils/group-names";

import type { Group } from "@/shared/types/domain.types";

const group = (id: string, name: string): Group => ({
  id,
  name,
  icon: "🏕️",
  currency: "INR",
  createdAt: 1,
  frequentPayerIds: [],
});

beforeEach(async () => {
  await db.delete();
  await db.open();
  useStore.setState(useStore.getInitialState(), true);
  await db.localUser.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.people.add({ id: "self", name: "Amy", icon: "🦊" });
  await db.groups.bulkAdd([group("trip", "Trip"), group("home", "Home")]);
  await useStore.getState().init();
});

afterEach(async () => {
  vi.restoreAllMocks();
  await db.delete();
});

describe("group name uniqueness", () => {
  it.each(["Trip", "trip", "  TRIP\t", "\u00a0Trip\u3000"])(
    "rejects creation of %j without writing group, member, or activity data",
    async (name) => {
      const before = useStore.getState();
      await expect(before.createGroup(name, "🏡", "USD")).rejects.toBeInstanceOf(
        GroupNameConflictError,
      );
      expect(await db.groups.count()).toBe(2);
      expect(await db.members.count()).toBe(0);
      expect(await db.activityEvents.count()).toBe(0);
      expect(useStore.getState().groups).toBe(before.groups);
      expect(useStore.getState().members).toBe(before.members);
      expect(useStore.getState().activityEvents).toBe(before.activityEvents);
    },
  );

  it("creates distinct groups with trimmed names", async () => {
    const { group: created, creatorMember } = await useStore
      .getState()
      .createGroup("  Road Trip  ", "🏕️", "INR");
    expect(created.name).toBe("Road Trip");
    expect(await db.groups.get(created.id)).toEqual(created);
    expect(await db.members.get(creatorMember.id)).toEqual(creatorMember);
    expect(await db.activityEvents.count()).toBe(1);
  });

  it("checks persisted groups even when the hydrated state is stale", async () => {
    await db.groups.add(group("remote", "Remote Trip"));
    expect(useStore.getState().groups.some((item) => item.id === "remote")).toBe(false);
    await expect(
      useStore.getState().createGroup(" remote trip ", "🏕️", "INR"),
    ).rejects.toBeInstanceOf(GroupNameConflictError);
    await expect(
      useStore.getState().updateGroup("home", { name: "REMOTE TRIP" }),
    ).rejects.toBeInstanceOf(GroupNameConflictError);
    expect(await db.groups.count()).toBe(3);
    expect(await db.activityEvents.count()).toBe(0);
  });

  it("rejects a conflicting rename without applying other patch fields", async () => {
    const before = useStore.getState();
    await expect(
      before.updateGroup("home", { name: " trip ", icon: "🦊", currency: "USD" }),
    ).rejects.toBeInstanceOf(GroupNameConflictError);
    expect(await db.groups.get("home")).toEqual(group("home", "Home"));
    expect(await db.activityEvents.count()).toBe(0);
    expect(useStore.getState().groups).toBe(before.groups);
  });

  it("allows retaining the current name or changing only its case", async () => {
    await expect(
      useStore.getState().updateGroup("trip", { name: " Trip " }),
    ).resolves.toMatchObject({ name: "Trip" });
    await expect(useStore.getState().updateGroup("trip", { name: "TRIP" })).resolves.toMatchObject({
      name: "TRIP",
    });
    expect(await db.groups.count()).toBe(2);
  });

  it("starts partial updates from the persisted group instead of stale state", async () => {
    await db.groups.update("home", { name: "Remote Home", frequentPayerIds: ["new-member"] });
    const updated = await useStore.getState().updateGroup("home", { currency: "USD" });
    expect(updated).toMatchObject({
      name: "Remote Home",
      currency: "USD",
      frequentPayerIds: ["new-member"],
    });
    expect(useStore.getState().groups.find((item) => item.id === "home")).toEqual(updated);
    expect(await db.activityEvents.toArray()).toMatchObject([
      { groupName: "Remote Home", label: "Remote Home" },
    ]);
  });

  it("does not resurrect a group deleted outside the hydrated state", async () => {
    await db.groups.delete("home");
    await expect(useStore.getState().updateGroup("home", { name: "New Home" })).rejects.toThrow(
      "Group not found",
    );
    expect(await db.groups.get("home")).toBeUndefined();
    expect(await db.activityEvents.count()).toBe(0);
  });

  it("serializes concurrent creates of the same normalized name", async () => {
    const results = await Promise.allSettled([
      useStore.getState().createGroup("Road Trip", "🏕️", "INR"),
      useStore.getState().createGroup(" road trip ", "🏡", "USD"),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failure = results.find((result) => result.status === "rejected");
    expect(failure?.reason).toBeInstanceOf(GroupNameConflictError);
    expect(await db.groups.count()).toBe(3);
    expect(await db.members.count()).toBe(1);
    expect(await db.activityEvents.count()).toBe(1);
    expect(useStore.getState().groups).toHaveLength(3);
  });

  it("serializes concurrent renames of different groups to the same name", async () => {
    const results = await Promise.allSettled([
      useStore.getState().updateGroup("trip", { name: "Holiday" }),
      useStore.getState().updateGroup("home", { name: " HOLIDAY " }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failure = results.find((result) => result.status === "rejected");
    expect(failure?.reason).toBeInstanceOf(GroupNameConflictError);
    expect(await db.activityEvents.count()).toBe(1);
    const names = (await db.groups.toArray()).map((item) => item.name.toLowerCase());
    expect(new Set(names).size).toBe(2);
  });

  it("serializes a create and rename competing for the same name", async () => {
    const results = await Promise.allSettled([
      useStore.getState().createGroup("Holiday", "🏕️", "INR"),
      useStore.getState().updateGroup("home", { name: " holiday " }),
    ]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    const failure = results.find((result) => result.status === "rejected");
    expect(failure?.reason).toBeInstanceOf(GroupNameConflictError);
    expect(await db.activityEvents.count()).toBe(1);
  });

  it("rolls a rename back if activity persistence fails", async () => {
    const before = useStore.getState();
    vi.spyOn(db.activityEvents, "add").mockRejectedValueOnce(new Error("Activity failed"));
    await expect(before.updateGroup("home", { name: "New Home" })).rejects.toThrow(
      "Activity failed",
    );
    expect(await db.groups.get("home")).toEqual(group("home", "Home"));
    expect(useStore.getState().groups).toBe(before.groups);
  });
});
