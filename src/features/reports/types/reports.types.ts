import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Group } from "@/shared/types/domain.types";

export type ReportRequest = GroupDetailContext &
  ({ kind: "expenses"; filters: ExpenseFilterValues } | { kind: "balances" });

export type ExpensePdfField =
  | "name"
  | "amount"
  | "paid-by"
  | "date"
  | "added-date"
  | "category"
  | "tags"
  | "description"
  | "split-method"
  | "member-shares";

export type ExpensePdfOptions = { fields: ExpensePdfField[] };

export interface ReportAllocation {
  memberId: string;
  paid: bigint | null;
  owed: bigint | null;
  detail: string;
}

export interface ReportExpense {
  id: string;
  name: string;
  description: string;
  date: string;
  addedDate: string;
  paidBy: string;
  category: string;
  tags: string;
  split: string;
  recordedBy: string;
  total: bigint;
  allocations: ReportAllocation[];
}

export interface ReportMember {
  id: string;
  name: string;
  paid: bigint;
  owed: bigint;
  paymentsMade: bigint;
  paymentsReceived: bigint;
  net: number;
}

export interface ReportPayment {
  date: string;
  from: string;
  to: string;
  amount: number;
  tags: string;
}

export interface ReportTransfer {
  from: string;
  to: string;
  amount: number;
}

export interface PdfReportData {
  kind: "expenses" | "balances";
  fields?: ExpensePdfField[];
  group: Group;
  generatedAt: string;
  filters: string[];
  sort: string;
  sourceExpenseCount: number;
  total: bigint;
  expenses: ReportExpense[];
  members: ReportMember[];
  payments: ReportPayment[];
  transfers: ReportTransfer[];
}
