import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

test.beforeEach(async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.localUser.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.people.put({ id: "self", name: "Amy", icon: "🦊" });
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      currency: "INR",
      icon: "🏕️",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.put({ id: "a", groupId: "trip", personId: "self" });
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    await db.tags.bulkPut(
      ["Summer", "Food", "Friends", "Weekend", "Cafe"].map((name, index) => ({
        id: `tag-${index}`,
        groupId: "trip",
        name,
        color: "#6366f1",
      })),
    );
    await db.expenses.put({
      expenseId: "lunch",
      groupId: "trip",
      expenseName: "Lunch",
      createdBy: "a",
      categoryId: "food",
      tagIds: ["tag-0", "tag-1", "tag-2", "tag-3", "tag-4"],
      attachmentIds: [],
      createdAt: 1,
      when: 1,
      splitType: "equal",
      splitMeta: [],
      transactions: {
        paid: [{ memberId: "a", amount: 100 }],
        owes: [{ memberId: "a", amount: 100 }],
      },
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip");
});

test("shows three tags on overview and ledger until expanded", async ({ page }) => {
  const overviewTags = page.getByRole("list", { name: "Tags for Lunch" });
  await expect(overviewTags.getByRole("listitem")).toHaveCount(3);
  const more = page.getByRole("button", { name: "Show more tags for Lunch" });
  await expect(more).toHaveText("Show more (+2)");
  await more.click();
  await expect(page).toHaveURL(/\/groups\/trip$/u);
  await expect(overviewTags.getByRole("listitem")).toHaveCount(5);
  await page.getByRole("button", { name: "Show less tags for Lunch" }).click();
  await expect(overviewTags.getByRole("listitem")).toHaveCount(3);

  await page.locator(".recent-activity-card").getByRole("link", { name: "View all (1)" }).click();
  const ledgerTags = page.getByRole("list", { name: "Tags for Lunch" });
  await expect(ledgerTags.getByRole("listitem")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Clear all filters" })).toHaveCount(0);
  await page.getByRole("button", { name: "Show more tags for Lunch" }).click();
  await expect(ledgerTags.getByRole("listitem")).toHaveCount(5);
  await page.getByRole("searchbox", { name: "Search expenses" }).fill("Lunch");
  await expect(page.getByRole("button", { name: "Clear all filters" })).toBeVisible();
  await page.getByRole("button", { name: "Clear all filters" }).click();
  await expect(page.getByRole("button", { name: "Clear all filters" })).toHaveCount(0);
});

test("counts payment references in tag deletion without deleting transactions", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.put({ id: "friend", name: "Bea", icon: "🐻" });
    await db.members.put({ id: "b", groupId: "trip", personId: "friend" });
    await db.settlements.put({
      id: "payment",
      groupId: "trip",
      kind: "payment",
      fromMemberId: "a",
      toMemberId: "b",
      amount: 25,
      recordedBy: "a",
      createdAt: 1,
      when: 1,
      tagIds: ["tag-0"],
    });
  });
  await page.goto("/groups/trip/categories");
  const tag = page.locator(".tag-entry").filter({ hasText: "Summer" });
  await tag.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete Summer?", exact: true });
  await expect(dialog).toContainText("1 expense and 1 payment");
  await expect(dialog).toContainText("expenses and payments will not be deleted");
  await dialog.getByRole("button", { name: "Delete tag", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  const saved = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      expense: await db.expenses.get("lunch"),
      payment: await db.settlements.get("payment"),
    };
  });
  expect(saved.expense?.tagIds).not.toContain("tag-0");
  expect(saved.payment?.tagIds).toEqual([]);
  expect(saved.payment?.amount).toBe(25);
});
