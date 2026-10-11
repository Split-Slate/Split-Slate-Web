export interface DateTimeParts {
  date: string;
  hour: string;
  minute: string;
  period: "AM" | "PM";
}

export interface DateTimeInputErrors {
  date?: string;
  time?: string;
}

export const limitDateYear = (value: string): string =>
  value.replace(
    /^(\d{5,})-(\d{2})-(\d{2})$/u,
    (_, year: string, month: string, day: string) => `${year.slice(0, 4)}-${month}-${day}`,
  );

export interface DateYearTypingState {
  value: string;
  yearDigits: string;
  digits: string;
  lastKey: string;
}

export const resetDateYearTyping = (state: DateYearTypingState, value: string): void => {
  state.value = value;
  state.yearDigits = "";
  state.digits = "";
  state.lastKey = "";
};

export const blockExtraDateYearDigit = (state: DateYearTypingState, key: string): boolean => {
  state.lastKey = key;
  if (/^\d$/u.test(key)) {
    if (state.yearDigits.length >= 4) return true;
    state.digits = `${state.digits}${key}`.slice(-4);
  } else {
    resetDateYearTyping(state, state.value);
  }
  return false;
};

export const trackDateYearTyping = (state: DateYearTypingState, value: string): void => {
  const [year, month, day] = value.split("-");
  const [previousYear, previousMonth, previousDay] = state.value.split("-");
  const sameMonthAndDay = month === previousMonth && day === previousDay;
  const editingYear =
    value &&
    /^\d$/u.test(state.lastKey) &&
    ((sameMonthAndDay && (year !== previousYear || state.yearDigits)) ||
      (!previousYear && Number(year) === Number(state.digits)));
  if (editingYear) {
    state.yearDigits = state.yearDigits
      ? `${state.yearDigits}${state.lastKey}`
      : Number(state.digits) === Number(year)
        ? state.digits
        : state.lastKey;
  } else {
    state.yearDigits = "";
  }
  state.value = value;
  state.lastKey = "";
};

export const parseLocalDateTime = (value: string): DateTimeParts => {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { date: "", hour: "", minute: "", period: "AM" };

  const hour = Number(match[2]);
  return {
    date: match[1],
    hour: String(hour % 12 || 12).padStart(2, "0"),
    minute: match[3],
    period: hour < 12 ? "AM" : "PM",
  };
};

export const composeLocalDateTime = ({ date, hour, minute, period }: DateTimeParts): string => {
  if (!date) return "";
  const hours = Number(hour);
  const minutes = Number(minute);
  if (
    !/^\d{1,2}$/.test(hour) ||
    !/^\d{1,2}$/.test(minute) ||
    hours < 1 ||
    hours > 12 ||
    minutes > 59
  )
    return "invalid";

  const hour24 = (hours % 12) + (period === "PM" ? 12 : 0);
  return `${date}T${String(hour24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

export const getDateTimeInputErrors = (parts: DateTimeParts): DateTimeInputErrors => {
  const errors: DateTimeInputErrors = {};
  const dateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(parts.date);
  // Check calendar validity independently of the selected time and local clock transitions.
  const date = new Date(`${parts.date}T00:00:00.000Z`);
  if (!parts.date) errors.date = "Date is required";
  else if (
    !dateMatch ||
    !Number.isFinite(date.getTime()) ||
    date.getUTCFullYear() !== Number(dateMatch[1]) ||
    date.getUTCMonth() + 1 !== Number(dateMatch[2]) ||
    date.getUTCDate() !== Number(dateMatch[3])
  )
    errors.date = "Enter a valid date";

  if (!parts.hour || !parts.minute) errors.time = "Time is required";
  else if (composeLocalDateTime({ ...parts, date: "2000-01-01" }) === "invalid")
    errors.time = "Enter a valid time";

  if (dateMatch && !errors.date && !errors.time) {
    const local = new Date(composeLocalDateTime(parts));
    const hour24 = (Number(parts.hour) % 12) + (parts.period === "PM" ? 12 : 0);
    // A clock-change gap is a time error, not an error in the calendar date.
    if (
      !Number.isFinite(local.getTime()) ||
      local.getFullYear() !== Number(dateMatch[1]) ||
      local.getMonth() + 1 !== Number(dateMatch[2]) ||
      local.getDate() !== Number(dateMatch[3]) ||
      local.getHours() !== hour24 ||
      local.getMinutes() !== Number(parts.minute)
    )
      errors.time = "Enter a valid local time";
  }
  return errors;
};
