import { describe, expect, it } from "vitest";

import { createExpenseFilterDefaults } from "@/features/expenses/utils/expense-filters";
import {
  createReportData,
  getPdfDownloadIssue,
  getPrintableReportFields,
  hasReportValue,
  PDF_REPORT_MESSAGES,
} from "@/features/reports/utils/report-data";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Expense } from "@/shared/types/domain.types";

const context = (): GroupDetailContext => ({
  group: {
    id: "trip",
    name: "Trip",
    icon: "",
    currency: "INR",
    createdAt: 1,
    frequentPayerIds: [],
  },
  groupMembers: ["Amy", "Bea", "Cal"].map((name, index) => ({
    id: String(index),
    groupId: "trip",
    personId: name,
    person: { id: name, name, icon: "" },
  })),
  groupCategories: ["Food", "Travel"].map((name) => ({
    id: name,
    groupId: "trip",
    name,
    icon: "",
    isActive: true,
  })),
  groupTags: [{ id: "cash", groupId: "trip", name: "Cash", color: "#008800" }],
  groupExpenses: [
    {
      expenseId: "dinner",
      groupId: "trip",
      expenseName: "Dinner",
      description: "Shared meal\nKeep the exact saved rounding.",
      createdBy: "0",
      categoryId: "Food",
      createdAt: 1,
      when: new Date(2026, 9, 1, 19).getTime(),
      splitType: "shares",
      splitMeta: [
        { memberId: "0", value: "1" },
        { memberId: "1", value: "2" },
      ],
      transactions: {
        paid: [{ memberId: "0", amount: 10001 }],
        owes: [
          { memberId: "0", amount: 3334 },
          { memberId: "1", amount: 6667 },
        ],
      },
      tagIds: ["cash"],
      attachmentIds: [],
    },
    {
      expenseId: "taxi",
      groupId: "trip",
      expenseName: "Taxi",
      createdBy: "1",
      categoryId: "Travel",
      createdAt: 2,
      when: new Date(2026, 9, 2, 10).getTime(),
      splitType: "amount",
      splitMeta: [],
      transactions: {
        paid: [{ memberId: "1", amount: 9000 }],
        owes: [{ memberId: "0", amount: 9000 }],
      },
      tagIds: [],
      attachmentIds: [],
    },
  ],
  groupSettlements: [
    {
      id: "payment",
      groupId: "trip",
      kind: "payment",
      fromMemberId: "1",
      toMemberId: "0",
      recordedBy: "0",
      amount: 500,
      when: 3,
      createdAt: 3,
      tagIds: ["cash"],
    },
  ],
});

describe("PDF report data", () => {
  it("uses all eight filters and keeps the entire saved split, not only selected members", () => {
    const report = createReportData({
      ...context(),
      kind: "expenses",
      filters: {
        ...createExpenseFilterDefaults(),
        name: " dinner ",
        dateFrom: "2026-10-01",
        dateTo: "2026-10-01",
        categoryIds: ["Food"],
        tagIds: ["cash"],
        payerIds: ["0"],
        memberIds: ["1"],
        splitTypes: ["shares"],
        minAmount: "100.01",
        maxAmount: "100.01",
      },
    });
    expect(report.sourceExpenseCount).toBe(2);
    expect(report.expenses.map((expense) => expense.id)).toEqual(["dinner"]);
    expect(report.total).toBe(10001n);
    expect(report.filters).toHaveLength(8);
    expect(report.filters.join("\n")).toContain("Paid by: Amy");
    expect(report.filters.join("\n")).toContain("Member involved: Bea");
    expect(report.expenses[0].allocations).toEqual([
      { memberId: "0", paid: 10001n, owed: 3334n, detail: "Shares: 1" },
      { memberId: "1", paid: null, owed: 6667n, detail: "Shares: 2" },
      { memberId: "2", paid: null, owed: null, detail: "" },
    ]);
    expect(report.payments).toEqual([]);
    expect(report.transfers).toEqual([]);
    expect(report.members.map((member) => member.net)).toEqual([6667, -6667, 0]);
  });

  it("preserves the selected sort and does not mutate source records", () => {
    const source = context();
    const original = structuredClone(source);
    const filters = { ...createExpenseFilterDefaults(), sort: "name-asc" as const };
    const report = createReportData({ ...source, kind: "expenses", filters });
    expect(report.expenses.map((expense) => expense.name)).toEqual(["Dinner", "Taxi"]);
    expect(report.sort).toBe("Name: A–Z");
    expect(report.expenses[0].description).toContain("\n");
    expect(report.expenses[0].tags).toBe("Cash");
    expect(report.expenses[0].date).toBe("01-Oct-2026");
    expect(report.expenses[0].paidBy).toBe("Amy");
    expect(report.expenses[0].addedDate).toBeTruthy();
    expect(source).toEqual(original);
    source.groupExpenses[0].expenseName = "Later edit";
    source.groupMembers[0].person!.name = "Later rename";
    expect(report.expenses[0].name).toBe("Dinner");
    expect(report.members[0].name).toBe("Amy");
  });

  it("includes multi-payer contributions and distinguishes saved zero from not applicable", () => {
    const source = context();
    source.groupExpenses = [source.groupExpenses[0]];
    source.groupExpenses[0].transactions = {
      paid: [
        { memberId: "0", amount: 5000 },
        { memberId: "1", amount: 5001 },
      ],
      owes: [
        { memberId: "0", amount: 0 },
        { memberId: "1", amount: 10001 },
      ],
    };
    const report = createReportData({
      ...source,
      kind: "expenses",
      filters: createExpenseFilterDefaults(),
    });
    expect(report.expenses[0].allocations[0]).toMatchObject({ paid: 5000n, owed: 0n });
    expect(report.expenses[0].allocations[1]).toMatchObject({ paid: 5001n, owed: 10001n });
    expect(report.expenses[0].allocations[2]).toMatchObject({ paid: null, owed: null });
    expect(report.expenses[0].paidBy).toBe("Amy: ₹50.00\nBea: ₹50.01");
  });

  it.each<Expense["splitType"]>(["equal", "amount", "shares", "percentage", "adjustment"])(
    "preserves stored owed amounts for %s instead of recomputing allocations",
    (splitType) => {
      const source = context();
      const expense = source.groupExpenses[0];
      expense.splitType = splitType;
      expense.splitMeta = [{ memberId: "0", value: splitType === "adjustment" ? -1 : "33.333333" }];
      const report = createReportData({
        ...source,
        kind: "expenses",
        filters: createExpenseFilterDefaults(),
      });
      const allocation = report.expenses.find((row) => row.id === "dinner")!.allocations[0];
      expect(allocation.owed).toBe(3334n);
      if (splitType === "percentage") expect(allocation.detail).toBe("Percentage: 33.333333%");
      if (splitType === "shares") expect(allocation.detail).toBe("Shares: 33.333333");
      if (splitType === "adjustment") expect(allocation.detail).toContain("0.01");
    },
  );

  it("reconciles full-group balances with recorded repayments and suggestions", () => {
    const report = createReportData({ ...context(), kind: "balances" });
    expect(report.total).toBe(19001n);
    expect(report.members.map((member) => member.net)).toEqual([-2833, 2833, 0]);
    expect(report.members[0].paymentsReceived).toBe(500n);
    expect(report.members[1].paymentsMade).toBe(500n);
    expect(report.payments[0]).toMatchObject({ from: "Bea", to: "Amy", amount: 500, tags: "Cash" });
    expect(report.transfers).toEqual([{ from: "Amy", to: "Bea", amount: 2833 }]);
    expect(report.expenses).toHaveLength(2);
  });

  it("keeps large cumulative repayments exact when offsetting payments keep nets safe", () => {
    const source = context();
    source.groupExpenses = [
      {
        ...source.groupExpenses[0],
        transactions: {
          paid: [{ memberId: "0", amount: 1 }],
          owes: [{ memberId: "0", amount: 1 }],
        },
      },
    ];
    const payment = source.groupSettlements[0];
    source.groupSettlements = [
      { ...payment, id: "first", amount: Number.MAX_SAFE_INTEGER },
      { ...payment, id: "second", amount: Number.MAX_SAFE_INTEGER },
      {
        ...payment,
        id: "offset",
        fromMemberId: "0",
        toMemberId: "1",
        amount: Number.MAX_SAFE_INTEGER,
      },
    ];
    const report = createReportData({ ...source, kind: "balances" });
    expect(report.members[1].paymentsMade).toBe(BigInt(Number.MAX_SAFE_INTEGER) * 2n);
    expect(report.members[1].net).toBe(Number.MAX_SAFE_INTEGER);
    expect(report.total).toBe(1n);
  });

  it("blocks no-match reports at availability and generation", () => {
    const request = {
      ...context(),
      kind: "expenses" as const,
      filters: { ...createExpenseFilterDefaults(), name: "Not present" },
    };
    expect(getPdfDownloadIssue(request)).toBe(PDF_REPORT_MESSAGES.NO_MATCHES);
    expect(() => createReportData(request)).toThrow(PDF_REPORT_MESSAGES.NO_MATCHES);
  });

  it.each(["expenses", "balances"] as const)(
    "blocks %s for groups without expenses, even with repayments",
    (kind) => {
      const request = {
        ...context(),
        groupExpenses: [],
        kind,
        filters: createExpenseFilterDefaults(),
      };
      expect(getPdfDownloadIssue(request)).toBe(PDF_REPORT_MESSAGES.NO_EXPENSES);
      expect(() => createReportData(request)).toThrow(PDF_REPORT_MESSAGES.NO_EXPENSES);
    },
  );

  it("rejects all-empty chosen fields without pruning the saved selection or order", () => {
    const request = {
      ...context(),
      kind: "expenses" as const,
      filters: { ...createExpenseFilterDefaults(), name: "Taxi" },
    };
    expect(getPdfDownloadIssue(request)).toBe("");
    expect(() => createReportData(request, 1, { fields: ["tags", "description"] })).toThrow(
      PDF_REPORT_MESSAGES.NO_FIELD_VALUES,
    );
    const fields = ["tags", "member-shares", "description", "name"] as const;
    const report = createReportData(request, 1, { fields: [...fields] });
    expect(report.fields).toEqual(fields);
    expect(getPrintableReportFields(report, report.fields!)).toEqual(["member-shares", "name"]);
    expect(report.fields).toEqual(fields);
  });

  it("retains zero values and member shares while ignoring whitespace and missing values", () => {
    expect([null, undefined, "", " \n\t "].map(hasReportValue)).toEqual([
      false,
      false,
      false,
      false,
    ]);
    expect([0, 0n, "0"].map(hasReportValue)).toEqual([true, true, true]);
    const report = createReportData({ ...context(), kind: "balances" });
    report.expenses.forEach((expense) => {
      expense.tags = " \n ";
      expense.allocations.forEach((allocation) => {
        allocation.owed = null;
      });
    });
    report.expenses[0].allocations[0].owed = 0n;
    expect(getPrintableReportFields(report, ["tags", "member-shares", "name"])).toEqual([
      "member-shares",
      "name",
    ]);
  });

  it("supports solo groups with no suggested payments", () => {
    const source = context();
    source.groupMembers = source.groupMembers.slice(0, 1);
    source.groupExpenses = [source.groupExpenses[0]];
    source.groupExpenses[0].transactions.owes = [{ memberId: "0", amount: 10001 }];
    source.groupSettlements = [];
    expect(createReportData({ ...source, kind: "balances" }).transfers).toEqual([]);
  });

  it("rejects invalid filters instead of generating a misleading empty PDF", () => {
    expect(() =>
      createReportData({
        ...context(),
        kind: "expenses",
        filters: { ...createExpenseFilterDefaults(), minAmount: "200", maxAmount: "100" },
      }),
    ).toThrow("Correct the highlighted filters");
  });

  it("carries chosen expense fields but never applies them to the fixed balance template", () => {
    const source = context();
    const expenses = createReportData(
      { ...source, kind: "expenses", filters: createExpenseFilterDefaults() },
      1,
      { fields: ["tags", "name"] },
    );
    expect(expenses.fields).toEqual(["tags", "name"]);
    expect(expenses.expenses).toHaveLength(2);
    expect(
      createReportData({ ...source, kind: "balances" }, 1, { fields: ["name"] }).fields,
    ).toBeUndefined();
    expect(() =>
      createReportData({ ...source, kind: "expenses", filters: createExpenseFilterDefaults() }, 1, {
        fields: [],
      }),
    ).toThrow();
  });

  it("rejects missing members, cross-group rows, invalid money, and mismatched totals", () => {
    const source = context();
    source.groupMembers = source.groupMembers.slice(1);
    expect(() => createReportData({ ...source, kind: "balances" })).toThrow("missing member");
    const foreign = context();
    foreign.groupExpenses[0].groupId = "another";
    expect(() => createReportData({ ...foreign, kind: "balances" })).toThrow("another group");
    const invalid = context();
    invalid.groupExpenses[0].transactions.paid[0].amount = 1.5;
    expect(() => createReportData({ ...invalid, kind: "balances" })).toThrow(
      "Invalid expense amount",
    );
    const mismatch = context();
    mismatch.groupExpenses[0].transactions.owes[0].amount -= 1;
    expect(() => createReportData({ ...mismatch, kind: "balances" })).toThrow(
      "totals do not match",
    );
  });
});
