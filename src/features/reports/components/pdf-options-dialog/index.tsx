import { zodResolver } from "@hookform/resolvers/zod";
import type { SyntheticEvent } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";

import {
  getPrintableReportFields,
  PDF_REPORT_MESSAGES,
} from "@/features/reports/utils/report-data";
import {
  EXPENSE_PDF_FIELD_OPTIONS,
  expensePdfOptionsSchema,
  readExpensePdfOptions,
} from "@/features/reports/utils/report-options";

import type {
  ExpensePdfField,
  ExpensePdfOptions,
  PdfReportData,
} from "@/features/reports/types/reports.types";

import DialogLayout from "@/shared/ui/dialog-layout";

interface PropsType {
  report?: PdfReportData;
  unavailableReason?: string;
  onGenerate: (options: ExpensePdfOptions) => Promise<void>;
  onCancel: () => void;
}

const PdfOptionsDialog = ({ report, unavailableReason, onGenerate, onCancel }: PropsType) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [error, setError] = useState("");
  const [initialOptions] = useState(readExpensePdfOptions);
  const methods = useForm<ExpensePdfOptions>({
    resolver: zodResolver(expensePdfOptionsSchema),
    defaultValues: initialOptions,
    mode: "onChange",
  });
  const fields = useWatch({ control: methods.control, name: "fields" });
  const { isSubmitting, errors } = methods.formState;
  const hasFields = fields.length > 0;
  const fieldError =
    errors.fields?.message ?? (!hasFields ? "Select at least one field to generate a PDF." : "");
  const dataIssue =
    unavailableReason ||
    (!report
      ? "Could not prepare the PDF data."
      : hasFields && !getPrintableReportFields(report, fields).length
        ? PDF_REPORT_MESSAGES.NO_FIELD_VALUES
        : "");

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener = document.activeElement;
    dialog?.showModal();
    return () => {
      dialog?.close();
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
  }, []);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    if (!submittingRef.current) onCancel();
  };
  const handleClose = () => {
    if (!submittingRef.current) onCancel();
  };
  const handleToggleField = (field: ExpensePdfField) => {
    const current = methods.getValues("fields");
    methods.setValue(
      "fields",
      current.includes(field) ? current.filter((value) => value !== field) : [...current, field],
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
    setError("");
  };
  const handleGenerate = (event: SyntheticEvent<HTMLFormElement>) =>
    methods.handleSubmit(async (values) => {
      if (submittingRef.current || dataIssue) return;
      submittingRef.current = true;
      setError("");
      try {
        await onGenerate(values);
      } catch (failure) {
        setError(
          failure instanceof Error ? failure.message : "Could not generate the PDF. Try again.",
        );
      } finally {
        submittingRef.current = false;
      }
    })(event);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      className="app-dialog max-w-lg rounded-3xl border border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-2xl backdrop:bg-black/60"
    >
      <FormProvider {...methods}>
        <form onSubmit={handleGenerate} className="dialog-form">
          <DialogLayout
            title="Choose PDF fields"
            titleId={titleId}
            onClose={handleClose}
            closeDisabled={isSubmitting}
            bodyClassName="flex flex-col gap-4"
            footer={
              <>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!hasFields || !!dataIssue || isSubmitting}
                  aria-busy={isSubmitting}
                >
                  {isSubmitting ? "Creating PDF…" : "Generate PDF"}
                </button>
              </>
            }
          >
            <p id={descriptionId} className="soft-caption">
              Include the fields you need for the matching expenses. Sl. No. is always included.
              Your choices and order are remembered after a PDF is generated. Numbers show column
              order; uncheck and reselect a field to move it to the end. Member shares moves as one
              block. Columns with no values are omitted without changing your choices.
            </p>
            <fieldset disabled={isSubmitting} aria-describedby={fieldError ? errorId : undefined}>
              <legend className="field-label mb-2">Include fields</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                <Controller
                  name="fields"
                  control={methods.control}
                  render={({ field }) => (
                    <>
                      {EXPENSE_PDF_FIELD_OPTIONS.map((option, index) => (
                        <label
                          key={option.value}
                          className="choice-option choice-option-compact text-sm"
                        >
                          <span className="relative inline-flex shrink-0">
                            <input
                              ref={index === 0 ? field.ref : undefined}
                              name={field.name}
                              onBlur={field.onBlur}
                              onChange={() => handleToggleField(option.value)}
                              checked={fields.includes(option.value)}
                              aria-description={
                                fields.includes(option.value)
                                  ? `Selected position ${fields.indexOf(option.value) + 1}`
                                  : undefined
                              }
                              type="checkbox"
                              value={option.value}
                              autoFocus={index === 0}
                              className="choice-control after:hidden!"
                            />
                            {fields.includes(option.value) && (
                              <span
                                aria-hidden="true"
                                data-selection-order={fields.indexOf(option.value) + 1}
                                className="pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-bold text-white"
                              >
                                {fields.indexOf(option.value) + 1}
                              </span>
                            )}
                          </span>
                          <span>{option.label}</span>
                        </label>
                      ))}
                    </>
                  )}
                />
              </div>
            </fieldset>
            {fieldError && (
              <p id={errorId} role="alert" className="text-sm money-negative">
                {fieldError}
              </p>
            )}
            {error && (
              <p role="alert" className="note money-negative">
                {error}
              </p>
            )}
            {dataIssue && (
              <p role="alert" className="note money-negative">
                {dataIssue}
              </p>
            )}
          </DialogLayout>
        </form>
      </FormProvider>
    </dialog>
  );
};

export default PdfOptionsDialog;
