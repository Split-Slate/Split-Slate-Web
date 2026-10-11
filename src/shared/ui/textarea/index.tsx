import type { TextareaHTMLAttributes } from "react";
import { useId } from "react";
import { useController, useFormContext } from "react-hook-form";

interface PropsType extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  name: string;
}

const Textarea = ({ name, className = "", id, ...props }: PropsType) => {
  const generatedId = useId();
  const { control } = useFormContext();
  const { field, fieldState } = useController({ name, control });
  const errorId = `${id ?? generatedId}-error`;
  const describedBy = [props["aria-describedby"], fieldState.error ? errorId : undefined]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex min-w-0 flex-col gap-1">
      <textarea
        {...props}
        {...field}
        id={id ?? generatedId}
        value={field.value ?? ""}
        disabled={props.disabled ?? field.disabled}
        aria-invalid={fieldState.error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`form-input min-h-28 resize-y leading-relaxed ${className}`}
      />
      {fieldState.error && (
        <p id={errorId} role="alert" className="text-xs money-negative">
          {fieldState.error.message}
        </p>
      )}
    </div>
  );
};

export default Textarea;
