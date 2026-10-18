import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

const DUPLICATE_MESSAGE = "A group with this name already exists.";

test.beforeEach(async ({ page }) => {
  await page.goto("/onboarding");
  await page.waitForFunction(async () => {
    const path = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ path)) as typeof StoreModule;
    return useStore.getState().initialized;
  });
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.localUser.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.people.put({ id: "self", name: "Amy", icon: "profile-pic/fox-3d.png" });
    await db.groups.bulkPut([
      {
        id: "trip",
        name: "Trip",
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: 1,
        frequentPayerIds: ["trip-self"],
      },
      {
        id: "home",
        name: "Home",
        icon: "travel-and-places/camping-3d.png",
        currency: "INR",
        createdAt: 2,
        frequentPayerIds: ["home-self"],
      },
    ]);
    await db.members.bulkPut([
      { id: "trip-self", groupId: "trip", personId: "self" },
      { id: "home-self", groupId: "home", personId: "self" },
    ]);
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
});

test("blocks a duplicate on the name step and allows correcting it", async ({ page }) => {
  await page.goto("/groups/new");
  const name = page.locator('input[name="group.name"]');
  await name.fill("  tRiP  ");
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(DUPLICATE_MESSAGE);
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(name).toBeFocused();
  await name.fill("Road Trip");
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "One currency for this group" })).toBeVisible();
});

test("returns to the name step if another save claims the name before final submission", async ({
  page,
}) => {
  await page.goto("/groups/new");
  await page.locator('input[name="group.name"]').fill("Road Trip");
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "One currency for this group" })).toBeVisible();
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("button", { name: "Save and Proceed", exact: true })).toBeEnabled();
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("button", { name: "Create group", exact: true })).toBeVisible();
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.groups.add({
      id: "remote",
      name: "ROAD TRIP",
      icon: "travel-and-places/camping-3d.png",
      currency: "INR",
      createdAt: 3,
      frequentPayerIds: [],
    });
  });
  await page.getByRole("button", { name: "Create group", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Name your group" })).toBeVisible();
  await expect(page.getByRole("alert")).toHaveText(DUPLICATE_MESSAGE);
  const counts = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return {
      groups: await db.groups.count(),
      members: await db.members.count(),
      events: await db.activityEvents.count(),
    };
  });
  expect(counts).toEqual({ groups: 3, members: 2, events: 0 });
  await page.locator('input[name="group.name"]').fill("Another Trip");
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("heading", { name: "One currency for this group" })).toBeVisible();
});

test("shows a duplicate rename error at the name field and permits retaining the current name", async ({
  page,
}) => {
  await page.goto("/groups/home/settings");
  await page.getByRole("button", { name: "Edit name & icon", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit name & icon" });
  const name = dialog.getByLabel("Group name", { exact: true });
  await name.fill(" trip ");
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText(DUPLICATE_MESSAGE);
  await expect(name).toBeFocused();
  await name.fill("HOME");
  await dialog.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const savedName = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.groups.get("home"))?.name;
  });
  expect(savedName).toBe("HOME");
});

test("blocks a duplicate while renaming the onboarding group", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: false,
      lastCompletedStep: "group",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/onboarding/setup");
  await page.getByRole("button", { name: "Back", exact: true }).click();
  const name = page.locator('input[name="group.name"]');
  await expect(name).toHaveValue("Trip");
  await name.fill(" home ");
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(DUPLICATE_MESSAGE);
  await expect(name).toBeFocused();
  await name.fill("TRIP");
  await page.getByRole("button", { name: "Save and Proceed", exact: true }).click();
  await expect(page.getByRole("searchbox", { name: "Search currencies" })).toBeVisible();
});
