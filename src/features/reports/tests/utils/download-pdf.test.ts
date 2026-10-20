import type { Content, ContentTable, TDocumentDefinitions } from "pdfmake/interfaces";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  createPdfDefinition,
  downloadReportPdf,
  generateReportPdf,
} from "@/features/reports/utils/download-pdf";
import { PDF_REPORT_MESSAGES } from "@/features/reports/utils/report-data";
import { EXPENSE_PDF_FIELD_OPTIONS } from "@/features/reports/utils/report-options";

import type { PdfReportData } from "@/features/reports/types/reports.types";

const report = (memberCount = 3, expenseCount = 1): PdfReportData => ({
  kind: "expenses",
  fields: ["name", "amount", "paid-by", "date", "member-shares"],
  group: {
    id: "trip",
    name: "Trip / 2026",
    icon: "",
    currency: "INR",
    createdAt: 1,
    frequentPayerIds: [],
  },
  generatedAt: "01-Oct-2026 · 07:00 PM",
  filters: ["Categories: Food"],
  sort: "Expense date: Newest first",
  sourceExpenseCount: expenseCount + 2,
  total: BigInt(expenseCount) * 10001n,
  members: Array.from({ length: memberCount }, (_, index) => ({
    id: String(index),
    name: `Member ${index + 1}`,
    paid: index === 0 ? BigInt(expenseCount) * 10001n : 0n,
    owed: index === 1 ? BigInt(expenseCount) * 10001n : 0n,
    paymentsMade: 0n,
    paymentsReceived: 0n,
    net: index === 0 ? expenseCount * 10001 : index === 1 ? -expenseCount * 10001 : 0,
  })),
  expenses: Array.from({ length: expenseCount }, (_, index) => ({
    id: String(index),
    name: `Dinner ${index + 1}`,
    description: "Saved description\nwith another line.",
    date: "01-Oct-2026",
    addedDate: "02-Oct-2026",
    paidBy: "Member 1",
    category: "Food",
    tags: "Cash",
    split: "Exact amounts",
    recordedBy: "Member 1",
    total: 10001n,
    allocations: Array.from({ length: memberCount }, (_, member) => ({
      memberId: String(member),
      paid: member === 0 ? 10001n : null,
      owed: member === 0 ? 0n : member === 1 ? 10001n : null,
      detail: "",
    })),
  })),
  payments: [],
  transfers: [],
});

const tables = (definition: TDocumentDefinitions): ContentTable[] =>
  (definition.content as Content[]).filter(
    (node): node is ContentTable => typeof node === "object" && node !== null && "table" in node,
  );

const headings = (node: ContentTable): string[] =>
  node.table.body[0].map((cell) => (cell as { text: string }).text);

const pageDimensions = (definition: TDocumentDefinitions) =>
  definition.pageSize as { width: number; height: number };

const referenceReport = (): PdfReportData => {
  const data = report(12, 8);
  const names = [
    "Rohan Shah",
    "Riya Gupta",
    "Vivaan Kapoor",
    "Neel Kulkarni",
    "Rahul R",
    "Diya Patel",
    "Siddharth Bose",
    "Priya Menon",
    "Ishita Nair",
    "Ananya Rao",
    "Meera Iyer",
    "Dev Malhotra",
  ];
  const entries = [
    ["Weekend homestay booking", 480000, 5, "14-Oct-2026", "Accommodation"],
    ["Parking near the beach", 10000, 0, "12-Oct-2026", "Parking"],
    ["Friday cinema tickets", 96000, 2, "11-Oct-2026", "Entertainment"],
    ["Train tickets to Jaipur", 240000, 0, "03-Oct-2026", "Travel"],
    ["Friday cinema tickets", 96000, 0, "02-Oct-2026", "Entertainment"],
    ["Train tickets to Jaipur", 240000, 2, "30-Sep-2026", "Travel"],
    ["Parking near the beach", 10000, 10, "29-Sep-2026", "Parking"],
    ["Train tickets to Jaipur", 240000, 0, "21-Sep-2026", "Travel"],
  ] as const;
  data.group.name = "Weekend Trip";
  data.fields = EXPENSE_PDF_FIELD_OPTIONS.map((option) => option.value);
  data.generatedAt = "21-Oct-2026 · 01:01 AM";
  data.sourceExpenseCount = 33;
  data.filters = ["Categories: Entertainment, Travel, Accommodation, Parking"];
  data.members = data.members.map((member, index) => ({ ...member, name: names[index] }));
  data.expenses = entries.map(([name, amount, payer, date, category], index) => ({
    ...data.expenses[index],
    name,
    date,
    category,
    addedDate: "21-Oct-2026",
    description: "",
    tags: "",
    split: "Equal",
    paidBy: names[payer],
    recordedBy: names[payer],
    total: BigInt(amount),
    allocations: data.members.map((member, memberIndex) => ({
      memberId: member.id,
      paid: memberIndex === payer ? BigInt(amount) : null,
      owed: BigInt(Math.floor(amount / 12) + (memberIndex < amount % 12 ? 1 : 0)),
      detail: "",
    })),
  }));
  data.total = data.expenses.reduce((sum, expense) => sum + expense.total, 0n);
  data.members = data.members.map((member, index) => {
    const paid = data.expenses.reduce(
      (sum, expense) => sum + (expense.allocations[index].paid ?? 0n),
      0n,
    );
    const owed = data.expenses.reduce((sum, expense) => sum + expense.allocations[index].owed!, 0n);
    return { ...member, paid, owed, net: Number(paid - owed) };
  });
  return data;
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("PDF layout and download", () => {
  it("renders every selected expense field and member share in one content-sized table", async () => {
    const definition = await createPdfDefinition(report());
    const text = JSON.stringify(definition);
    expect(text).toContain("Categories: Food");
    expect(text).toContain("Matching expenses only");
    expect(text).not.toContain("Saved description");
    expect(text).not.toContain("Recorded by:");
    expect(text).not.toContain("Member totals");
    expect(tables(definition)).toHaveLength(1);
    const splits = tables(definition)[0];
    expect(splits.table.headerRows).toBe(1);
    expect(splits.table.body[0].slice(0, 5)).toMatchObject([
      { text: "Sl. No." },
      { text: "Expense name" },
      { text: "Amount" },
      { text: "Paid by" },
      { text: "Date" },
    ]);
    expect(splits.table.body[1]).toEqual([
      "1",
      "Dinner 1",
      "₹100.01",
      "Member 1",
      "01-Oct-2026",
      "₹0.00",
      "₹100.01",
    ]);
    expect(headings(splits).slice(5)).toEqual(["Member 1 share", "Member 2 share"]);
    expect(definition.pageOrientation).toBe("landscape");
  });

  it("widens the page for all 25 members without horizontal bands or repeated rows", async () => {
    const data = report(25, 80);
    data.expenses.forEach((expense) => {
      expense.allocations.forEach((allocation, index) => {
        allocation.owed = index === 0 ? 401n : 400n;
      });
    });
    const definition = await createPdfDefinition(data);
    expect(tables(definition)).toHaveLength(1);
    const ledger = tables(definition)[0];
    expect(ledger.table.body).toHaveLength(81);
    expect(headings(ledger)).toContain("Expense name");
    const names = headings(ledger).slice(5);
    expect(names).toHaveLength(25);
    expect(names.at(-1)).toBe("Member 25 share");
    expect(ledger.table.body[1][0]).toBe("1");
    expect(ledger.table.body[80][0]).toBe("80");
    expect(pageDimensions(definition).width).toBeGreaterThan(1190.55);
    expect(pageDimensions(definition).height).toBe(595.28);
    expect(JSON.stringify(definition)).not.toContain("Same expense Sl. No.");
  });

  it("keeps the supplied 8-expense/12-member case in a single wide table", async () => {
    const data = referenceReport();
    const definition = await createPdfDefinition(data);
    const [details] = tables(definition);
    expect(tables(definition)).toHaveLength(1);
    expect(details.table.body).toHaveLength(9);
    expect(headings(details)).toEqual([
      "Sl. No.",
      "Expense name",
      "Amount",
      "Paid by",
      "Date",
      "Added date",
      "Category",
      "Split method",
      ...data.members.map((member) => `${member.name} share`),
    ]);
    expect(details.table.body[1].slice(8)).toEqual(data.members.map(() => "₹400.00"));
    expect(details.table.body[2].slice(8)).toEqual(
      data.members.map((_member, index) => (index < 4 ? "₹8.34" : "₹8.33")),
    );
    expect(details.table.body[1][6]).toBe("Accommodation");
    const widths = details.table.widths as number[];
    expect(widths[6]).toBeGreaterThan(60);
    expect(headings(details)).not.toContain("Tags");
    expect(headings(details)).not.toContain("Description");
    expect(definition.defaultStyle?.fontSize).toBeGreaterThanOrEqual(10);
    const tableWidth = widths.reduce((sum, width) => sum + width + 8, 0);
    expect(pageDimensions(definition).width).toBeGreaterThan(1190.55);
    expect(pageDimensions(definition).width).toBeCloseTo(tableWidth + 65, 1);
    expect(definition.pageOrientation).toBe("landscape");
    expect(
      (definition.content as Content[]).some(
        (node) => typeof node === "object" && node !== null && "pageBreak" in node,
      ),
    ).toBe(false);
    expect(JSON.stringify(definition)).toContain("₹14,120.00");
  });

  it("uses real proportional font widths and never stretches columns to fill the page", async () => {
    const data = report(3, 2);
    data.fields = ["name", "description"];
    data.expenses[0].name = "iiiiiiiiiiii";
    data.expenses[1].name = "WWWWWWWWWWWW";
    data.expenses.forEach((expense) => {
      expense.description = "Note";
    });
    const definition = await createPdfDefinition(data);
    const widths = tables(definition)[0].table.widths as number[];
    const [{ default: pdfMake }, { default: fonts }] = await Promise.all([
      import("pdfmake/build/pdfmake"),
      import("pdfmake/build/vfs_fonts"),
    ]);
    const metrics = pdfMake
      .createPdf(
        { content: [] },
        {},
        { Roboto: { normal: "Roboto-Regular.ttf", bold: "Roboto-Medium.ttf" } },
        fonts,
      )
      .getStream();
    try {
      metrics.fontSize(10.5);
      const titleWidth = metrics.font("Roboto-Medium.ttf").widthOfString("Expense name");
      const valueWidth = metrics.font("Roboto-Regular.ttf").widthOfString("WWWWWWWWWWWW");
      const headerWidth = metrics.font("Roboto-Medium.ttf").widthOfString("Description");
      expect(widths[1]).toBeCloseTo(Math.max(titleWidth, valueWidth) + 0.5, 5);
      expect(widths[2]).toBeCloseTo(headerWidth + 0.5, 5);
    } finally {
      metrics.destroy();
    }

    const wider = report(25, 2);
    wider.fields = ["name", "description", "member-shares"];
    wider.expenses.forEach((expense, index) => {
      expense.name = data.expenses[index].name;
      expense.description = "Note";
      expense.allocations.forEach((allocation) => {
        allocation.owed = 0n;
      });
    });
    const wideDefinition = await createPdfDefinition(wider);
    const wideWidths = tables(wideDefinition)[0].table.widths as number[];
    expect(pageDimensions(wideDefinition).width).toBeGreaterThan(pageDimensions(definition).width);
    expect(wideWidths.slice(0, 3)).toEqual(widths);

    data.expenses[1].name = "iiiiiiiiiiii";
    const narrower = await createPdfDefinition(data);
    expect((tables(narrower)[0].table.widths as number[])[1]).toBeLessThan(widths[1]);
  });

  it("does not cap or wrap non-description fields to squeeze them onto standard paper", async () => {
    const data = report(0, 1);
    data.fields = ["name", "tags", "description"];
    data.expenses[0].name = "W".repeat(80);
    data.expenses[0].tags = "x".repeat(100);
    data.expenses[0].description = "Short note";
    const definition = await createPdfDefinition(data);
    const ledger = tables(definition)[0];
    expect(ledger.table.body[1][1]).toBe(data.expenses[0].name);
    expect(ledger.table.body[1][2]).toBe(data.expenses[0].tags);
    expect((ledger.table.widths as number[])[1]).toBeGreaterThan(240);
    expect((ledger.table.widths as number[])[2]).toBeGreaterThan(240);
    expect((ledger.table.widths as number[])[3]).toBeLessThan(240);
  });

  it("rejects unsupported page dimensions instead of dropping columns or shrinking text", async () => {
    const data = report(0, 1);
    data.fields = ["name"];
    data.expenses[0].name = "W".repeat(2000);
    await expect(createPdfDefinition(data)).rejects.toThrow("supported PDF page width");
  });

  it("includes only serial numbers and shares when no expense-detail field is selected", async () => {
    const data = report();
    data.fields = ["member-shares"];
    const definition = await createPdfDefinition(data);
    expect(tables(definition)).toHaveLength(1);
    expect(headings(tables(definition)[0])).toEqual([
      "Sl. No.",
      "Member 1 share",
      "Member 2 share",
    ]);
    expect(JSON.stringify(definition)).not.toContain("Dinner 1");
    expect(JSON.stringify(definition)).not.toContain("Expense details");
  });

  it("caps only Description at 240 pt and wraps long tokens without truncation", async () => {
    const data = report(0, 1);
    const description = "a".repeat(1000);
    data.fields = ["name", "tags", "description"];
    data.expenses[0].description = description;
    data.expenses[0].tags = "Weekend, Entertainment, Shared accommodation";
    const definition = await createPdfDefinition(data);
    const detail = tables(definition)[0];
    expect(headings(detail)).toEqual(["Sl. No.", "Expense name", "Tags", "Description"]);
    expect(String(detail.table.body[1][3]).replaceAll("\u200B", "")).toBe(description);
    expect(String(detail.table.body[1][3])).toContain("\u200B");
    expect(detail.table.body[1][2]).toBe(data.expenses[0].tags);
    expect((detail.table.widths as number[])[3]).toBe(240);
    expect(definition.defaultStyle?.fontSize).toBeGreaterThanOrEqual(10);
  });

  it("prints only chosen expense columns, even when just one field is selected", async () => {
    const data = report();
    data.fields = ["name"];
    const definition = await createPdfDefinition(data);
    const main = tables(definition)[0];
    expect(main.table.body[0]).toMatchObject([{ text: "Sl. No." }, { text: "Expense name" }]);
    expect(main.table.body[1]).toEqual(["1", "Dinner 1"]);
    expect(JSON.stringify(definition)).not.toContain("₹100.01");
    expect(tables(definition)).toHaveLength(1);
  });

  it("includes optional descriptive columns only when requested and rejects no fields", async () => {
    const data = report();
    data.fields = ["added-date", "category", "tags", "description", "split-method"];
    const text = JSON.stringify(await createPdfDefinition(data));
    expect(text).toContain("02-Oct-2026");
    expect(text).toContain("Saved description\\nwith another line.");
    expect(text).toContain("Exact amounts");
    expect(text).toContain("Cash");
    data.fields = [];
    await expect(createPdfDefinition(data)).rejects.toThrow();
  });

  it("includes balances, suggested payments, and repayment history as separate sections", async () => {
    const data = report();
    data.kind = "balances";
    data.filters = [];
    data.fields = ["name"];
    data.transfers = [{ from: "Member 2", to: "Member 1", amount: 9501 }];
    data.payments = [
      { date: "Today", from: "Member 2", to: "Member 1", amount: 500, tags: "Cash" },
    ];
    const definition = await createPdfDefinition(data);
    const text = JSON.stringify(definition);
    expect(tables(definition)[0].table.body[0]).toMatchObject([
      { text: "Sl. No." },
      { text: "Date" },
      { text: "Expense name" },
      { text: "Amount" },
      { text: "Paid by" },
      { text: "Category" },
      { text: "Tags" },
      { text: "Member 1 share" },
      { text: "Member 2 share" },
    ]);
    expect(text).toContain("Scope: All group expenses and recorded repayments.");
    expect(text).toContain("Suggested payments");
    expect(text).toContain("Recorded repayments");
    expect(text).toContain("₹95.01");
    expect(text).toContain("₹5.00");
    expect(text).toContain("not payment records or original person-to-person debts");
  });

  it("blocks no-match and empty-group reports, including direct byte generation", async () => {
    const data = report(1, 0);
    await expect(createPdfDefinition(data)).rejects.toThrow(PDF_REPORT_MESSAGES.NO_MATCHES);
    data.sourceExpenseCount = 0;
    for (const kind of ["expenses", "balances"] as const) {
      data.kind = kind;
      await expect(generateReportPdf(data)).rejects.toThrow(PDF_REPORT_MESSAGES.NO_EXPENSES);
    }
  });

  it("places the member block at its selected position and omits blank columns without mutating choices", async () => {
    const data = report(3, 2);
    data.fields = ["tags", "member-shares", "description", "amount", "name"];
    data.expenses.forEach((expense) => {
      expense.tags = " \n\t ";
    });
    data.expenses[0].description = "";
    data.expenses[1].description = "Only this row has a note";
    const original = structuredClone(data);
    const ledger = tables(await createPdfDefinition(data))[0];
    expect(headings(ledger)).toEqual([
      "Sl. No.",
      "Member 1 share",
      "Member 2 share",
      "Description",
      "Amount",
      "Expense name",
    ]);
    expect(ledger.table.body[1]).toEqual(["1", "₹0.00", "₹100.01", "", "₹100.01", "Dinner 1"]);
    expect(ledger.table.body[2][3]).toBe("Only this row has a note");
    expect(data).toEqual(original);
  });

  it("allows member shares first or last, with group member order unchanged", async () => {
    const data = report();
    data.fields = ["member-shares", "name"];
    expect(headings(tables(await createPdfDefinition(data))[0])).toEqual([
      "Sl. No.",
      "Member 1 share",
      "Member 2 share",
      "Expense name",
    ]);
    data.fields = ["name", "member-shares"];
    expect(headings(tables(await createPdfDefinition(data))[0])).toEqual([
      "Sl. No.",
      "Expense name",
      "Member 1 share",
      "Member 2 share",
    ]);
  });

  it.each(["expenses", "balances"] as const)(
    "omits wholly blank %s columns but retains genuine zeros",
    async (kind) => {
      const data = report();
      data.kind = kind;
      data.fields = ["tags", "amount", "member-shares", "description"];
      data.expenses[0].tags = "";
      data.expenses[0].description = " \n ";
      data.expenses[0].total = 0n;
      data.payments = [{ date: "Today", from: "Member 2", to: "Member 1", amount: 0, tags: " " }];
      const nodes = tables(await createPdfDefinition(data));
      const names = headings(nodes[0]);
      expect(names).not.toContain("Tags");
      expect(names).not.toContain("Description");
      expect(names).not.toContain("Member 3 share");
      expect(names).toContain("Member 1 share");
      expect(nodes[0].table.body[1][names.indexOf("Amount")]).toBe("₹0.00");
      if (kind === "balances") {
        expect(names).toEqual([
          "Sl. No.",
          "Date",
          "Expense name",
          "Amount",
          "Paid by",
          "Category",
          "Member 1 share",
          "Member 2 share",
        ]);
        expect(headings(nodes[2])).toEqual(["Sl. No.", "Date", "From", "To", "Amount"]);
        expect(nodes[2].table.body[1].at(-1)).toBe("₹0.00");
      }
    },
  );

  it("rejects all-empty selected fields and never initiates a Sl. No.-only download", async () => {
    const data = report();
    data.fields = ["tags", "description", "member-shares"];
    data.expenses.forEach((expense) => {
      expense.tags = " \n ";
      expense.description = "";
      expense.allocations.forEach((allocation) => {
        allocation.owed = null;
      });
    });
    const createUrl = vi.spyOn(URL, "createObjectURL");
    await expect(createPdfDefinition(data)).rejects.toThrow(PDF_REPORT_MESSAGES.NO_FIELD_VALUES);
    await expect(downloadReportPdf(data)).rejects.toThrow(PDF_REPORT_MESSAGES.NO_FIELD_VALUES);
    expect(createUrl).not.toHaveBeenCalled();
  });

  it("renders the supplied-size case as one custom-wide PDF page with embedded fonts", async () => {
    const blob = await generateReportPdf(referenceReport());
    const text = new TextDecoder("latin1").decode(await blob.arrayBuffer());
    expect(text.match(/\/Type \/Page\b/gu)).toHaveLength(1);
    const mediaBox = /\/MediaBox\s*\[0 0 ([\d.]+) ([\d.]+)\]/u.exec(text);
    expect(mediaBox).not.toBeNull();
    expect(Number(mediaBox![1])).toBeGreaterThan(Number(mediaBox![2]));
    expect(Number(mediaBox![1])).toBeGreaterThan(1190.55);
    expect(Number(mediaBox![2])).toBeCloseTo(595.28, 2);
    expect(text).toContain("/FontFile2");
  }, 20000);

  it("generates actual multi-page PDF bytes with embedded local fonts", async () => {
    const blob = await generateReportPdf(report(5, 30));
    expect(blob.type).toBe("application/pdf");
    const bytes = new Uint8Array(await blob.arrayBuffer());
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text.startsWith("%PDF-")).toBe(true);
    expect(text).toContain("%%EOF");
    expect(text.match(/\/Type \/Page\b/gu)!.length).toBeGreaterThan(1);
    expect(text).toContain("/FontFile2");
  }, 20000);

  it("downloads a named PDF without opening a window or print dialog and revokes its URL", async () => {
    vi.useFakeTimers();
    const click = vi.fn();
    const remove = vi.fn();
    const anchor = { href: "", download: "", click, remove };
    const createElement = vi.fn(() => anchor);
    const append = vi.fn();
    const print = vi.fn();
    const open = vi.fn();
    vi.stubGlobal("document", { createElement, body: { append } });
    vi.stubGlobal("window", { setTimeout, print, open });
    const createUrl = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:report");
    const revoke = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => {});
    await downloadReportPdf(report());
    expect(createUrl).toHaveBeenCalledWith(expect.any(Blob));
    expect(anchor.download).toBe("trip-2026-expenses.pdf");
    expect(click).toHaveBeenCalledOnce();
    expect(remove).toHaveBeenCalledOnce();
    expect(print).not.toHaveBeenCalled();
    expect(open).not.toHaveBeenCalled();
    expect(revoke).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60000);
    expect(revoke).toHaveBeenCalledWith("blob:report");
  }, 20000);
});
