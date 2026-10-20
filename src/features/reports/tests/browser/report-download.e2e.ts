import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

import type * as DbModule from "@/shared/configs/db";
import type * as StoreModule from "@/shared/configs/store";

import type { OnboardingSettings } from "@/shared/types/domain.types";

const OPTIONS_KEY = "split-slate-expense-pdf-options";

const openExpenseOptions = async (page: Page) => {
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Choose PDF fields", exact: true });
  await expect(dialog).toBeVisible();
  return dialog;
};

const generateExpensePdf = async (page: Page) => {
  const dialog = await openExpenseOptions(page);
  await dialog.getByRole("button", { name: "Generate PDF", exact: true }).click();
  await expect(dialog).toHaveCount(0);
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
      { id: "third", name: "Cal", icon: "🐱" },
    ]);
    await db.groups.put({
      id: "trip",
      name: "Weekend Trip",
      icon: "🏕️",
      currency: "INR",
      createdAt: 1,
      frequentPayerIds: ["a"],
    });
    await db.members.bulkPut([
      { id: "a", groupId: "trip", personId: "self" },
      { id: "b", groupId: "trip", personId: "friend" },
      { id: "c", groupId: "trip", personId: "third" },
    ]);
    await db.categories.put({
      id: "food",
      groupId: "trip",
      name: "Food",
      icon: "🍽️",
      isActive: true,
    });
    const expense = {
      groupId: "trip",
      categoryId: "food",
      createdBy: "a",
      createdAt: 1,
      when: new Date("2026-10-01T19:00:00+05:30").getTime(),
      splitType: "equal" as const,
      splitMeta: [],
      tagIds: [],
      attachmentIds: [],
      transactions: {
        paid: [{ memberId: "a", amount: 10001 }],
        owes: [
          { memberId: "a", amount: 5001 },
          { memberId: "b", amount: 5000 },
        ],
      },
    };
    await db.expenses.bulkPut([
      { ...expense, expenseId: "dinner", expenseName: "Dinner" },
      { ...expense, expenseId: "lunch", expenseName: "Lunch", createdAt: 2 },
    ]);
    await db.settlements.put({
      id: "payment",
      groupId: "trip",
      kind: "payment",
      fromMemberId: "b",
      toMemberId: "a",
      recordedBy: "a",
      amount: 2000,
      when: 3,
      createdAt: 3,
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
});

test("passes only listed expenses and full member splits to the PDF engine", async ({ page }) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `export const downloadReportPdf = async (report) => {
        sessionStorage.setItem("test-pdf-report", JSON.stringify(report,
          (_, value) => typeof value === "bigint" ? String(value) : value));
      };`,
    });
  });
  await page.goto("/groups/trip/expenses?memberIds=b&sort=name-desc");
  await page.getByRole("searchbox", { name: "Search expenses" }).fill("dinner");
  await expect(page.getByRole("list", { name: "Expenses", exact: true })).toContainText("Dinner");
  await expect(page.getByRole("list", { name: "Expenses", exact: true })).not.toContainText(
    "Lunch",
  );
  await generateExpensePdf(page);
  const data = await page.evaluate(() => JSON.parse(sessionStorage.getItem("test-pdf-report")!));
  expect(data.expenses.map((expense: { name: string }) => expense.name)).toEqual(["Dinner"]);
  expect(data.filters).toContain("Member involved: Bea");
  expect(data.sort).toBe("Name: Z–A");
  expect(data.expenses[0].allocations).toEqual([
    { memberId: "a", paid: "10001", owed: "5001", detail: "" },
    { memberId: "b", paid: null, owed: "5000", detail: "" },
    { memberId: "c", paid: null, owed: null, detail: "" },
  ]);
  expect(data.total).toBe("10001");
  expect(data.payments).toEqual([]);
  expect(data.fields).toContain("member-shares");
});

for (const route of ["expenses?name=Dinner", "balances"] as const) {
  test(`downloads a real PDF from ${route} without printing or opening another window`, async ({
    page,
    context,
  }) => {
    await page.addInitScript(() => {
      window.print = () => {
        throw new Error("Print must not be used for PDF downloads");
      };
      window.open = () => {
        throw new Error("PDF downloads must not open a window");
      };
    });
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(`/groups/trip/${route}`);
    const pending = page.waitForEvent("download");
    if (route.startsWith("expenses")) {
      await generateExpensePdf(page);
    } else {
      await page.getByRole("button", { name: "Download PDF", exact: true }).click();
      await expect(page.getByRole("dialog", { name: "Choose PDF fields" })).toHaveCount(0);
      expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
    }
    const download = await pending;
    const kind = route.startsWith("expenses") ? "expenses" : "balances";
    expect(download.suggestedFilename()).toBe(`weekend-trip-${kind}.pdf`);
    expect(await download.failure()).toBeNull();
    const stream = await download.createReadStream();
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(Buffer.from(chunk));
    const bytes = Buffer.concat(chunks);
    expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(1000);
    await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeEnabled();
    expect(context.pages()).toHaveLength(1);
    expect(errors).toEqual([]);
  });
}

test("exports payment-aware full-group balances rather than hidden expense filters", async ({
  page,
}) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `export const downloadReportPdf = async (report) => {
        sessionStorage.setItem("test-pdf-report", JSON.stringify(report,
          (_, value) => typeof value === "bigint" ? String(value) : value));
      };`,
    });
  });
  await page.goto("/groups/trip/balances?name=Dinner");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  const data = await page.evaluate(() => JSON.parse(sessionStorage.getItem("test-pdf-report")!));
  expect(data.expenses).toHaveLength(2);
  expect(data.total).toBe("20002");
  expect(data.members.map((member: { net: number }) => member.net)).toEqual([8000, -8000, 0]);
  expect(data.payments).toHaveLength(1);
  expect(data.transfers).toEqual([{ from: "Bea", to: "Amy", amount: 8000 }]);
  await expect(page.getByRole("dialog", { name: "Choose PDF fields" })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
});

test("disables invalid-filter and no-match downloads without saving preferences", async ({
  page,
}) => {
  await page.goto("/groups/trip/expenses?minAmount=bad");
  await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeDisabled();
  await page.goto("/groups/trip/expenses?name=NoSuchExpense");
  await expect(
    page.getByText("No expenses match these filters. Loosen one, or start fresh."),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "No expenses match the current filters." }),
  ).toBeVisible();
  await expect(page.getByRole("dialog", { name: "Choose PDF fields" })).toHaveCount(0);
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
});

for (const kind of ["expenses", "balances"] as const) {
  test(`blocks ${kind} downloads for a group without expenses despite recorded repayments`, async ({
    page,
  }) => {
    await page.evaluate(async () => {
      const modulePath = "/src/shared/configs/db.ts";
      const { db } = (await import(/* @vite-ignore */ modulePath)) as typeof DbModule;
      await db.expenses.where("groupId").equals("trip").delete();
    });
    await page.goto(`/groups/trip/${kind}`);
    await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeDisabled();
    await expect(
      page.getByRole("status").filter({ hasText: "Add an expense before downloading a PDF." }),
    ).toBeVisible();
    expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
  });
}

test("numbers selected checkboxes, renumbers removals, and saves reselection order", async ({
  page,
}) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `export const downloadReportPdf = async (report) => {
        sessionStorage.setItem("test-pdf-fields", JSON.stringify(report.fields));
      };`,
    });
  });
  await page.goto("/groups/trip/expenses");
  const dialog = await openExpenseOptions(page);
  for (const checkbox of await dialog.getByRole("checkbox").all()) await checkbox.uncheck();
  const tags = dialog.getByRole("checkbox", { name: "Tags", exact: true });
  const shares = dialog.getByRole("checkbox", { name: "Member shares", exact: true });
  const name = dialog.getByRole("checkbox", { name: "Expense name", exact: true });
  await tags.check();
  await expect(tags.locator("..").locator("[data-selection-order]")).toHaveText("1");
  await expect(dialog.getByRole("button", { name: "Generate PDF", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("alert")).toContainText("selected fields have no values");
  await shares.focus();
  await page.keyboard.press("Space");
  await name.check();
  await expect(shares.locator("..").locator("[data-selection-order]")).toHaveText("2");
  await expect(name.locator("..").locator("[data-selection-order]")).toHaveText("3");
  expect(await name.evaluate((element) => getComputedStyle(element, "::after").display)).toBe(
    "none",
  );
  await shares.uncheck();
  await expect(name.locator("..").locator("[data-selection-order]")).toHaveText("2");
  await expect(shares.locator("..").locator("[data-selection-order]")).toHaveCount(0);
  await shares.check();
  await expect(shares.locator("..").locator("[data-selection-order]")).toHaveText("3");
  await dialog.getByRole("button", { name: "Generate PDF", exact: true }).click();
  await expect(dialog).toHaveCount(0);
  expect(await page.evaluate(() => JSON.parse(sessionStorage.getItem("test-pdf-fields")!))).toEqual(
    ["tags", "name", "member-shares"],
  );
  expect(
    JSON.parse((await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY))!),
  ).toEqual({
    version: 1,
    fields: ["tags", "name", "member-shares"],
  });
  await page.reload();
  const reopened = await openExpenseOptions(page);
  for (const [label, number] of [
    ["Tags", "1"],
    ["Expense name", "2"],
    ["Member shares", "3"],
  ]) {
    const checkbox = reopened.getByRole("checkbox", { name: label, exact: true });
    await expect(checkbox).toBeChecked();
    await expect(checkbox.locator("..").locator("[data-selection-order]")).toHaveText(number);
  }
});

test("blocks empty chosen fields and keeps saved choices until a printable selection succeeds", async ({
  page,
}) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `export const downloadReportPdf = async () => {
        sessionStorage.setItem("test-pdf-called", "yes");
      };`,
    });
  });
  await page.goto("/groups/trip/expenses");
  const saved = '{"version":1,"fields":["tags","description"]}';
  await page.evaluate(({ key, value }) => localStorage.setItem(key, value), {
    key: OPTIONS_KEY,
    value: saved,
  });
  const dialog = await openExpenseOptions(page);
  const generate = dialog.getByRole("button", { name: "Generate PDF", exact: true });
  await expect(generate).toBeDisabled();
  await expect(dialog.getByRole("alert")).toContainText("selected fields have no values");
  await dialog.getByRole("checkbox", { name: "Tags", exact: true }).focus();
  await page.keyboard.press("Enter");
  expect(await page.evaluate(() => sessionStorage.getItem("test-pdf-called"))).toBeNull();
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBe(saved);
  await dialog.getByRole("checkbox", { name: "Member shares", exact: true }).check();
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(dialog).toHaveCount(0);
  expect(
    JSON.parse((await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY))!),
  ).toEqual({
    version: 1,
    fields: ["tags", "description", "member-shares"],
  });
});

test("blocks Generate if expenses disappear while the field dialog is open", async ({ page }) => {
  await page.goto("/groups/trip/expenses");
  const dialog = await openExpenseOptions(page);
  await page.evaluate(async () => {
    const dbPath = "/src/shared/configs/db.ts";
    const storePath = "/src/shared/configs/store/index.ts";
    const { db } = (await import(/* @vite-ignore */ dbPath)) as typeof DbModule;
    const { useStore } = (await import(/* @vite-ignore */ storePath)) as typeof StoreModule;
    await db.expenses.where("groupId").equals("trip").delete();
    useStore.setState((state) => ({
      expenses: state.expenses.filter((expense) => expense.groupId !== "trip"),
    }));
  });
  await expect(dialog.getByRole("button", { name: "Generate PDF", exact: true })).toBeDisabled();
  await expect(dialog.getByRole("alert")).toContainText("Add an expense before downloading a PDF.");
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
});

test("shows generation errors and allows a retry", async ({ page }) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: `let attempts = 0;
        export const downloadReportPdf = async () => {
          if (++attempts === 1) throw new Error("PDF generation failed. Try again.");
        };`,
    });
  });
  await page.goto("/groups/trip/expenses");
  const button = page.getByRole("button", { name: "Download PDF", exact: true });
  const dialog = await openExpenseOptions(page);
  const generate = dialog.getByRole("button", { name: "Generate PDF", exact: true });
  await generate.click();
  await expect(page.getByRole("alert")).toContainText("PDF generation failed. Try again.");
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
  await expect(generate).toBeEnabled();
  await generate.click();
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(button).toBeEnabled();
});

test("remembers expense fields only after generation and restores them on reopen and reload", async ({
  page,
}) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: "export const downloadReportPdf = async () => {};",
    });
  });
  await page.goto("/groups/trip/expenses");
  const dialog = await openExpenseOptions(page);
  await expect(dialog.getByRole("checkbox", { name: "Expense name", exact: true })).toBeChecked();
  await expect(dialog.getByRole("checkbox", { name: /Sl\.?\s*No/iu })).toHaveCount(0);
  await expect(dialog.getByText(/Sl\. No\. is always included/u)).toBeVisible();
  const checkboxes = dialog.getByRole("checkbox");
  for (const checkbox of await checkboxes.all()) await checkbox.uncheck();
  const generate = dialog.getByRole("button", { name: "Generate PDF", exact: true });
  await expect(generate).toBeDisabled();
  await expect(dialog.getByRole("alert")).toContainText("Select at least one field");
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBeNull();
  await dialog.getByRole("checkbox", { name: "Expense name", exact: true }).check();
  await dialog.getByRole("checkbox", { name: "Tags", exact: true }).check();
  await generate.click();
  await expect(dialog).toHaveCount(0);
  const saved = await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY);
  expect(JSON.parse(saved!)).toEqual({ version: 1, fields: ["name", "tags"] });

  const reopened = await openExpenseOptions(page);
  await expect(reopened.getByRole("checkbox", { name: "Tags", exact: true })).toBeChecked();
  await expect(reopened.getByRole("checkbox", { name: "Amount", exact: true })).not.toBeChecked();
  await reopened.getByRole("checkbox", { name: "Amount", exact: true }).check();
  await reopened.getByRole("button", { name: "Cancel", exact: true }).click();
  expect(await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY)).toBe(saved);
  await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeFocused();

  await page.reload();
  const afterReload = await openExpenseOptions(page);
  await expect(afterReload.getByRole("checkbox", { name: "Tags", exact: true })).toBeChecked();
  await expect(
    afterReload.getByRole("checkbox", { name: "Amount", exact: true }),
  ).not.toBeChecked();
  await afterReload.getByRole("checkbox", { name: "Tags", exact: true }).uncheck();
  await afterReload.getByRole("checkbox", { name: "Amount", exact: true }).check();
  await afterReload.getByRole("button", { name: "Generate PDF", exact: true }).click();
  await expect(afterReload).toHaveCount(0);
  expect(
    JSON.parse((await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY))!),
  ).toEqual({
    version: 1,
    fields: ["name", "amount"],
  });
});

test("Escape discards draft fields and balances ignores saved expense choices", async ({
  page,
}) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: "export const downloadReportPdf = async () => {};",
    });
  });
  await page.goto("/groups/trip/expenses");
  await page.evaluate(
    (key) => localStorage.setItem(key, '{"version":1,"fields":["name"]}'),
    OPTIONS_KEY,
  );
  const dialog = await openExpenseOptions(page);
  await dialog.getByRole("checkbox", { name: "Tags", exact: true }).check();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  expect(
    JSON.parse((await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY))!).fields,
  ).toEqual(["name"]);
  await page.goto("/groups/trip/balances");
  await page.getByRole("button", { name: "Download PDF", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "Choose PDF fields" })).toHaveCount(0);
  expect(
    JSON.parse((await page.evaluate((key) => localStorage.getItem(key), OPTIONS_KEY))!).fields,
  ).toEqual(["name"]);
});

test("blocked localStorage does not prevent generation and explains unremembered choices", async ({
  page,
}) => {
  await page.route("**/src/features/reports/utils/download-pdf.ts*", async (route) => {
    await route.fulfill({
      contentType: "application/javascript",
      body: "export const downloadReportPdf = async () => {};",
    });
  });
  await page.goto("/groups/trip/expenses");
  await page.evaluate(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "split-slate-expense-pdf-options") throw new Error("Storage blocked");
      original.call(this, key, value);
    };
  });
  await generateExpensePdf(page);
  await expect(
    page.getByRole("status").filter({ hasText: "field choices could not be remembered" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Download PDF", exact: true })).toBeEnabled();
});
