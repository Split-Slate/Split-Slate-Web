import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { Expense, OnboardingSettings } from "@/shared/types/domain.types";

const row = (page: Page, id: string) => page.locator(`[data-expense-id="${id}"]`);

const selectDinner = async (page: Page) => {
  await page.getByRole("button", { name: "Actions for Dinner", exact: true }).click();
  await page.getByRole("menuitem", { name: "Select", exact: true }).click();
};

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
    await db.people.bulkPut([
      { id: "self", name: "Amy", icon: "🦊" },
      { id: "friend", name: "Bea", icon: "🐻" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      currency: "INR",
      icon: "🏕️",
      createdAt: 1,
      frequentPayerIds: ["a", "b"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "friend" },
    ]);
    await db.categories.bulkPut([
      { id: "food", groupId: "trip", name: "Food", icon: "🍽️", isActive: true },
      { id: "travel", groupId: "trip", name: "Travel", icon: "🚕", isActive: true },
    ]);
    const expenses: Expense[] = [
      {
        expenseId: "dinner",
        groupId: "trip",
        expenseName: "Dinner",
        categoryId: "food",
        createdBy: "a",
        createdAt: 1,
        when: new Date(2026, 8, 20, 12).getTime(),
        splitType: "equal",
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "a", amount: 10000 }],
          owes: [
            { memberId: "a", amount: 5000 },
            { memberId: "b", amount: 5000 },
          ],
        },
      },
      {
        expenseId: "taxi",
        groupId: "trip",
        expenseName: "Taxi",
        categoryId: "travel",
        createdBy: "a",
        createdAt: 2,
        when: new Date(2026, 8, 21, 12).getTime(),
        splitType: "equal",
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "b", amount: 5000 }],
          owes: [
            { memberId: "a", amount: 2500 },
            { memberId: "b", amount: 2500 },
          ],
        },
      },
      {
        expenseId: "coffee",
        groupId: "trip",
        expenseName: "Coffee",
        categoryId: "food",
        createdBy: "a",
        createdAt: 3,
        when: new Date(2026, 8, 22, 12).getTime(),
        splitType: "equal",
        splitMeta: [],
        tagIds: [],
        attachmentIds: [],
        transactions: {
          paid: [{ memberId: "a", amount: 1000 }],
          owes: [{ memberId: "a", amount: 1000 }],
        },
      },
    ];
    await db.expenses.bulkPut(expenses);
    await db.attachments.put({
      id: "unlisted-receipt",
      expenseId: "dinner",
      blob: new Blob(["receipt"]),
      mimeType: "image/png",
      createdAt: 1,
    });
    await db.settlements.put({
      id: "payment",
      kind: "payment",
      groupId: "trip",
      fromMemberId: "b",
      toMemberId: "a",
      amount: 1000,
      when: new Date(2026, 8, 23, 12).getTime(),
      createdAt: 4,
      recordedBy: "a",
      tagIds: [],
    });
    const onboarding: OnboardingSettings = {
      id: "onboarding",
      complete: true,
      lastCompletedStep: "members",
      groupId: "trip",
    };
    await db.settings.put(onboarding);
  });
  await page.goto("/groups/trip/expenses");
});

test("opens an accessible menu, supports keyboard navigation, and restores trigger focus", async ({
  page,
}) => {
  const trigger = page.getByRole("button", { name: "Actions for Dinner", exact: true });
  await trigger.click();
  const menu = page.getByRole("menu", { name: "Actions for Dinner", exact: true });
  await expect(menu).toBeVisible();
  await expect(menu.getByRole("menuitem", { name: "Edit", exact: true })).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await expect(menu.getByRole("menuitem", { name: "Select", exact: true })).toBeFocused();
  await page.keyboard.press("End");
  await expect(menu.getByRole("menuitem", { name: "Delete", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(menu.getByRole("menuitem", { name: "Edit", exact: true })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expect(trigger).toBeFocused();
  await row(page, "dinner").getByRole("link").click();
  await expect(page).toHaveURL(/\/expenses\/dinner$/u);
});

test("edits from the floating menu while preserving the filter URL", async ({ page }) => {
  await page.goto("/groups/trip/expenses?name=Dinner");
  await page.getByRole("button", { name: "Actions for Dinner", exact: true }).click();
  await page.getByRole("menuitem", { name: "Edit", exact: true }).click();
  await expect(page).toHaveURL(/\/expenses\/dinner\/edit\?name=Dinner$/u);
});

test("opens on touch long-press and suppresses the following row click", async ({ page }) => {
  await page.clock.install();
  const expense = row(page, "dinner");
  const pointer = {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    clientX: 120,
    clientY: 200,
  };
  await expense.dispatchEvent("pointerdown", pointer);
  await page.clock.fastForward(550);
  await expect(page.getByRole("menu", { name: "Actions for Dinner", exact: true })).toBeVisible();
  await page
    .getByRole("menuitem", { name: "Edit", exact: true })
    .dispatchEvent("click", { detail: 1 });
  await expect(page).toHaveURL(/\/trip\/expenses$/u);
  await expense.dispatchEvent("pointerup", pointer);
  await expense.getByRole("link").dispatchEvent("click");
  await expect(page).toHaveURL(/\/trip\/expenses$/u);
  await page.getByRole("menuitem", { name: "Select", exact: true }).click();
  await expect(page.getByRole("checkbox", { name: "Select Dinner", exact: true })).toBeChecked();
});

test("cancels pending long-press on movement, scroll, and pointer cancellation", async ({
  page,
}) => {
  await page.clock.install();
  const expense = row(page, "dinner");
  const pointer = {
    pointerId: 1,
    pointerType: "touch",
    isPrimary: true,
    button: 0,
    clientX: 120,
    clientY: 200,
  };
  for (const cancellation of ["movement", "scroll", "pointercancel"]) {
    await expense.dispatchEvent("pointerdown", pointer);
    if (cancellation === "movement") {
      await expense.dispatchEvent("pointermove", { ...pointer, clientY: 225 });
    } else if (cancellation === "scroll") {
      await page.evaluate(() => document.dispatchEvent(new Event("scroll")));
    } else {
      await expense.dispatchEvent("pointercancel", pointer);
    }
    await page.clock.fastForward(600);
    await expect(page.getByRole("menu")).toHaveCount(0);
    await expense.dispatchEvent("pointerup", pointer);
  }
  await expense.getByRole("link").click();
  await expect(page).toHaveURL(/\/expenses\/dinner$/u);
});

test("suppresses an extended hold release and permits a fresh interaction after dismissal", async ({
  page,
}) => {
  await page.clock.install();
  const expense = row(page, "dinner");
  const pointer = {
    pointerId: 1,
    pointerType: "pen",
    isPrimary: true,
    button: 0,
    clientX: 120,
    clientY: 200,
  };
  await expense.dispatchEvent("pointerdown", pointer);
  await page.clock.fastForward(3000);
  const menu = page.getByRole("menu", { name: "Actions for Dinner", exact: true });
  await expect(menu).toBeVisible();
  await expense.dispatchEvent("pointerup", pointer);
  await expense.getByRole("link").dispatchEvent("click", { detail: 1 });
  await expect(page).toHaveURL(/\/trip\/expenses$/u);
  await page.keyboard.press("Escape");
  await expect(menu).toHaveCount(0);
  await expense.getByRole("link").click();
  await expect(page).toHaveURL(/\/expenses\/dinner$/u);
});

test("supports native desktop right-click", async ({ page, isMobile }) => {
  test.skip(isMobile, "Desktop right-click only");
  await row(page, "dinner").getByRole("link").click({ button: "right" });
  await expect(page.getByRole("menu", { name: "Actions for Dinner", exact: true })).toBeVisible();
});

test("clamps the menu inside the viewport and dismisses outside or on scroll", async ({ page }) => {
  const size = page.viewportSize()!;
  const expense = row(page, "dinner");
  await expense.dispatchEvent("contextmenu", { clientX: size.width - 2, clientY: size.height - 2 });
  const menu = page.getByRole("menu", { name: "Actions for Dinner", exact: true });
  await expect(menu).toBeVisible();
  const bounds = (await menu.boundingBox())!;
  expect(bounds.x).toBeGreaterThanOrEqual(8);
  expect(bounds.y).toBeGreaterThanOrEqual(8);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(size.width - 7);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(size.height - 7);
  await page.getByRole("heading", { name: "Expenses and payments", exact: true }).click();
  await expect(menu).toHaveCount(0);
  await page.getByRole("button", { name: "Actions for Dinner", exact: true }).click();
  await page.evaluate(() => document.dispatchEvent(new Event("scroll")));
  await expect(menu).toHaveCount(0);
});

test("ignores scroll events queued before opening but dismisses on a later scroll", async ({
  page,
}) => {
  const oldScroll = await page.evaluateHandle(() => new Event("scroll"));
  await page.getByRole("button", { name: "Actions for Dinner", exact: true }).click();
  const menu = page.getByRole("menu", { name: "Actions for Dinner", exact: true });
  await expect(menu).toBeVisible();
  await page.evaluate((event) => document.dispatchEvent(event), oldScroll);
  await expect(menu).toBeVisible();
  await page.evaluate(() => document.dispatchEvent(new Event("scroll")));
  await expect(menu).toHaveCount(0);
  await oldScroll.dispose();
});

test("handles a native mobile touch hold and a fresh tap on Select", async ({ page, isMobile }) => {
  test.skip(!isMobile, "Native touch input requires the mobile browser project");
  const title = row(page, "dinner").locator(".expense-entry-title");
  await title.hover();
  const bounds = (await title.boundingBox())!;
  const session = await page.context().newCDPSession(page);
  try {
    await session.send("Input.dispatchTouchEvent", {
      type: "touchStart",
      touchPoints: [{ x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }],
    });
    const menu = page.getByRole("menu", { name: "Actions for Dinner", exact: true });
    await expect(menu).toBeVisible();
    await session.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
    await expect(menu).toBeVisible();
    await expect(page).toHaveURL(/\/trip\/expenses$/u);
    await menu.getByRole("menuitem", { name: "Select", exact: true }).tap();
    await expect(row(page, "dinner").getByRole("checkbox")).toBeChecked();
    const all = page.getByRole("region", { name: "Expense selection" }).getByRole("checkbox", {
      name: "All",
      exact: true,
    });
    await all.tap();
    await expect(all).toBeChecked();
    await all.tap();
    await expect(page.getByRole("region", { name: "Expense selection" })).toHaveCount(0);
    await row(page, "dinner").getByRole("link").tap();
    await expect(page).toHaveURL(/\/expenses\/dinner$/u);
  } finally {
    await session.detach().catch(() => undefined);
  }
});

test("selects via rows and checkboxes without opening details and clears on filter changes", async ({
  page,
}) => {
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  await expect(toolbar).toContainText("1 selected");
  await expect(toolbar.getByRole("button", { name: "Edit", exact: true })).toBeEnabled();
  await row(page, "taxi").getByRole("link").click();
  await expect(toolbar).toContainText("2 selected");
  await expect(toolbar.getByRole("button", { name: "Edit", exact: true })).toBeDisabled();
  await expect(page).toHaveURL(/\/trip\/expenses$/u);
  await page.getByRole("checkbox", { name: "Select Dinner", exact: true }).uncheck();
  await expect(toolbar).toContainText("1 selected");
  await page.getByRole("searchbox", { name: "Search expenses", exact: true }).fill("Coffee");
  await expect(toolbar).toHaveCount(0);
  await expect(page.getByRole("checkbox", { name: /^Select /u })).toHaveCount(0);
  await expect(row(page, "coffee")).toBeVisible();
});

test("selects only matching expenses, confirms count and total, and preserves payments", async ({
  page,
}) => {
  await page.goto("/groups/trip/expenses?categoryIds=food");
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  await toolbar.getByRole("checkbox", { name: "All", exact: true }).click();
  await expect(toolbar).toContainText("2 selected");
  await expect(row(page, "taxi")).toHaveCount(0);
  await toolbar.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete 2 expenses?", exact: true });
  await expect(dialog).toContainText("₹110.00");
  await expect(dialog).toContainText("Recorded payments will not be deleted");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(toolbar).toContainText("2 selected");
  await expect(row(page, "dinner")).toBeVisible();
  await toolbar.getByRole("button", { name: "Delete", exact: true }).click();
  await dialog.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(toolbar).toHaveCount(0);
  const remaining = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return {
      expenseIds: (await db.expenses.toArray()).map((expense) => expense.expenseId),
      receipts: await db.attachments.count(),
      payments: await db.settlements.count(),
    };
  });
  expect(remaining).toEqual({ expenseIds: ["taxi"], receipts: 0, payments: 1 });
  await page.reload();
  await expect(row(page, "dinner")).toHaveCount(0);
  await expect(row(page, "coffee")).toHaveCount(0);
});

test("keeps the confirmation and selection after failure, then permits retry", async ({ page }) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    const original = useStore.getState().removeExpenses;
    let fail = true;
    useStore.setState({
      removeExpenses: async (ids, groupId) => {
        if (fail) {
          fail = false;
          throw new Error("Storage unavailable");
        }
        await original(ids, groupId);
      },
    });
  });
  await selectDinner(page);
  const toolbar = page.locator('section[aria-label="Expense selection"]');
  await toolbar.getByRole("checkbox", { name: "All", exact: true }).click();
  await toolbar.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete 3 expenses?", exact: true });
  await dialog.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Storage unavailable");
  await expect(toolbar).toContainText("3 selected");
  await expect(page.locator('[data-expense-id] input[type="checkbox"]:checked')).toHaveCount(3);
  await dialog.getByRole("button", { name: "Delete permanently", exact: true }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.locator("[data-expense-id]")).toHaveCount(0);
});

test("single-row delete requires confirmation and selection can be cleared or escaped", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Actions for Dinner", exact: true }).click();
  await page.getByRole("menuitem", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Delete Dinner?", exact: true });
  await expect(dialog).toContainText("₹100.00");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(row(page, "dinner")).toBeVisible();
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  await expect(toolbar.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
  const all = toolbar.getByRole("checkbox", { name: "All", exact: true });
  await all.click();
  await expect(all).toBeChecked();
  await all.click();
  await expect(page.getByRole("region", { name: "Expense selection" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Actions for Dinner", exact: true })).toBeVisible();
  await selectDinner(page);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("region", { name: "Expense selection" })).toHaveCount(0);
});

test("prunes expenses deleted elsewhere from the current selection", async ({ page }) => {
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  await toolbar.getByRole("checkbox", { name: "All", exact: true }).click();
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    await useStore.getState().removeExpense("dinner", "trip");
  });
  await expect(toolbar).toContainText("2 selected");
  await expect(row(page, "dinner")).toHaveCount(0);
  await toolbar.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Delete 2 expenses?", exact: true })).toBeVisible();
});

test("keeps row geometry and toolbar size stable across zero, single, and multiple selections", async ({
  page,
}) => {
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.tags.put({ id: "layout-tag", groupId: "trip", name: "Shared", color: "#123456" });
    await db.expenses.update("coffee", {
      expenseName: "Monthly streaming plan and shared subscriptions for the whole group",
      tagIds: ["layout-tag"],
    });
  });
  const measureRows = () =>
    page.locator(".expense-ledger-list > ul").evaluate((list) => {
      const listBounds = list.getBoundingClientRect();
      const round = (value: number) => Math.round(value * 100) / 100;
      return [...list.querySelectorAll<HTMLElement>(":scope > [data-expense-id]")].map(
        (element) => {
          const bounds = element.getBoundingClientRect();
          const title = element.querySelector(".expense-entry-title")!.getBoundingClientRect();
          const timestamp = element
            .querySelector(".expense-entry-timestamp")!
            .getBoundingClientRect();
          const style = getComputedStyle(element);
          const linkStyle = getComputedStyle(element.querySelector(".expense-entry-link")!);
          return {
            id: element.dataset.expenseId,
            top: round(bounds.top - listBounds.top),
            left: round(bounds.left - listBounds.left),
            width: round(bounds.width),
            height: round(bounds.height),
            titleLeft: round(title.left - bounds.left),
            titleTop: round(title.top - bounds.top),
            timestampTop: round(timestamp.top - bounds.top),
            timestampWidth: round(timestamp.width),
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
            paddingLeft: style.paddingLeft,
            paddingRight: style.paddingRight,
            linkPaddingTop: linkStyle.paddingTop,
            linkPaddingBottom: linkStyle.paddingBottom,
          };
        },
      );
    });

  for (const width of [320, 440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/groups/trip/expenses");
    const containerPadding = await page.locator(".expense-ledger-list").evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    });
    expect(new Set(containerPadding).size).toBe(1);
    expect(parseFloat(containerPadding[0])).toBeGreaterThan(0);
    const normalRows = await measureRows();
    expect(normalRows).toHaveLength(3);
    for (const geometry of normalRows) {
      expect(geometry.marginTop).toBe("0px");
      expect(geometry.marginBottom).toBe("0px");
      expect(geometry.paddingLeft).toBe("0px");
      expect(geometry.paddingRight).toBe("0px");
    }

    await selectDinner(page);
    const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
    await expect(toolbar).not.toContainText("matching");
    await expect(toolbar.getByRole("button", { name: "Edit", exact: true })).toBeEnabled();
    await expect.poll(measureRows).toEqual(normalRows);
    const singleToolbarBounds = (await toolbar.boundingBox())!;

    await row(page, "coffee").getByRole("checkbox").check();
    await expect(toolbar).toContainText("2 selected");
    await expect(toolbar.getByRole("button", { name: "Edit", exact: true })).toBeDisabled();
    await expect.poll(measureRows).toEqual(normalRows);
    expect((await toolbar.boundingBox())!.height).toBe(singleToolbarBounds.height);

    await toolbar.getByRole("checkbox", { name: "All", exact: true }).click();
    await expect(toolbar).toContainText("3 selected");
    await expect.poll(measureRows).toEqual(normalRows);
    const allLabel = toolbar.locator(".expense-selection-all");
    const deleteButton = toolbar.getByRole("button", { name: "Delete", exact: true });
    const actionAlignment = await toolbar.locator(".expense-selection-main").evaluate((element) => {
      const first = element.firstElementChild as HTMLElement;
      const last = element.lastElementChild as HTMLElement;
      return Math.abs(first.offsetTop - last.offsetTop);
    });
    expect(actionAlignment).toBe(0);
    await expect(deleteButton).toBeVisible();
    await expect(deleteButton).toHaveText("");
    await expect(toolbar.getByRole("button", { name: "Edit", exact: true })).toHaveText("");
    await expect(toolbar.getByRole("button", { name: "Cancel", exact: true })).toHaveCount(0);
    const allBounds = (await allLabel.boundingBox())!;
    const mainBounds = (await toolbar.locator(".expense-selection-main").boundingBox())!;
    const deleteBounds = (await deleteButton.boundingBox())!;
    const countBounds = (await toolbar.getByRole("status").boundingBox())!;
    const toolbarBounds = (await toolbar.boundingBox())!;
    const rootFontSize = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).fontSize),
    );
    expect(allBounds.width).toBeLessThan(toolbarBounds.width * 0.5);
    expect(Math.abs(allBounds.x - mainBounds.x)).toBeLessThan(1);
    expect(
      Math.abs(deleteBounds.x + deleteBounds.width - mainBounds.x - mainBounds.width),
    ).toBeLessThan(1);
    expect(countBounds.y).toBeGreaterThanOrEqual(mainBounds.y + mainBounds.height);
    expect(toolbarBounds.height).toBeLessThanOrEqual(rootFontSize * 6);
    expect(toolbarBounds.height).toBe(singleToolbarBounds.height);
    expect(allBounds.height).toBeGreaterThanOrEqual(rootFontSize * 2.75);
    expect(deleteBounds.height).toBeGreaterThanOrEqual(rootFontSize * 2.75);
    for (const geometry of normalRows) {
      expect(parseFloat(geometry.linkPaddingTop)).toBe(rootFontSize * 0.5);
      expect(parseFloat(geometry.linkPaddingBottom)).toBe(rootFontSize * 0.5);
    }
    await page.screenshot({ path: test.info().outputPath(`selection-${width}.png`) });

    const coffeeBounds = (await row(page, "coffee").boundingBox())!;
    const taxiBounds = (await row(page, "taxi").boundingBox())!;
    expect(taxiBounds.y - coffeeBounds.y - coffeeBounds.height).toBeCloseTo(0, 0);
    for (const id of ["coffee", "taxi", "dinner"]) {
      const geometry = await row(page, id).evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const checkbox = element.querySelector("input")!.getBoundingClientRect();
        const body = element.querySelector(".expense-list-item-body")!.getBoundingClientRect();
        const timestamp = element.querySelector<HTMLElement>(".expense-entry-timestamp")!;
        const dateBounds = timestamp.getBoundingClientRect();
        return {
          checkboxInset: bounds.right - checkbox.right,
          checkboxAlignment: Math.abs(
            checkbox.top + checkbox.height / 2 - body.top - body.height / 2,
          ),
          timestampInset: bounds.right - dateBounds.right,
          timestampOverflow: timestamp.scrollWidth - timestamp.clientWidth,
        };
      });
      expect(geometry.checkboxInset).toBeGreaterThanOrEqual(8);
      expect(geometry.checkboxAlignment).toBeLessThanOrEqual(2);
      expect(geometry.timestampInset).toBeGreaterThanOrEqual(8);
      expect(geometry.timestampOverflow).toBeLessThanOrEqual(1);
    }

    for (const id of ["coffee", "taxi", "dinner"]) {
      await row(page, id).getByRole("checkbox").click();
      await expect.poll(measureRows).toEqual(normalRows);
      if (id !== "dinner") {
        expect((await toolbar.boundingBox())!.height).toBe(singleToolbarBounds.height);
      }
    }
    await expect(toolbar).toHaveCount(0);
    await expect(page.locator('[data-expense-id] input[type="checkbox"]')).toHaveCount(0);
    const afterPadding = await page.locator(".expense-ledger-list").evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
    });
    expect(afterPadding).toEqual(containerPadding);
    await expect.poll(measureRows).toEqual(normalRows);
  }
});

test("shows partial and checked All states and exits selection without deleting records", async ({
  page,
}) => {
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  const all = toolbar.getByRole("checkbox", { name: "All", exact: true });
  await expect(all).toHaveAttribute("aria-checked", "mixed");
  await expect(all).toHaveJSProperty("indeterminate", true);
  await expect(all).toHaveJSProperty("checked", false);
  await all.click();
  await expect(all).toBeChecked();
  await expect(all).toHaveJSProperty("indeterminate", false);
  await expect(all).toHaveAttribute("aria-checked", "true");
  await expect(page.locator("[data-expense-id] input:checked")).toHaveCount(3);
  await row(page, "coffee").getByRole("checkbox").uncheck();
  await expect(all).toHaveJSProperty("indeterminate", true);
  await expect(all).toBeEnabled();
  await all.click();
  await expect(all).toBeChecked();
  await all.click();
  await expect(toolbar).toHaveCount(0);
  await expect(page.locator('[data-expense-id] input[type="checkbox"]')).toHaveCount(0);
  await expect(page.locator("[data-expense-id]")).toHaveCount(3);
  const counts = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return { expenses: await db.expenses.count(), payments: await db.settlements.count() };
  });
  expect(counts).toEqual({ expenses: 3, payments: 1 });
  await row(page, "dinner").getByRole("link").click();
  await expect(page).toHaveURL(/\/expenses\/dinner$/u);
});

test("exits selection when the last checked expense is unchecked", async ({ page }) => {
  await selectDinner(page);
  await row(page, "dinner").getByRole("checkbox").click();
  await expect(page.getByRole("region", { name: "Expense selection", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-expense-id] input[type="checkbox"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Actions for Dinner", exact: true })).toBeVisible();
});

test("checks All immediately when the only visible expense is selected", async ({ page }) => {
  await page.goto("/groups/trip/expenses?name=Dinner");
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  const all = toolbar.getByRole("checkbox", { name: "All", exact: true });
  await expect(all).toBeChecked();
  await expect(all).toHaveJSProperty("indeterminate", false);
  await all.click();
  await expect(toolbar).toHaveCount(0);
  await expect(page).toHaveURL(/\?name=Dinner$/u);
  await expect(row(page, "dinner")).toBeVisible();
  await expect(row(page, "taxi")).toHaveCount(0);
});

test("supports selecting and clearing All with the keyboard", async ({ page }) => {
  await selectDinner(page);
  const toolbar = page.getByRole("region", { name: "Expense selection", exact: true });
  const all = toolbar.getByRole("checkbox", { name: "All", exact: true });
  await all.focus();
  await page.keyboard.press("Space");
  await expect(all).toBeChecked();
  await expect(toolbar).toContainText("3 selected");
  await page.keyboard.press("Space");
  await expect(toolbar).toHaveCount(0);
  await expect(page.locator('[data-expense-id] input[type="checkbox"]')).toHaveCount(0);
});

test("exits selection when its last expense is removed from the hydrated collection", async ({
  page,
}) => {
  await selectDinner(page);
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/store/index.ts";
    const { useStore } = (await import(/* @vite-ignore */ modulePath)) as typeof StoreModule;
    await useStore.getState().removeExpense("dinner", "trip");
  });
  await expect(page.getByRole("region", { name: "Expense selection", exact: true })).toHaveCount(0);
  await expect(page.locator('[data-expense-id] input[type="checkbox"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Actions for Taxi", exact: true })).toBeVisible();
});
