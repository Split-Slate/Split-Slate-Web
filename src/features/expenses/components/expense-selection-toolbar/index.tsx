import { Pencil, Trash2 } from "lucide-react";
import { useLayoutEffect, useRef } from "react";

import Icon from "@/shared/ui/icon";

interface PropsType {
  count: number;
  matchingCount: number;
  onSelectAll: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const ExpenseSelectionToolbar = ({
  count,
  matchingCount,
  onSelectAll,
  onEdit,
  onDelete,
}: PropsType) => {
  const allCheckboxRef = useRef<HTMLInputElement>(null);
  const allSelected = matchingCount > 0 && count === matchingCount;
  const partiallySelected = count > 0 && count < matchingCount;

  useLayoutEffect(() => {
    if (allCheckboxRef.current) allCheckboxRef.current.indeterminate = partiallySelected;
  }, [partiallySelected]);

  return (
    <section aria-label="Expense selection" className="surface expense-selection-toolbar">
      <div className="expense-selection-main">
        <label className="expense-selection-all">
          <input
            ref={allCheckboxRef}
            type="checkbox"
            checked={allSelected}
            aria-checked={partiallySelected ? "mixed" : allSelected}
            onChange={onSelectAll}
            disabled={!matchingCount}
            className="choice-control"
          />
          <span>All</span>
        </label>
        <div className="expense-selection-actions">
          <button
            type="button"
            onClick={onEdit}
            aria-label="Edit"
            title="Edit selected expense"
            disabled={count !== 1}
            className="btn btn-secondary"
          >
            <Icon icon={Pencil} size={18} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label="Delete"
            title="Delete selected expenses"
            disabled={!count}
            className="btn btn-danger"
          >
            <Icon icon={Trash2} size={18} />
          </button>
        </div>
      </div>
      <span role="status" className="expense-selection-count">
        {count} selected
      </span>
    </section>
  );
};

export default ExpenseSelectionToolbar;
