import {
  createExpenseFilterSchema,
  EXPENSE_SORT_SECTIONS,
  filterExpenses,
  sortExpenses,
} from "@/features/expenses/utils/expense-filters";
import {
  defaultExpensePdfOptions,
  expensePdfOptionsSchema,
} from "@/features/reports/utils/report-options";
import { calculateBalances, calculateGroupTotal, suggestTransfers } from "@/shared/utils/balances";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDate, formatDisplayDateTime } from "@/shared/utils/date-time";
import { parseMoney } from "@/shared/utils/money";

import type {
  ExpensePdfField,
  ExpensePdfOptions,
  PdfReportData,
  ReportAllocation,
  ReportExpense,
  ReportRequest,
} from "@/features/reports/types/reports.types";
import type { Expense, Transaction } from "@/shared/types/domain.types";

const SPLIT_LABELS: Record<Expense["splitType"], string> = {
  equal: "Equal",
  amount: "Exact amounts",
  shares: "Shares",
  percentage: "Percentages",
  adjustment: "Adjustments",
};

export const PDF_REPORT_MESSAGES = {
  NO_EXPENSES: "Add an expense before downloading a PDF.",
  NO_MATCHES: "No expenses match the current filters.",
  INVALID_FILTERS: "Correct the highlighted filters before downloading a PDF.",
  NO_FIELD_VALUES: "The selected fields have no values in these expenses. Choose another field.",
} as const;

export const hasReportValue = (value: unknown): boolean =>
  value !== null && value !== undefined && (typeof value !== "string" || value.trim().length > 0);

export const getPdfDownloadIssue = (request?: ReportRequest): string => {
  if (!request) return PDF_REPORT_MESSAGES.INVALID_FILTERS;
  if (!request.groupExpenses.length) return PDF_REPORT_MESSAGES.NO_EXPENSES;
  if (request.kind === "expenses") {
    const parsed = createExpenseFilterSchema(request.group.currency).safeParse(request.filters);
    if (!parsed.success) return PDF_REPORT_MESSAGES.INVALID_FILTERS;
    if (!filterExpenses(request.groupExpenses, parsed.data, request.group.currency).length) {
      return PDF_REPORT_MESSAGES.NO_MATCHES;
    }
  }
  return "";
};

export const getReportFieldValue = (
  expense: ReportExpense,
  field: Exclude<ExpensePdfField, "member-shares">,
  currency: string,
): string => {
  switch (field) {
    case "name":
      return expense.name;
    case "amount":
      return formatCurrency(expense.total, currency);
    case "paid-by":
      return expense.paidBy;
    case "date":
      return expense.date;
    case "added-date":
      return expense.addedDate;
    case "category":
      return expense.category;
    case "tags":
      return expense.tags;
    case "description":
      return expense.description;
    case "split-method":
      return expense.split;
  }
};

export const getPrintableReportFields = (
  report: PdfReportData,
  fields: readonly ExpensePdfField[],
): ExpensePdfField[] =>
  fields.filter((field) =>
    report.expenses.some((expense) =>
      field === "member-shares"
        ? expense.allocations.some(
            (allocation) =>
              report.members.some((member) => member.id === allocation.memberId) &&
              hasReportValue(allocation.owed),
          )
        : hasReportValue(getReportFieldValue(expense, field, report.group.currency)),
    ),
  );

const allocationAmount = (rows: Transaction[], memberId: string): bigint | null => {
  const matching = rows.filter((row) => row.memberId === memberId);
  return matching.length ? matching.reduce((sum, row) => sum + BigInt(row.amount), 0n) : null;
};

export const createReportData = (
  request: ReportRequest,
  now = Date.now(),
  options: ExpensePdfOptions = defaultExpensePdfOptions(),
): PdfReportData => {
  const fields =
    request.kind === "expenses" ? expensePdfOptionsSchema.parse(options).fields : undefined;
  const { group, groupMembers, groupCategories, groupTags, groupExpenses, groupSettlements } =
    request;
  const memberIds = groupMembers.map((member) => member.id);
  if (new Set(memberIds).size !== memberIds.length) {
    throw new Error("Cannot export duplicate group members.");
  }
  const names = new Map(
    groupMembers.map((member) => [member.id, member.person?.name ?? "Unknown person"]),
  );
  const memberName = (id: string): string => {
    const name = names.get(id);
    if (name === undefined) {
      throw new Error("Cannot export an expense or payment with a missing member.");
    }
    return name;
  };
  const categoryName = (id: string) =>
    groupCategories.find((category) => category.id === id)?.name ?? "Unknown category";
  const tagName = (id: string) => groupTags.find((tag) => tag.id === id)?.name ?? "Unknown tag";
  const money = (amount: number | bigint) => formatCurrency(amount, group.currency);
  const filters: string[] = [];
  let sort = "Expense date: Newest first";
  let expenses: Expense[];

  if (request.kind === "expenses") {
    const parsed = createExpenseFilterSchema(group.currency).safeParse(request.filters);
    if (!parsed.success)
      throw new Error("Correct the highlighted filters before downloading a PDF.");
    const values = parsed.data;
    expenses = sortExpenses(
      filterExpenses(groupExpenses, values, group.currency),
      values.sort,
      groupCategories,
      groupTags,
    );
    for (const section of EXPENSE_SORT_SECTIONS) {
      const option = section.options.find((item) => item.value === values.sort);
      if (option) sort = `${section.label}: ${option.label}`;
    }
    if (values.name.trim()) filters.push(`Expense name: ${values.name.trim()}`);
    if (values.dateFrom || values.dateTo) {
      filters.push(
        `Expense dates: ${values.dateFrom || "Any start"} to ${values.dateTo || "Any end"}`,
      );
    }
    if (values.categoryIds.length) {
      filters.push(`Categories: ${values.categoryIds.map(categoryName).join(", ")}`);
    }
    if (values.tagIds.length) filters.push(`Tags: ${values.tagIds.map(tagName).join(", ")}`);
    if (values.payerIds.length)
      filters.push(`Paid by: ${values.payerIds.map(memberName).join(", ")}`);
    if (values.memberIds.length) {
      filters.push(`Member involved: ${values.memberIds.map(memberName).join(", ")}`);
    }
    if (values.splitTypes.length) {
      filters.push(
        `Split methods: ${values.splitTypes.map((type) => SPLIT_LABELS[type]).join(", ")}`,
      );
    }
    if (values.minAmount.trim() || values.maxAmount.trim()) {
      const minimum = values.minAmount.trim()
        ? money(parseMoney(values.minAmount, group.currency))
        : "Any minimum";
      const maximum = values.maxAmount.trim()
        ? money(parseMoney(values.maxAmount, group.currency))
        : "Any maximum";
      filters.push(`Expense amounts: ${minimum} to ${maximum}`);
    }
  } else {
    expenses = sortExpenses(groupExpenses, "newest", groupCategories, groupTags);
  }

  if (!expenses.length) {
    throw new Error(
      groupExpenses.length ? PDF_REPORT_MESSAGES.NO_MATCHES : PDF_REPORT_MESSAGES.NO_EXPENSES,
    );
  }

  const payments = request.kind === "balances" ? groupSettlements : [];
  if (
    groupMembers.some((member) => member.groupId !== group.id) ||
    expenses.some((expense) => expense.groupId !== group.id) ||
    payments.some((payment) => payment.groupId !== group.id)
  ) {
    throw new Error("Cannot include records from another group in this PDF.");
  }
  const balances = calculateBalances(expenses, memberIds, payments);
  const total = BigInt(calculateGroupTotal(expenses));
  const paid = new Map(memberIds.map((id) => [id, 0n]));
  const owed = new Map(memberIds.map((id) => [id, 0n]));
  const paymentsMade = new Map(memberIds.map((id) => [id, 0n]));
  const paymentsReceived = new Map(memberIds.map((id) => [id, 0n]));

  const reportExpenses = expenses.map((expense) => {
    const expenseTotal = expense.transactions.paid.reduce(
      (sum, row) => sum + BigInt(row.amount),
      0n,
    );
    const owedTotal = expense.transactions.owes.reduce((sum, row) => sum + BigInt(row.amount), 0n);
    if (expenseTotal <= 0n || expenseTotal !== owedTotal) {
      throw new Error("Cannot export an expense whose paid and owed totals do not match.");
    }
    const allocations: ReportAllocation[] = groupMembers.map((member) => {
      const memberPaid = allocationAmount(expense.transactions.paid, member.id);
      const memberOwed = allocationAmount(expense.transactions.owes, member.id);
      paid.set(member.id, paid.get(member.id)! + (memberPaid ?? 0n));
      owed.set(member.id, owed.get(member.id)! + (memberOwed ?? 0n));
      const meta = expense.splitMeta.find((row) => row.memberId === member.id);
      let detail = "";
      if (memberOwed !== null && meta) {
        if (expense.splitType === "shares") detail = `Shares: ${meta.value}`;
        if (expense.splitType === "percentage") detail = `Percentage: ${meta.value}%`;
        if (expense.splitType === "adjustment") {
          const adjustment = Number(meta.value);
          if (!Number.isSafeInteger(adjustment)) throw new Error("Invalid saved split adjustment.");
          detail = `Adjustment: ${money(adjustment)}`;
        }
      }
      return { memberId: member.id, paid: memberPaid, owed: memberOwed, detail };
    });
    return {
      id: expense.expenseId,
      name: expense.expenseName,
      description: expense.description ?? "",
      date: formatDisplayDate(expense.when),
      addedDate: formatDisplayDate(expense.createdAt),
      paidBy: allocations
        .filter((allocation) => allocation.paid !== null)
        .map((allocation) => {
          const name = memberName(allocation.memberId);
          return expense.transactions.paid.length > 1
            ? `${name}: ${money(allocation.paid!)}`
            : name;
        })
        .join("\n"),
      category: categoryName(expense.categoryId),
      tags: expense.tagIds.map(tagName).join(", "),
      split: SPLIT_LABELS[expense.splitType],
      recordedBy: memberName(expense.createdBy),
      total: expenseTotal,
      allocations,
    };
  });

  for (const payment of payments) {
    paymentsMade.set(
      payment.fromMemberId,
      paymentsMade.get(payment.fromMemberId)! + BigInt(payment.amount),
    );
    paymentsReceived.set(
      payment.toMemberId,
      paymentsReceived.get(payment.toMemberId)! + BigInt(payment.amount),
    );
  }
  const report: PdfReportData = {
    kind: request.kind,
    fields,
    group: { ...group },
    generatedAt: formatDisplayDateTime(now),
    filters,
    sort,
    sourceExpenseCount: groupExpenses.length,
    total,
    expenses: reportExpenses,
    members: groupMembers.map((member) => ({
      id: member.id,
      name: memberName(member.id),
      paid: paid.get(member.id)!,
      owed: owed.get(member.id)!,
      paymentsMade: paymentsMade.get(member.id)!,
      paymentsReceived: paymentsReceived.get(member.id)!,
      net: balances.get(member.id)!,
    })),
    payments: [...payments]
      .sort((a, b) => b.when - a.when || a.id.localeCompare(b.id))
      .map((payment) => ({
        date: formatDisplayDateTime(payment.when),
        from: memberName(payment.fromMemberId),
        to: memberName(payment.toMemberId),
        amount: payment.amount,
        tags: payment.tagIds.map(tagName).join(", "),
      })),
    transfers:
      request.kind === "balances"
        ? suggestTransfers(balances).map((transfer) => ({
            from: memberName(transfer.fromMemberId),
            to: memberName(transfer.toMemberId),
            amount: transfer.amount,
          }))
        : [],
  };
  if (fields && !getPrintableReportFields(report, fields).length) {
    throw new Error(PDF_REPORT_MESSAGES.NO_FIELD_VALUES);
  }
  return report;
};
