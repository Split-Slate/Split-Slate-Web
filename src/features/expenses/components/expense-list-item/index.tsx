import { EllipsisVertical } from "lucide-react";
import type { MouseEvent } from "react";
import { useRef } from "react";
import { Link } from "react-router-dom";

import ExpenseTags from "@/features/group-detail/components/expense-tags";

import { useExpenseLongPress } from "@/features/expenses/hooks/use-expense-long-press";
import { formatCurrency } from "@/shared/utils/currency";
import { formatDisplayDateTime } from "@/shared/utils/date-time";

import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";
import type { Expense } from "@/shared/types/domain.types";

import Avatar from "@/shared/ui/avatar";
import Icon from "@/shared/ui/icon";

interface PropsType {
  expense: Expense;
  context: GroupDetailContext;
  search: string;
  selecting: boolean;
  selected: boolean;
  menuOpen: boolean;
  onToggle: (expenseId: string) => void;
  onOpenMenu: (expenseId: string, x: number, y: number, trigger: HTMLElement | null) => void;
}

const ExpenseListItem = ({
  expense,
  context,
  search,
  selecting,
  selected,
  menuOpen,
  onToggle,
  onOpenMenu,
}: PropsType) => {
  const actionsRef = useRef<HTMLButtonElement>(null);
  const { group, groupCategories, groupMembers, groupTags } = context;
  const category = groupCategories.find((item) => item.id === expense.categoryId);
  const payers = expense.transactions.paid.map(
    (payer) =>
      groupMembers.find((member) => member.id === payer.memberId)?.person?.name ?? "Unknown person",
  );
  const total = expense.transactions.paid.reduce((sum, item) => sum + item.amount, 0);
  const openMenu = (x: number, y: number) => {
    if (!selecting) onOpenMenu(expense.expenseId, x, y, actionsRef.current);
  };
  const {
    handlePointerDown,
    handlePointerMove,
    handlePointerLeave,
    handleContextMenu,
    shouldSuppressClick,
  } = useExpenseLongPress(openMenu);

  const handleClickCapture = (event: MouseEvent<HTMLLIElement>) => {
    if (shouldSuppressClick()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!selecting || (event.target as Element).closest("input, button")) return;
    event.preventDefault();
    event.stopPropagation();
    onToggle(expense.expenseId);
  };
  const handleToggle = () => onToggle(expense.expenseId);
  const handleOpenActions = (event: MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    openMenu(rect.right - 224, rect.bottom);
  };

  return (
    <li
      data-expense-id={expense.expenseId}
      data-selecting={selecting}
      data-selected={selected}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onContextMenu={handleContextMenu}
      onClickCapture={handleClickCapture}
      className="expense-list-item select-none [-webkit-touch-callout:none] border-b border-[var(--line)] last:border-b-0"
    >
      <div className="expense-list-item-body flex min-w-0 items-center gap-2">
        <Link
          to={`/groups/${group.id}/expenses/${expense.expenseId}${search}`}
          tabIndex={selecting ? -1 : undefined}
          className="expense-entry-link flex min-w-0 flex-1 items-center gap-3 py-3"
        >
          <Avatar icon={category?.icon} square className="!w-10 !h-10 !text-xl" />
          <span className="expense-entry-copy min-w-0 flex-1">
            <span className="expense-entry-title block truncate font-bold">
              {expense.expenseName}
            </span>
            <span className="expense-entry-meta soft-caption block truncate">
              <span className="expense-entry-category md:hidden">
                {category?.name ?? "Category"} ·{" "}
              </span>
              {payers.join(", ")} paid · {expense.splitType}
            </span>
          </span>
          <span className="expense-entry-amount expense-ledger-amount text-right">
            <span className="money block font-bold">{formatCurrency(total, group.currency)}</span>
            <span className="expense-entry-timestamp soft-caption block whitespace-nowrap">
              {formatDisplayDateTime(expense.when)}
            </span>
          </span>
        </Link>
        <div className="expense-list-actions">
          {selecting ? (
            <label className="expense-list-checkbox">
              <input
                type="checkbox"
                aria-label={`Select ${expense.expenseName}`}
                checked={selected}
                onChange={handleToggle}
                className="choice-control"
              />
            </label>
          ) : (
            <button
              ref={actionsRef}
              type="button"
              aria-label={`Actions for ${expense.expenseName}`}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              onClick={handleOpenActions}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[var(--muted)] hover:bg-[var(--surface-soft)] focus-visible:outline-2 focus-visible:outline-[var(--brand)]"
            >
              <Icon icon={EllipsisVertical} size={18} />
            </button>
          )}
        </div>
      </div>
      <ExpenseTags
        tagIds={expense.tagIds}
        tags={groupTags}
        expenseName={expense.expenseName}
        className="mb-3 pl-[52px]"
      />
    </li>
  );
};

export default ExpenseListItem;
