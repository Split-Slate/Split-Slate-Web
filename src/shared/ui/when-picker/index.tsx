import { useId, useRef, useState } from "react";
import { useController, useFormContext } from "react-hook-form";

import type {
  DateTimeInputErrors,
  DateTimeParts,
  DateYearTypingState,
} from "@/shared/utils/date-time-input";
import {
  blockExtraDateYearDigit,
  composeLocalDateTime,
  getDateTimeInputErrors,
  limitDateYear,
  parseLocalDateTime,
  resetDateYearTyping,
  trackDateYearTyping,
} from "@/shared/utils/date-time-input";

interface PropsType {
  defaultDate: string;
}

const WhenPicker = ({ defaultDate }: PropsType) => {
  const { control } = useFormContext<{ when: string }>();
  const { field, fieldState } = useController({ name: "when", control });
  const hourRef = useRef<HTMLInputElement>(null);
  const minuteRef = useRef<HTMLInputElement>(null);
  const dateInputId = useId();
  const timeLabelId = useId();
  const dateErrorId = `${dateInputId}-error`;
  const timeErrorId = `${timeLabelId}-error`;
  const [parts, setParts] = useState(() => {
    const initial = parseLocalDateTime(field.value);
    return { ...initial, date: field.value ? initial.date : defaultDate };
  });
  const errors: DateTimeInputErrors = fieldState.error ? getDateTimeInputErrors(parts) : {};
  const dateTypingRef = useRef<DateYearTypingState>({
    value: parts.date,
    yearDigits: "",
    digits: "",
    lastKey: "",
  });

  const updateParts = (patch: Partial<DateTimeParts>) => {
    const next = { ...parts, ...patch };
    setParts(next);
    field.onChange(composeLocalDateTime(next));
  };
  const handleHourChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const hour = event.target.value.replace(/\D/gu, "").slice(0, 2);
    updateParts({ hour });
    if (hour !== parts.hour && (/^[2-9]$/.test(hour) || /^(0[1-9]|1[0-2])$/.test(hour)))
      minuteRef.current?.focus();
  };
  const handleMinuteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    updateParts({ minute: event.target.value.replace(/\D/gu, "").slice(0, 2) });
  };
  const handleMinuteKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Backspace" || event.currentTarget.value !== "") return;
    event.preventDefault();
    const hour = hourRef.current;
    if (!hour) return;
    hour.focus();
    const end = hour.value.length;
    hour.setSelectionRange(end, end);
  };
  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.currentTarget;
    const date = limitDateYear(input.value);
    trackDateYearTyping(dateTypingRef.current, date);
    // Also restore the native year segment when the limited value has not changed in React.
    if (input.value !== date) input.value = date;
    updateParts({ date });
  };
  const handleDateInteraction = (event: React.SyntheticEvent<HTMLInputElement>) => {
    resetDateYearTyping(dateTypingRef.current, event.currentTarget.value);
  };
  const handleDateKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.ctrlKey || event.metaKey || event.altKey) return;
    if (blockExtraDateYearDigit(dateTypingRef.current, event.key)) event.preventDefault();
  };
  const handleHourBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const hour = event.currentTarget.value.replace(/\D/gu, "").slice(0, 2);
    if (/^\d{1,2}$/.test(hour) && Number(hour) >= 1 && Number(hour) <= 12)
      updateParts({ hour: hour.padStart(2, "0") });
    field.onBlur();
  };
  const handleMinuteBlur = () => {
    if (/^\d{1,2}$/.test(parts.minute) && Number(parts.minute) <= 59)
      updateParts({ minute: parts.minute.padStart(2, "0") });
    field.onBlur();
  };
  const handleAM = () => updateParts({ period: "AM" });
  const handlePM = () => updateParts({ period: "PM" });
  const handleClearTime = () => updateParts({ hour: "", minute: "" });

  return (
    <fieldset className="min-w-0">
      <legend className="field-label">Date and time</legend>
      <div className="when-picker">
        <div className="when-picker-field">
          <label htmlFor={dateInputId} className="when-picker-caption">
            Date
          </label>
          <input
            id={dateInputId}
            type="date"
            min="0001-01-01"
            max="9999-12-31"
            value={parts.date}
            onChange={handleDateChange}
            onFocus={handleDateInteraction}
            onPointerDown={handleDateInteraction}
            onKeyDown={handleDateKeyDown}
            onBlur={field.onBlur}
            aria-invalid={errors.date ? true : undefined}
            aria-describedby={errors.date ? dateErrorId : undefined}
            data-empty={!parts.date ? true : undefined}
            className="form-input when-picker-date"
          />
          {errors.date && (
            <p id={dateErrorId} role="alert" className="text-xs money-negative">
              {errors.date}
            </p>
          )}
        </div>
        <div className="when-picker-field">
          <div className="flex items-center justify-between gap-2">
            <span className="when-picker-caption" id={timeLabelId}>
              Time
            </span>
            <button
              type="button"
              onClick={handleClearTime}
              className="text-xs font-bold text-[var(--brand-ink)] hover:underline"
            >
              Clear time
            </button>
          </div>
          <div
            className="when-picker-time"
            role="group"
            aria-labelledby={timeLabelId}
            aria-describedby={errors.time ? timeErrorId : undefined}
          >
            <input
              ref={hourRef}
              type="text"
              inputMode="numeric"
              value={parts.hour}
              onChange={handleHourChange}
              onBlur={handleHourBlur}
              aria-label="Hour"
              aria-invalid={errors.time ? true : undefined}
              aria-describedby={errors.time ? timeErrorId : undefined}
              placeholder="hh"
              className="when-picker-number"
            />
            <span aria-hidden="true" className="when-picker-colon">
              :
            </span>
            <input
              ref={minuteRef}
              type="text"
              inputMode="numeric"
              value={parts.minute}
              onChange={handleMinuteChange}
              onKeyDown={handleMinuteKeyDown}
              onBlur={handleMinuteBlur}
              aria-label="Minute"
              aria-invalid={errors.time ? true : undefined}
              aria-describedby={errors.time ? timeErrorId : undefined}
              placeholder="mm"
              className="when-picker-number"
            />
            <span className="when-picker-period" aria-label="AM or PM">
              <button
                type="button"
                onClick={handleAM}
                aria-pressed={parts.period === "AM"}
                className="when-picker-period-button"
              >
                AM
              </button>
              <button
                type="button"
                onClick={handlePM}
                aria-pressed={parts.period === "PM"}
                className="when-picker-period-button"
              >
                PM
              </button>
            </span>
          </div>
          {errors.time && (
            <p id={timeErrorId} role="alert" className="text-xs money-negative">
              {errors.time}
            </p>
          )}
        </div>
      </div>
    </fieldset>
  );
};

export default WhenPicker;
