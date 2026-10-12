import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ChevronDown, Plus } from "lucide-react";
import type { FormEvent } from "react";
import { useRef, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { Link, useLocation, useNavigate, useOutletContext, useParams } from "react-router-dom";

import CategoryCreator from "@/features/expenses/components/category-creator";
import PayerSelector from "@/features/expenses/components/payer-selector";
import SplitEditor from "@/features/expenses/components/split-editor";
import TagCreator from "@/features/expenses/components/tag-creator";
import Input from "@/shared/components/form-elements/input";

import {
  expenseFormMembers,
  expenseFormValues,
  localDateTime,
} from "@/features/expenses/utils/expense-form-values";
import { createExpenseSchema } from "@/features/expenses/utils/expense-schema";
import { defaultPayer, rankPayers } from "@/features/expenses/utils/paid-by";
import { useStore } from "@/shared/configs/store";

import type { ExpenseFormValues } from "@/features/expenses/types/expenses.types";
import type { GroupDetailContext } from "@/features/group-detail/types/group-detail.types";

import EmojiImage from "@/shared/ui/emoji-image";
import Icon from "@/shared/ui/icon";
import MoneyInput from "@/shared/ui/money-input";
import Textarea from "@/shared/ui/textarea";
import WhenPicker from "@/shared/ui/when-picker";

const ExpenseForm = () => {
  const { group, groupMembers, groupCategories, groupTags, groupExpenses } =
    useOutletContext<GroupDetailContext>();
  const { localUser, addCategory, addTag, addExpense, updateExpense } = useStore();
  const { expenseId } = useParams();
  const expense = groupExpenses.find((item) => item.expenseId === expenseId);
  const [openedAt] = useState(Date.now);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const navigate = useNavigate();
  const { search } = useLocation();
  const saving = useRef(false);
  const members = expenseFormMembers(
    groupMembers
      .filter((member) => member.person)
      .map((member) => ({ id: member.id, name: member.person!.name, icon: member.person!.icon })),
    expense,
  );
  const creatorId = groupMembers.find((member) => member.personId === localUser?.id)?.id ?? "";
  const categories = groupCategories.filter(
    (category) => category.isActive || category.id === expense?.categoryId,
  );
  const initialValues: ExpenseFormValues = expense
    ? expenseFormValues(expense, members, group.currency)
    : {
        expenseName: "",
        description: "",
        amount: "",
        when: localDateTime(openedAt),
        categoryId: categories[0]?.id ?? "",
        tagIds: [],
        payerMode: "single",
        payerId: defaultPayer(members, groupExpenses, creatorId),
        payers: members.map((member) => ({ memberId: member.id, selected: false, amount: "" })),
        splitType: "equal",
        participants: members.map((member) => ({ memberId: member.id, selected: true, value: "" })),
      };
  const methods = useForm<ExpenseFormValues>({
    resolver: zodResolver(createExpenseSchema(group.currency)),
    defaultValues: initialValues,
  });
  const payerMembers = initialValues.payers.flatMap((payer) =>
    members.filter((member) => member.id === payer.memberId),
  );
  const cancelPath = expense
    ? `/groups/${group.id}/expenses/${expense.expenseId}${search}`
    : `/groups/${group.id}/expenses${search}`;
  const quickIds = groupExpenses.length
    ? group.frequentPayerIds
    : [...new Set([creatorId, ...rankPayers(members, [])])].filter(Boolean).slice(0, 5);
  const handleAddCategory = async (name: string, icon: string) => {
    const category = await addCategory(group.id, name, icon);
    methods.setValue("categoryId", category.id, { shouldDirty: true, shouldValidate: true });
    setIsCreatingCategory(false);
  };
  const handleAddTag = async (name: string, color: string) => {
    const tag = await addTag(group.id, name, color);
    methods.setValue("tagIds", [...methods.getValues("tagIds"), tag.id], {
      shouldDirty: true,
      shouldValidate: true,
    });
    setIsCreatingTag(false);
  };
  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    try {
      await methods.handleSubmit(async (values) => {
        try {
          const input = { groupId: group.id, currency: group.currency, values };
          if (expenseId) {
            await updateExpense(expenseId, input);
            navigate(`/groups/${group.id}/expenses/${expenseId}${search}`);
          } else {
            await addExpense(input);
            navigate(`/groups/${group.id}/expenses${search}`);
          }
        } catch (error) {
          methods.setError("root", {
            message:
              error instanceof Error ? error.message : "Could not save expense. Please try again.",
          });
        }
      })(event);
    } finally {
      saving.current = false;
    }
  };
  const errors = methods.formState.errors;
  const validationMessage = errors.participants?.root?.message ?? errors.participants?.message;

  if (expenseId && !expense)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">Expense not found</h2>
        <p>This expense is not available in this group.</p>
        <Link to={`/groups/${group.id}/expenses${search}`} className="btn btn-secondary self-start">
          <Icon icon={ArrowLeft} size={18} /> Back to expenses
        </Link>
      </section>
    );

  if (!creatorId || !members.length)
    return (
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold">{expense ? "Edit expense" : "Add expense"}</h2>
        <p role="alert">You need to be a member of this group before you can record an expense.</p>
      </section>
    );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSave} noValidate className="min-h-[calc(100svh-72px)] flex flex-col">
        <fieldset
          disabled={methods.formState.isSubmitting}
          className="mx-auto grid w-full max-w-6xl flex-1 min-w-0 gap-6 px-5 py-8 md:grid-cols-2 md:items-start disabled:opacity-60"
        >
          <div className="surface form-card contents md:flex md:flex-col md:gap-5">
            <div className="surface form-card flex flex-col gap-5 md:contents">
              <h3 className="text-base font-extrabold">Expense details</h3>
              <WhenPicker defaultDate={localDateTime(openedAt).slice(0, 10)} />
              <label className="block">
                <span className="field-label">Expense name</span>
                <Input name="expenseName" placeholder="Expense name…" />
              </label>
              <label className="block">
                <span className="field-label">Amount ({group.currency})</span>
                <MoneyInput
                  name="amount"
                  placeholder="0"
                  autoFocus
                  className="!bg-[var(--brand-soft)] !border-0 !py-4 !text-3xl !font-extrabold money"
                />
              </label>
              <fieldset>
                <legend className="field-label">Category</legend>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <label key={category.id} className="cursor-pointer">
                      <input
                        type="radio"
                        value={category.id}
                        {...methods.register("categoryId")}
                        className="peer sr-only"
                      />
                      <span className="chip choice-chip">
                        <EmojiImage icon={category.icon} /> {category.name}
                        {category.isActive ? "" : " (inactive)"}
                      </span>
                    </label>
                  ))}
                  <button
                    type="button"
                    onClick={() => setIsCreatingCategory(true)}
                    className="chip add-choice-chip"
                  >
                    <Icon icon={Plus} size={16} /> Add new category
                  </button>
                </div>
                {!categories.length && (
                  <p className="soft-caption mt-2">
                    No active categories yet. Add one to continue.
                  </p>
                )}
                {errors.categoryId && (
                  <span role="alert" className="money-negative text-xs">
                    {errors.categoryId.message}
                  </span>
                )}
              </fieldset>
            </div>
            <details className="group order-2 rounded-2xl border border-[var(--line)] bg-[var(--surface-soft)] md:order-none">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 transition-colors hover:bg-[var(--brand-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand)] group-open:rounded-b-none group-open:border-b group-open:border-[var(--line)] [&::-webkit-details-marker]:hidden">
                <span className="flex min-w-0 flex-col gap-1">
                  <span className="text-sm font-extrabold">Optional details</span>
                  <span className="text-xs text-[var(--muted)]">Description and tags</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 text-[var(--brand-ink)]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--surface)]">
                    <Icon
                      icon={ChevronDown}
                      size={20}
                      className="transition-transform group-open:rotate-180"
                    />
                  </span>
                </span>
              </summary>
              <div className="mt-4 flex min-w-0 flex-col gap-5 px-4 pb-4">
                <label className="block min-w-0">
                  <span className="field-label">Description (optional)</span>
                  <Textarea
                    name="description"
                    rows={3}
                    placeholder="Add details about this expense…"
                  />
                </label>
                <fieldset className="flex min-w-0 flex-col gap-2">
                  <legend className="field-label">Tags (optional)</legend>
                  <div className="flex flex-wrap gap-2">
                    {groupTags.map((tag) => (
                      <label key={tag.id} className="chip choice-pill">
                        <input
                          type="checkbox"
                          value={tag.id}
                          {...methods.register("tagIds")}
                          className="choice-control"
                        />
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => setIsCreatingTag(true)}
                      className="chip choice-pill add-choice-chip"
                    >
                      <Icon icon={Plus} size={16} /> Add new tag
                    </button>
                  </div>
                  {!groupTags.length && <p className="soft-caption">No tags in this group yet.</p>}
                </fieldset>
                <p className="soft-caption">
                  New attachments are not available yet. Existing receipts are preserved.
                </p>
              </div>
            </details>
          </div>
          <div className="surface form-card order-1 flex flex-col gap-5 md:order-none">
            <h3 className="text-base font-extrabold">Payment and split</h3>
            <PayerSelector
              members={payerMembers}
              quickIds={quickIds}
              currency={group.currency}
              validationMessage={validationMessage}
            />
            <div className="border-t border-[var(--line)] pt-4">
              <SplitEditor
                members={members}
                currency={group.currency}
                validationMessage={validationMessage}
              />
            </div>
            {errors.root?.message && (
              <p className="text-sm money-negative" aria-live="polite">
                {errors.root.message}
              </p>
            )}
          </div>
        </fieldset>
        <div className="form-toolbar">
          <span className="soft-caption max-sm:hidden">
            Expenses update balances as soon as they are saved.
          </span>
          <div className="flex gap-2 ml-auto">
            <Link to={cancelPath} className="btn btn-secondary">
              Cancel
            </Link>
            <button
              disabled={methods.formState.isSubmitting}
              type="submit"
              className="btn btn-primary"
            >
              {methods.formState.isSubmitting
                ? "Saving…"
                : expense
                  ? "Save changes"
                  : "Save expense"}
            </button>
          </div>
        </div>
      </form>
      {isCreatingCategory && (
        <CategoryCreator
          groupId={group.id}
          existingNames={groupCategories.map((category) => category.name)}
          onAdd={handleAddCategory}
          onCancel={() => setIsCreatingCategory(false)}
        />
      )}
      {isCreatingTag && (
        <TagCreator
          groupId={group.id}
          existingNames={groupTags.map((tag) => tag.name)}
          onAdd={handleAddTag}
          onCancel={() => setIsCreatingTag(false)}
        />
      )}
    </FormProvider>
  );
};

export default ExpenseForm;
