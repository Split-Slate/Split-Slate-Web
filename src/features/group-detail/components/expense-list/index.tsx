import { Plus, ReceiptText, SearchX } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { Link, useLocation, useNavigate, useOutletContext } from "react-router-dom";

import ExpenseContextMenu from "@/features/expenses/components/expense-context-menu";
import ExpenseFilters from "@/features/expenses/components/expense-filters";
import ExpenseListItem from "@/features/expenses/components/expense-list-item";
import ExpenseSelectionToolbar from "@/features/expenses/components/expense-selection-toolbar";
import ExpenseInsights from "@/features/group-detail/components/expense-insights";
import PdfDownloadButton from "@/features/reports/components/pdf-download-button";
import SettlementEntry from "@/features/settlements/components/settlement-entry";

import {
  countActiveExpenseFilters,
  createExpenseFilterSchema,
  filterExpenses,
  sortExpenses,
} from "@/features/expenses/utils/expense-filters";
import { PDF_REPORT_MESSAGES } from "@/features/reports/utils/report-data";
import { useStore } from "@/shared/configs/store";
import { useViewport } from "@/shared/hooks/use-viewport";
import { formatCurrency } from "@/shared/utils/currency";

import type { ExpenseFilterValues } from "@/features/expenses/types/expense-filters.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Expense } from "@/shared/types/domain.types";

import ConfirmationDialog from "@/shared/ui/confirmation-dialog";
import EmptyState from "@/shared/ui/empty-state";
import Icon from "@/shared/ui/icon";
import Surface from "@/shared/ui/surface";

interface ExpenseMenuState {
  expenseId: string;
  x: number;
  y: number;
  trigger: HTMLElement | null;
}

const ExpenseList = () => {
  const { isMobile } = useViewport();
  const ledgerRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLElement>(null);
  const { search } = useLocation();
  const navigate = useNavigate();
  const removeExpenses = useStore((state) => state.removeExpenses);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [menu, setMenu] = useState<ExpenseMenuState | null>(null);
  const [deleteTargets, setDeleteTargets] = useState<Expense[]>([]);
  const context = useOutletContext<GroupDetailContext>();
  const { group, groupExpenses, groupSettlements, groupMembers, groupCategories, groupTags } =
    context;
  const actionScope = `${group.id}:${search}`;
  const [previousActionScope, setPreviousActionScope] = useState(actionScope);
  const { control } = useFormContext<ExpenseFilterValues>();
  const values = useWatch({ control });
  const parsed = createExpenseFilterSchema(group.currency).safeParse(values);
  const hasFilters = parsed.success && countActiveExpenseFilters(parsed.data) > 0;
  const sorted = parsed.success
    ? sortExpenses(
        filterExpenses(groupExpenses, parsed.data, group.currency),
        parsed.data.sort,
        groupCategories,
        groupTags,
      )
    : [];
  const selectedIdSet = new Set(selectedIds);
  const selectedExpenses = sorted.filter((expense) => selectedIdSet.has(expense.expenseId));
  const selecting = selectedExpenses.length > 0;
  const menuExpense = menu
    ? sorted.find((expense) => expense.expenseId === menu.expenseId)
    : undefined;
  const deleteTotal = deleteTargets.reduce(
    (sum, expense) =>
      expense.transactions.paid.reduce((subtotal, row) => subtotal + BigInt(row.amount), sum),
    0n,
  );
  const handleCloseMenu = useCallback(() => setMenu(null), []);
  const handleCancelSelection = useCallback(() => {
    setSelectedIds([]);
  }, []);

  // Reconcile local state before committing a new scope or a collection with deleted rows.
  // Selection mode is derived from live selections, so an empty selection cannot stay open.
  if (previousActionScope !== actionScope) {
    setPreviousActionScope(actionScope);
    setSelectedIds([]);
    setMenu(null);
  }
  const availableIds = new Set(groupExpenses.map((expense) => expense.expenseId));
  const availableSelectedIds = selectedIds.filter((id) => availableIds.has(id));
  if (availableSelectedIds.length !== selectedIds.length) setSelectedIds(availableSelectedIds);
  if (menu && !availableIds.has(menu.expenseId)) setMenu(null);

  useEffect(() => {
    if (!selecting || deleteTargets.length) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape" || event.defaultPrevented) return;
      if (document.querySelector("dialog[open]")) return;
      event.preventDefault();
      handleCancelSelection();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [selecting, deleteTargets.length, handleCancelSelection]);

  useEffect(() => {
    if (selecting) {
      ledgerRef.current
        ?.querySelector<HTMLInputElement>("[data-expense-id] input:checked")
        ?.focus({ preventScroll: true });
    }
  }, [selecting]);

  const handleOpenMenu = (expenseId: string, x: number, y: number, trigger: HTMLElement | null) =>
    setMenu({ expenseId, x, y, trigger });
  const handleSelectExpense = () => {
    if (!menuExpense) return;
    setSelectedIds([menuExpense.expenseId]);
    handleCloseMenu();
  };
  const handleToggleExpense = (expenseId: string) => {
    const current = selectedExpenses.map((expense) => expense.expenseId);
    const next = current.includes(expenseId)
      ? current.filter((id) => id !== expenseId)
      : [...current, expenseId];
    if (next.length === 0) {
      handleCancelSelection();
      return;
    }
    setSelectedIds(next);
  };
  const handleSelectAll = () => {
    if (selectedExpenses.length === sorted.length) {
      handleCancelSelection();
      return;
    }
    setSelectedIds(sorted.map((expense) => expense.expenseId));
  };
  const handleEditExpense = () => {
    const expense = menuExpense ?? (selectedExpenses.length === 1 ? selectedExpenses[0] : null);
    if (!expense) return;
    handleCloseMenu();
    navigate(`/groups/${group.id}/expenses/${expense.expenseId}/edit${search}`);
  };
  const handleRequestDelete = () => {
    setDeleteTargets(menuExpense ? [menuExpense] : selectedExpenses);
    handleCloseMenu();
  };
  const handleCancelDelete = () => setDeleteTargets([]);
  const handleConfirmDelete = async () => {
    await removeExpenses(
      deleteTargets.map((expense) => expense.expenseId),
      group.id,
    );
    setDeleteTargets([]);
    handleCancelSelection();
  };
  const pdfDisabledReason = !parsed.success
    ? PDF_REPORT_MESSAGES.INVALID_FILTERS
    : sorted.length
      ? ""
      : groupExpenses.length
        ? PDF_REPORT_MESSAGES.NO_MATCHES
        : PDF_REPORT_MESSAGES.NO_EXPENSES;
  const showPayments =
    parsed.success &&
    !hasFilters &&
    ["newest", "oldest", "added-newest", "added-oldest"].includes(parsed.data.sort);
  const sortByAddedDate =
    parsed.success && ["added-newest", "added-oldest"].includes(parsed.data.sort);
  const entries = [
    ...sorted.map((expense) => ({
      type: "expense" as const,
      when: expense.when,
      createdAt: expense.createdAt,
      expense,
    })),
    ...(showPayments
      ? groupSettlements.map((settlement) => ({
          type: "payment" as const,
          when: settlement.when,
          createdAt: settlement.createdAt,
          settlement,
        }))
      : []),
  ];
  if (showPayments) {
    const oldestFirst = ["oldest", "added-oldest"].includes(parsed.data.sort);
    entries.sort((a, b) => {
      const aDate = sortByAddedDate ? a.createdAt : a.when;
      const bDate = sortByAddedDate ? b.createdAt : b.when;
      return oldestFirst ? aDate - bDate : bDate - aDate;
    });
  }
  useLayoutEffect(() => {
    const ledger = ledgerRef.current;
    const title = titleRef.current;
    const filters = ledger?.querySelector<HTMLFormElement>('form[aria-label="Expense filters"]');
    const groupHeader = ledger
      ?.closest(".group-page")
      ?.querySelector<HTMLElement>(".group-page-header");
    if (!ledger || !title || !groupHeader) return;

    const updateOffsets = () => {
      ledger.style.setProperty("--expense-group-header-height", `${groupHeader.offsetHeight}px`);
      ledger.style.setProperty("--expense-title-height", `${title.offsetHeight}px`);
      ledger.style.setProperty("--expense-filters-height", `${filters?.offsetHeight ?? 0}px`);
    };
    const observer = new ResizeObserver(updateOffsets);
    observer.observe(groupHeader);
    observer.observe(title);
    if (filters) observer.observe(filters);
    updateOffsets();
    return () => {
      observer.disconnect();
      ledger.style.removeProperty("--expense-group-header-height");
      ledger.style.removeProperty("--expense-title-height");
      ledger.style.removeProperty("--expense-filters-height");
    };
  }, []);

  return (
    <section ref={ledgerRef} className="expense-ledger flex flex-col gap-4">
      <header ref={titleRef} className="flex items-center justify-between gap-3">
        <div>
          <h2 className="section-title">Expenses and payments</h2>
          <p className="soft-caption mt-1">
            Payments are green; they change balances, not spending totals.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-end">
          <PdfDownloadButton
            disabledReason={pdfDisabledReason}
            request={
              parsed.success ? { ...context, kind: "expenses", filters: parsed.data } : undefined
            }
          />
          {groupMembers.length > 1 && (
            <Link to={`/groups/${group.id}/balances?record=1`} className="btn btn-secondary">
              <Icon icon={Plus} size={18} /> Add payment
            </Link>
          )}
          <Link
            to={`/groups/${group.id}/expenses/new${search}`}
            className="btn btn-primary max-sm:!hidden"
          >
            <Icon icon={Plus} size={18} /> Add expense
          </Link>
        </div>
      </header>
      {parsed.success && (
        <ExpenseInsights
          expenses={sorted}
          group={group}
          members={groupMembers}
          categories={groupCategories}
          filtered={hasFilters}
        />
      )}
      <ExpenseFilters />
      {selecting && (
        <ExpenseSelectionToolbar
          count={selectedExpenses.length}
          matchingCount={sorted.length}
          onSelectAll={handleSelectAll}
          onEdit={handleEditExpense}
          onDelete={handleRequestDelete}
        />
      )}
      {parsed.success && !showPayments && groupSettlements.length > 0 && (
        <p className="soft-caption">
          Payments are hidden while expense filters or non-date sorting are active. Clear them to
          see payments in the timeline, or open Balances.
        </p>
      )}
      {(!isMobile || hasFilters || !parsed.success) && (
        <span role="status" className="soft-caption">
          {parsed.success
            ? `${sorted.length} of ${groupExpenses.length} expenses${showPayments ? ` · ${groupSettlements.length} payments` : ""}`
            : "Correct the highlighted filters to see results."}
        </span>
      )}
      {!parsed.success ? null : groupExpenses.length === 0 && entries.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No expenses yet"
          description="The slate is clean. Add the first expense and the math begins."
          action={
            <Link to={`/groups/${group.id}/expenses/new${search}`} className="btn btn-primary">
              <Icon icon={Plus} size={18} /> Add expense
            </Link>
          }
        />
      ) : entries.length === 0 ? (
        <EmptyState
          icon={SearchX}
          title="Nothing matches"
          description="No expenses match these filters. Loosen one, or start fresh."
        />
      ) : (
        <Surface className="expense-ledger-list p-5">
          <ul aria-label="Expenses">
            {entries.map((entry) => {
              if (entry.type === "payment")
                return (
                  <li key={entry.settlement.id}>
                    <SettlementEntry
                      settlement={entry.settlement}
                      members={groupMembers}
                      tags={groupTags}
                      currency={group.currency}
                      to={`/groups/${group.id}/balances`}
                    />
                  </li>
                );
              const expense = entry.expense;
              return (
                <ExpenseListItem
                  key={expense.expenseId}
                  expense={expense}
                  context={context}
                  search={search}
                  selecting={selecting}
                  selected={selecting && selectedIdSet.has(expense.expenseId)}
                  menuOpen={menu?.expenseId === expense.expenseId}
                  onToggle={handleToggleExpense}
                  onOpenMenu={handleOpenMenu}
                />
              );
            })}
          </ul>
        </Surface>
      )}
      {menu && menuExpense && (
        <ExpenseContextMenu
          expenseName={menuExpense.expenseName}
          x={menu.x}
          y={menu.y}
          returnFocus={menu.trigger}
          onClose={handleCloseMenu}
          onEdit={handleEditExpense}
          onSelect={handleSelectExpense}
          onDelete={handleRequestDelete}
        />
      )}
      <ConfirmationDialog
        open={deleteTargets.length > 0}
        title={
          deleteTargets.length === 1
            ? `Delete ${deleteTargets[0].expenseName}?`
            : `Delete ${deleteTargets.length} expenses?`
        }
        description={
          <>
            {deleteTargets.length === 1
              ? `“${deleteTargets[0].expenseName}”`
              : `${deleteTargets.length} selected expenses`}{" "}
            totaling {formatCurrency(deleteTotal, group.currency)} and their receipts will be
            permanently deleted. Group balances will be recalculated. Recorded payments will not be
            deleted. This cannot be undone.
          </>
        }
        confirmLabel="Delete permanently"
        onCancel={handleCancelDelete}
        onConfirm={handleConfirmDelete}
      />
    </section>
  );
};

export default ExpenseList;
