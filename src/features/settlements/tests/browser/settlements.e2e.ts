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
    await db.people.bulkPut([
      { id: "self", name: "Amy", icon: "🦊" },
      { id: "friend", name: "Bea", icon: "🐻" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "friend" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    await db.tags.put({ id: "cash", groupId: "trip", name: "Cash", color: "#218f68" });
    await db.expenses.put({
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      createdBy: "a",
      categoryId: "food",
      tagIds: [],
      attachmentIds: [],
      createdAt: 1,
      when: new Date("2026-10-01T19:00").getTime(),
      splitType: "equal",
      splitMeta: [],
      transactions: {
        paid: [{ memberId: "a", amount: 10_000 }],
        owes: [
          { memberId: "a", amount: 5_000 },
          { memberId: "b", amount: 5_000 },
        ],
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
  await page.goto("/groups/trip/balances");
});

test("edits an offsetting payment even when its removal would temporarily overflow", async ({
  page,
}) => {
  const timestamp = new Date("2026-10-01T12:05:23.123").getTime();
  await page.evaluate(async (when) => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.clear();
    await db.settlements.bulkPut(
      ["first", "second", "offset"].map((id) => ({
        id,
        groupId: "trip",
        kind: "payment" as const,
        fromMemberId: id === "offset" ? "b" : "a",
        toMemberId: id === "offset" ? "a" : "b",
        recordedBy: "a",
        createdAt: 1,
        when,
        amount: Number.MAX_SAFE_INTEGER,
        tagIds: [],
      })),
    );
  }, timestamp);
  await page.reload();
  const row = page
    .getByRole("list", { name: "Recorded payments" })
    .getByRole("listitem")
    .filter({ hasText: "Bea paid Amy" });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Edit payment", exact: true });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByLabel("Amount (INR)")).toHaveValue("90,071,992,547,409.91");
  await dialog.getByRole("button", { name: "Save payment", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  const saved = await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    return db.settlements.get("offset");
  });
  expect(saved).toMatchObject({ amount: Number.MAX_SAFE_INTEGER, when: timestamp });
});

test("records, displays, edits, and deletes a tagged group payment without increasing spending", async ({
  page,
}) => {
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText("₹50.00");
  await page.getByRole("button", { name: "Add payment" }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  await expect(dialog).toBeVisible();
  const modalHeight = await dialog.evaluate((element) => element.getBoundingClientRect().height);
  await dialog.getByRole("button", { name: "Paid by: Choose member" }).click();
  expect(await dialog.evaluate((element) => element.getBoundingClientRect().height)).toBe(
    modalHeight,
  );
  const payerOptions = dialog.getByRole("list", { name: "Paid by options" });
  await expect(payerOptions.locator(".avatar")).toHaveCount(2);
  const search = dialog.getByRole("textbox", { name: "Search paid by" });
  await expect(search).toHaveCSS("outline-style", "none");
  await search.fill("bea");
  await expect(payerOptions.getByRole("button", { name: "Amy" })).toHaveCount(0);
  await payerOptions.getByRole("button", { name: "Bea" }).click();
  await dialog.getByRole("button", { name: "Received by: Choose member" }).click();
  await dialog
    .getByRole("list", { name: "Received by options" })
    .getByRole("button", { name: "Amy" })
    .click();
  await expect(dialog.locator(".member-picker-trigger .avatar")).toHaveCount(2);
  await dialog.getByLabel("Amount (INR)").fill("20.00");
  await dialog.getByLabel("Date", { exact: true }).fill("2026-10-01");
  await dialog
    .getByRole("group", { name: "Time" })
    .getByRole("textbox", { name: "Hour" })
    .fill("8");
  await dialog
    .getByRole("group", { name: "Time" })
    .getByRole("textbox", { name: "Minute" })
    .fill("05");
  await dialog.getByRole("button", { name: "PM", exact: true }).click();
  await dialog.getByRole("checkbox", { name: "Cash" }).check();
  await dialog.getByRole("button", { name: "Record payment" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText("Bea paid Amy");
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText(
    "01-Oct-2026 · 08:05 PM",
  );
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText("₹30.00");
  await page.goto("/groups/trip/expenses");
  const payment = page.locator(".settlement-entry");
  await expect(payment).toContainText("Bea paid Amy");
  await expect(payment).toContainText("Cash");
  await expect(payment).toHaveCSS("background-color", "rgb(217, 246, 232)");
  await expect(page.getByRole("region", { name: "Expense insights" })).toContainText("₹100.00");
  await page.goto("/groups/trip");
  await expect(page.locator(".settlement-entry")).toHaveCount(1);
  await page.goto("/groups/trip/balances");
  await page
    .getByRole("list", { name: "Recorded payments" })
    .getByRole("button", { name: "Edit" })
    .click();
  const editDialog = page.getByRole("dialog", { name: "Edit payment" });
  await expect(editDialog.getByLabel("Date", { exact: true })).toHaveValue("2026-10-01");
  await expect(editDialog.getByRole("textbox", { name: "Hour" })).toHaveValue("08");
  await expect(editDialog.getByRole("textbox", { name: "Minute" })).toHaveValue("05");
  await editDialog.getByRole("button", { name: "Clear time", exact: true }).click();
  await expect(editDialog.getByRole("textbox", { name: "Hour" })).toBeEmpty();
  await expect(editDialog.getByRole("textbox", { name: "Minute" })).toBeEmpty();
  await expect(editDialog.getByLabel("Date", { exact: true })).toHaveValue("2026-10-01");
  await editDialog.getByRole("button", { name: "Save payment", exact: true }).click();
  await expect(editDialog.getByRole("alert")).toContainText("Time is required");
  await expect(editDialog.getByRole("textbox", { name: "Hour" })).toBeEmpty();
  await expect(editDialog.getByRole("textbox", { name: "Minute" })).toBeEmpty();
  await editDialog.getByRole("textbox", { name: "Hour" }).fill("08");
  await editDialog.getByRole("textbox", { name: "Minute" }).fill("05");
  await editDialog.getByLabel("Amount (INR)").fill("60.00");
  await expect(editDialog.getByText(/may reverse who owes whom/u)).toBeVisible();
  await editDialog.getByRole("button", { name: "Save payment" }).click();
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText("₹60.00");
  await page
    .getByRole("list", { name: "Recorded payments" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page.getByRole("button", { name: "Delete payment" }).click();
  await expect(page.getByText("No payments recorded in this group yet.")).toBeVisible();
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText("₹50.00");
});

for (const action of ["Add payment", "Settle up", "Edit"] as const) {
  test(`formats and limits payment amounts in ${action}`, async ({ page }) => {
    if (action === "Edit") {
      await page.evaluate(async () => {
        const path = "/src/shared/configs/db.ts";
        const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
        await db.settlements.put({
          id: "payment",
          groupId: "trip",
          kind: "payment",
          fromMemberId: "b",
          toMemberId: "a",
          recordedBy: "a",
          amount: 123_450,
          when: new Date("2026-10-01T20:05").getTime(),
          createdAt: 1,
          tagIds: [],
        });
      });
      await page.reload();
      await page
        .getByRole("list", { name: "Recorded payments" })
        .getByRole("button", { name: "Edit", exact: true })
        .click();
    } else {
      await page.getByRole("button", { name: action, exact: true }).click();
    }
    const dialog = page.getByRole("dialog", {
      name: action === "Edit" ? "Edit payment" : "Record payment",
      exact: true,
    });
    const amount = dialog.getByLabel("Amount (INR)", { exact: true });
    await expect(amount).toHaveAttribute("type", "text");
    await expect(amount).toHaveAttribute("inputmode", "decimal");
    if (action === "Edit") await expect(amount).toHaveValue("1,234.50");
    if (action === "Add payment") {
      await dialog.getByRole("button", { name: "Paid by: Choose member" }).click();
      await dialog
        .getByRole("list", { name: "Paid by options" })
        .getByRole("button", { name: "Bea", exact: true })
        .click();
      await dialog.getByRole("button", { name: "Received by: Choose member" }).click();
      await dialog
        .getByRole("list", { name: "Received by options" })
        .getByRole("button", { name: "Amy", exact: true })
        .click();
    }
    await amount.fill("");
    await amount.pressSequentially("abc+-eE! 12.50");
    await expect(amount).toHaveValue("12.50");
    await amount.fill("letters only!");
    await expect(amount).toBeEmpty();
    await amount.pressSequentially("99999999999.999");
    await expect(amount).toHaveValue("99,999,999.99");
    await expect(amount.locator("..").getByRole("alert")).toHaveCount(0);
    await amount.fill("");
    await page.keyboard.insertText("INR -123,456,789.1234e+");
    await expect(amount).toHaveValue("12,345,678.12");
    await amount.press("End");
    await amount.press("Backspace");
    await expect(amount).toHaveValue("12,345,678.1");
    await amount.pressSequentially("5");
    await expect(amount).toHaveValue("12,345,678.15");
    await amount.fill("1234.");
    await expect(amount).toHaveValue("1,234.");
    await amount.pressSequentially("00");
    await expect(amount).toHaveValue("1,234.00");
    await amount.fill("1234");
    await amount.evaluate((input: HTMLInputElement) => input.setSelectionRange(2, 2));
    await amount.press("Backspace");
    await expect(amount).toHaveValue("234");
    await amount.fill("1234");
    await amount.evaluate((input: HTMLInputElement) => input.setSelectionRange(1, 1));
    await amount.press("Delete");
    await expect(amount).toHaveValue("134");
    await amount.fill("1234567.899");
    await expect(amount).toHaveValue("1,234,567.89");
    await dialog
      .getByRole("button", {
        name: action === "Edit" ? "Save payment" : "Record payment",
        exact: true,
      })
      .click();
    await expect(dialog).toHaveCount(0);
    const stored = await page.evaluate(async () => {
      const path = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
      return (await db.settlements.toArray())[0].amount;
    });
    expect(stored).toBe(123_456_789);
    await page
      .getByRole("list", { name: "Recorded payments" })
      .getByRole("button", { name: "Edit", exact: true })
      .click();
    await expect(page.getByRole("dialog").getByLabel("Amount (INR)")).toHaveValue("1,234,567.89");
  });
}

test("uses the same formatting and amount limits for non-INR payments", async ({ page }) => {
  await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    await db.groups.update("trip", { currency: "USD" });
  });
  await page.reload();
  await page.getByRole("button", { name: "Settle up", exact: true }).click();
  const amount = page.getByRole("dialog").getByLabel("Amount (USD)", { exact: true });
  await amount.fill("1234567.89");
  await expect(amount).toHaveValue("1,234,567.89");
  await amount.fill("123456789.999");
  await expect(amount).toHaveValue("12,345,678.99");
  await amount.pressSequentially("9");
  await expect(amount).toHaveValue("12,345,678.99");
});

test("silently limits the payment date year to four digits and allows reentry", async ({
  page,
}) => {
  await page.getByRole("button", { name: "Add payment", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment", exact: true });
  const date = dialog.getByLabel("Date", { exact: true });
  await expect(date).toHaveAttribute("max", "9999-12-31");
  await date.fill("2026-10-11");
  for (const value of ["20267-10-11", "20268-10-11", "202678-10-11"]) {
    await date.fill(value);
    await expect(date).toHaveValue("2026-10-11");
    await expect(dialog.getByRole("alert")).toHaveCount(0);
  }
  await date.fill("");
  await expect(date).toBeEmpty();
  await date.fill("2030-10-11");
  await expect(date).toHaveValue("2030-10-11");
  await date.press("ArrowRight");
  await date.press("ArrowRight");
  await date.press("Backspace");
  await date.pressSequentially("2026789");
  await expect(date).toHaveValue("2026-10-11");
  await date.press("Backspace");
  await date.pressSequentially("2030");
  await expect(date).toHaveValue("2030-10-11");
});

test("places date and time errors under only their respective payment fields", async ({ page }) => {
  await page.getByRole("button", { name: "Settle up", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment", exact: true });
  const picker = dialog.getByRole("group", { name: "Date and time" });
  const dateField = picker.locator(".when-picker-field").first();
  const timeField = picker.locator(".when-picker-field").last();
  const date = dialog.getByLabel("Date", { exact: true });
  const hour = dialog.getByRole("textbox", { name: "Hour", exact: true });
  const minute = dialog.getByRole("textbox", { name: "Minute", exact: true });
  const save = dialog.getByRole("button", { name: "Record payment", exact: true });
  await date.fill("");
  await save.click();
  await expect(dateField.getByRole("alert")).toHaveText("Date is required");
  await expect(timeField.getByRole("alert")).toHaveCount(0);
  await expect(date).toHaveAttribute("aria-invalid", "true");
  await expect(date).toHaveAccessibleDescription("Date is required");
  await expect(hour).not.toHaveAttribute("aria-invalid", "true");
  await expect(minute).not.toHaveAttribute("aria-invalid", "true");

  await date.fill("2026-10-11");
  await minute.fill("99");
  await save.click();
  await expect(dateField.getByRole("alert")).toHaveCount(0);
  await expect(timeField.getByRole("alert")).toHaveText("Enter a valid time");
  await expect(date).not.toHaveAttribute("aria-invalid", "true");
  await expect(hour).toHaveAccessibleDescription("Enter a valid time");
  await expect(minute).toHaveAttribute("aria-invalid", "true");
  await expect(minute).toHaveAccessibleDescription("Enter a valid time");

  await date.fill("");
  await picker.getByRole("button", { name: "Clear time", exact: true }).click();
  await save.click();
  await expect(dateField.getByRole("alert")).toHaveText("Date is required");
  await expect(timeField.getByRole("alert")).toHaveText("Time is required");
  await expect(picker.getByRole("alert")).toHaveCount(2);
  for (const width of [320, 820, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    for (const field of [dateField, timeField]) {
      const error = (await field.getByRole("alert").boundingBox())!;
      const input = (await field.locator(".when-picker-date, .when-picker-time").boundingBox())!;
      expect(error.y).toBeGreaterThanOrEqual(input.y + input.height);
    }
  }
  await date.fill("2026-10-11");
  await expect(dateField.getByRole("alert")).toHaveCount(0);
  await expect(timeField.getByRole("alert")).toHaveText("Time is required");
  await hour.fill("09");
  await minute.fill("15");
  await expect(picker.getByRole("alert")).toHaveCount(0);
  await save.click();
  await expect(dialog).toHaveCount(0);
});

test("matches bold date and time typography in the payment picker", async ({ page }) => {
  await page.getByRole("button", { name: "Add payment", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment", exact: true });
  const date = dialog.getByLabel("Date", { exact: true });
  const numbers = dialog.locator(".when-picker-number");
  for (const width of [320, 820, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    await expect(date).toHaveCSS("font-weight", "800");
    for (const property of ["font-family", "font-size", "font-weight"]) {
      const expected = await date.evaluate(
        (element, name) => getComputedStyle(element).getPropertyValue(name),
        property,
      );
      for (const number of await numbers.all()) await expect(number).toHaveCSS(property, expected);
    }
  }
});

for (const width of [320, 820, 1440]) {
  test(`shows compact colour-labelled payment tag options at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.getByRole("button", { name: "Add payment", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Record payment", exact: true });
    const checkbox = dialog.getByRole("checkbox", { name: "Cash", exact: true });
    const option = checkbox.locator("..");
    const swatch = option.locator('span[aria-hidden="true"]');
    await expect(option).toHaveClass(/choice-option-compact/u);
    await expect(option).toContainText("Cash");
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (value) => document.documentElement.setAttribute("data-theme", value),
        theme,
      );
      await expect(swatch).toBeVisible();
      await expect(swatch).toHaveCSS("background-color", "rgb(33, 143, 104)");
      const dimensions = await option.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          fontSize: parseFloat(style.fontSize),
          height: element.getBoundingClientRect().height,
          paddingY: parseFloat(style.paddingTop),
        };
      });
      expect(dimensions.fontSize).toBeLessThanOrEqual(12);
      expect(dimensions.height).toBeLessThanOrEqual(40);
      expect(dimensions.paddingY).toBeLessThanOrEqual(8);
      await checkbox.check();
      await expect(checkbox).toBeChecked();
      await expect(swatch).toHaveCSS("background-color", "rgb(33, 143, 104)");
      await checkbox.uncheck();
      await expect(checkbox).not.toBeChecked();
    }
    await checkbox.focus();
    await page.keyboard.press("Space");
    await expect(checkbox).toBeChecked();
    await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(dialog).toHaveCount(0);
  });
}

test("prefills settle up from a suggested transfer", async ({ page }) => {
  const timestamp = new Date("2026-10-11T13:07:00.000Z");
  await page.clock.setFixedTime(timestamp);
  await page.getByRole("button", { name: "Settle up" }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  await expect(dialog.getByRole("button", { name: "Paid by: Bea" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Received by: Amy" })).toBeVisible();
  await expect(dialog.getByLabel("Amount (INR)")).toHaveValue("50.00");
  await expect(dialog.getByLabel("Date", { exact: true })).toHaveValue("2026-10-11");
  await expect(dialog.getByRole("textbox", { name: "Hour" })).toHaveValue("06");
  await expect(dialog.getByRole("textbox", { name: "Minute" })).toHaveValue("37");
  await expect(dialog.getByRole("button", { name: "PM", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog.getByRole("button", { name: "Clear time", exact: true })).toBeVisible();
  await dialog.getByRole("button", { name: "Record payment" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("region", { name: "Suggested payments" })).toContainText(
    "No payments needed",
  );
  const savedTime = await page.evaluate(async () => {
    const path = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ path)) as typeof DbModule;
    return (await db.settlements.toArray())[0].when;
  });
  expect(savedTime).toBe(timestamp.getTime());
});

test("prefills new payment time and clears it without changing the selected date", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date("2026-10-11T13:07:00.000Z"));
  await page.getByRole("button", { name: "Add payment", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment", exact: true });
  const date = dialog.getByLabel("Date", { exact: true });
  const hour = dialog.getByRole("textbox", { name: "Hour" });
  const minute = dialog.getByRole("textbox", { name: "Minute" });
  await expect(date).toHaveValue("2026-10-11");
  await expect(hour).toHaveValue("06");
  await expect(minute).toHaveValue("37");
  await expect(dialog.getByRole("button", { name: "PM", exact: true })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(dialog.getByRole("button", { name: "Use current time" })).toHaveCount(0);
  await date.fill("2026-10-10");
  await dialog.getByRole("button", { name: "Clear time", exact: true }).click();
  await expect(hour).toBeEmpty();
  await expect(minute).toBeEmpty();
  await expect(date).toHaveValue("2026-10-10");
  await dialog.getByRole("button", { name: "Clear time", exact: true }).click();
  await dialog.getByRole("button", { name: "Record payment", exact: true }).click();
  await expect(dialog.getByText("Time is required", { exact: true })).toBeVisible();
  await expect(hour).toBeEmpty();
  await expect(minute).toBeEmpty();
  await hour.fill("09");
  await minute.fill("15");
  await dialog.getByRole("button", { name: "AM", exact: true }).click();
  await expect(hour).toHaveValue("09");
  await expect(minute).toHaveValue("15");
  await expect(date).toHaveValue("2026-10-10");
});

test("shows readable transfer cards with a prominent amount and right-aligned Settle up action", async ({
  page,
}) => {
  const suggestion = page.getByRole("region", { name: "Suggested payments" }).locator("li").first();
  const people = suggestion.locator(".suggested-transfer-people");
  const parties = people.locator(".transfer-person");
  const arrow = people.locator(".suggested-transfer-arrow");
  const actions = suggestion.locator(".suggested-transfer-actions");
  const amount = actions.locator("strong");
  const button = actions.getByRole("button", { name: "Settle up" });
  await expect(
    page.getByText("Suggestions do not record money until you save a payment."),
  ).toHaveCount(0);
  await expect(button).toHaveCSS("background-color", "rgb(121, 94, 203)");
  const viewports = [
    { width: 320, rootFontSize: 14 },
    { width: 1280, rootFontSize: 16 },
  ];
  const checkLayout = async (rootFontSize: number) => {
    await expect(page.locator("html")).toHaveCSS("font-size", `${rootFontSize}px`);
    const fontScale = rootFontSize / 16;
    const suggestionBox = (await suggestion.boundingBox())!;
    const peopleBox = (await people.boundingBox())!;
    const actionsBox = (await actions.boundingBox())!;
    const amountBox = (await amount.boundingBox())!;
    const buttonBox = (await button.boundingBox())!;
    const fromBox = (await parties.first().boundingBox())!;
    const toBox = (await parties.last().boundingBox())!;
    const arrowBox = (await arrow.boundingBox())!;
    expect(fromBox.x + fromBox.width).toBeLessThanOrEqual(arrowBox.x);
    expect(arrowBox.x + arrowBox.width).toBeLessThanOrEqual(toBox.x);
    expect(actionsBox.y).toBeGreaterThan(peopleBox.y + peopleBox.height);
    expect(suggestionBox.height).toBeGreaterThan(120);
    expect(buttonBox.height).toBeGreaterThanOrEqual(36 * fontScale);
    expect(buttonBox.height).toBeLessThanOrEqual(42 * fontScale);
    expect(buttonBox.x).toBeGreaterThanOrEqual(amountBox.x + amountBox.width);
    expect(buttonBox.width).toBeLessThan(actionsBox.width / 2);
    expect(Math.abs(buttonBox.x + buttonBox.width - actionsBox.x - actionsBox.width)).toBeLessThan(
      2,
    );
    expect(suggestionBox.width).toBeLessThanOrEqual(
      await suggestion.evaluate((element) => element.parentElement!.clientWidth),
    );
    expect(await amount.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(
      true,
    );
    const nameSize = await parties
      .first()
      .locator(".suggested-transfer-name")
      .evaluate((element) => Number.parseFloat(getComputedStyle(element).fontSize));
    const amountSize = await amount.evaluate((element) =>
      Number.parseFloat(getComputedStyle(element).fontSize),
    );
    expect(amountSize).toBeGreaterThan(nameSize);
  };

  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.people.update("friend", { name: "Alexandria Montgomery" });
  });
  await page.reload();
  await expect(parties.first()).toContainText("Alexandria Montgomery");
  await expect(parties.first().locator(".avatar")).toHaveCount(1);
  await expect(parties.last().locator(".avatar")).toHaveCount(1);
  for (const { width, rootFontSize } of viewports) {
    await page.setViewportSize({ width, height: 800 });
    await checkLayout(rootFontSize);
  }
  await expect(amount).toHaveText("₹50.00");
  await page.evaluate(async () => {
    const modulePath = "/src/shared/configs/db.ts";
    const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
    await db.expenses.update("dinner", {
      transactions: {
        paid: [{ memberId: "a", amount: 19_999_998 }],
        owes: [
          { memberId: "a", amount: 9_999_999 },
          { memberId: "b", amount: 9_999_999 },
        ],
      },
    });
  });
  await page.reload();
  await expect(amount).toHaveText("₹99,999.99");
  for (const { width, rootFontSize } of viewports) {
    await page.setViewportSize({ width, height: 800 });
    await checkLayout(rootFontSize);
  }
});

test("stacks balance sections on tablets and places them side by side on desktop", async ({
  page,
}) => {
  const cards = page.locator(".balances-summary-grid > .surface");
  await expect(cards).toHaveCount(2);
  await page.setViewportSize({ width: 800, height: 800 });
  const tabletMember = (await cards.first().boundingBox())!;
  const tabletTransfers = (await cards.last().boundingBox())!;
  expect(tabletTransfers.y).toBeGreaterThanOrEqual(tabletMember.y + tabletMember.height);
  expect(Math.abs(tabletTransfers.width - tabletMember.width)).toBeLessThan(2);

  await page.setViewportSize({ width: 1280, height: 800 });
  const desktopMember = (await cards.first().boundingBox())!;
  const desktopTransfers = (await cards.last().boundingBox())!;
  expect(Math.abs(desktopTransfers.y - desktopMember.y)).toBeLessThan(2);
  expect(desktopTransfers.x).toBeGreaterThanOrEqual(desktopMember.x + desktopMember.width);
});

test("filters numeric time input in payment creation and editing", async ({ page }) => {
  await page.getByRole("button", { name: "Settle up", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment", exact: true });
  const hour = dialog.getByRole("textbox", { name: "Hour", exact: true });
  const minute = dialog.getByRole("textbox", { name: "Minute", exact: true });
  await dialog.getByRole("button", { name: "Clear time", exact: true }).click();
  await hour.pressSequentially("abc+-e.");
  await expect(hour).toBeEmpty();
  await expect(hour).toBeFocused();
  await hour.pressSequentially("1a2");
  await expect(hour).toHaveValue("12");
  await expect(minute).toBeFocused();
  await page.keyboard.insertText("minutes 0a5:678");
  await expect(minute).toHaveValue("05");
  await dialog.getByRole("button", { name: "PM", exact: true }).click();
  await dialog.getByRole("button", { name: "Record payment", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page
    .getByRole("list", { name: "Recorded payments" })
    .getByRole("button", { name: "Edit", exact: true })
    .click();
  const editor = page.getByRole("dialog", { name: "Edit payment", exact: true });
  await expect(editor.getByRole("textbox", { name: "Hour" })).toHaveValue("12");
  await expect(editor.getByRole("textbox", { name: "Minute" })).toHaveValue("05");
  await editor.getByRole("textbox", { name: "Hour" }).fill("hour 0a9");
  await editor.getByRole("textbox", { name: "Minute" }).fill("minute 3b0");
  await expect(editor.getByRole("textbox", { name: "Hour" })).toHaveValue("09");
  await expect(editor.getByRole("textbox", { name: "Minute" })).toHaveValue("30");
  await editor.getByRole("button", { name: "AM", exact: true }).click();
  await editor.getByRole("button", { name: "Save payment", exact: true }).click();
  await expect(editor).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("list", { name: "Recorded payments" })).toContainText("09:30 AM");
});

test("transfers time focus in the payment modal in both directions", async ({ page }) => {
  await page.getByRole("button", { name: "Add payment" }).click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  const hour = dialog.getByRole("textbox", { name: "Hour" });
  const minute = dialog.getByRole("textbox", { name: "Minute" });

  await dialog.getByRole("button", { name: "Clear time", exact: true }).click();
  await hour.pressSequentially("1");
  await expect(hour).toBeFocused();
  await hour.pressSequentially("2");
  await expect(minute).toBeFocused();
  await minute.pressSequentially("4");
  await minute.press("Backspace");
  await expect(minute).toBeFocused();
  await minute.press("Backspace");
  await expect(hour).toBeFocused();
  expect(await hour.evaluate((input: HTMLInputElement) => input.selectionStart)).toBe(2);
});

test("opens Add payment from the expense ledger and cancels without saving", async ({ page }) => {
  await page.goto("/groups/trip/expenses");
  const addPayment = page.getByRole("link", { name: "Add payment" });
  await expect(addPayment.locator("svg.ui-icon")).toHaveCount(1);
  await addPayment.click();
  const dialog = page.getByRole("dialog", { name: "Record payment" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByText("No payments recorded in this group yet.")).toBeVisible();
});
