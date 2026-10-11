import { describe, expect, it } from "vitest";

import type { DateTimeParts, DateYearTypingState } from "@/shared/utils/date-time-input";
import {
  blockExtraDateYearDigit,
  getDateTimeInputErrors,
  limitDateYear,
  resetDateYearTyping,
  trackDateYearTyping,
} from "@/shared/utils/date-time-input";

const VALID_PARTS: DateTimeParts = {
  date: "2026-10-11",
  hour: "09",
  minute: "15",
  period: "AM",
};

describe("four-digit date years", () => {
  it.each([
    ["", ""],
    ["0001-01-01", "0001-01-01"],
    ["2026-10-11", "2026-10-11"],
    ["9999-12-31", "9999-12-31"],
    ["20267-10-11", "2026-10-11"],
    ["202678-10-11", "2026-10-11"],
    ["123456789-01-02", "1234-01-02"],
  ])("limits %j to %j without changing month or day", (value, expected) => {
    expect(limitDateYear(value)).toBe(expected);
  });

  it("ignores additional year digits after the fourth and allows clearing and reentry", () => {
    let date = "2026-10-11";
    for (const digit of "789") {
      const [year, month, day] = date.split("-");
      date = limitDateYear(`${year}${digit}-${month}-${day}`);
      expect(date).toBe("2026-10-11");
    }
    expect(limitDateYear("")).toBe("");
    expect(limitDateYear("2030-10-11")).toBe("2030-10-11");
    expect(getDateTimeInputErrors({ ...VALID_PARTS, date })).toEqual({});
  });

  it("blocks further native year typing instead of letting four digits roll over", () => {
    const state: DateYearTypingState = {
      value: "2025-10-11",
      yearDigits: "",
      digits: "",
      lastKey: "",
    };
    for (const [digit, year] of [
      ["2", "0002"],
      ["0", "0020"],
      ["2", "0202"],
      ["6", "2026"],
    ]) {
      expect(blockExtraDateYearDigit(state, digit)).toBe(false);
      trackDateYearTyping(state, `${year}-10-11`);
    }
    expect(blockExtraDateYearDigit(state, "7")).toBe(true);
    expect(blockExtraDateYearDigit(state, "8")).toBe(true);
    expect(state.value).toBe("2026-10-11");
    expect(blockExtraDateYearDigit(state, "Backspace")).toBe(false);
    trackDateYearTyping(state, "");
    expect(blockExtraDateYearDigit(state, "3")).toBe(false);
    resetDateYearTyping(state, "2030-10-11");
    expect(blockExtraDateYearDigit(state, "ArrowLeft")).toBe(false);
    expect(blockExtraDateYearDigit(state, "1")).toBe(false);
  });

  it("allows month/day entry and keeps leading zeroes within the four-key year limit", () => {
    const state: DateYearTypingState = {
      value: "2026-10-11",
      yearDigits: "",
      digits: "",
      lastKey: "",
    };
    expect(blockExtraDateYearDigit(state, "1")).toBe(false);
    trackDateYearTyping(state, "2026-01-11");
    expect(blockExtraDateYearDigit(state, "2")).toBe(false);
    trackDateYearTyping(state, "2026-12-11");
    expect(state.yearDigits).toBe("");
    resetDateYearTyping(state, "");
    for (const digit of "000") {
      expect(blockExtraDateYearDigit(state, digit)).toBe(false);
      trackDateYearTyping(state, "");
    }
    expect(blockExtraDateYearDigit(state, "2")).toBe(false);
    trackDateYearTyping(state, "0002-10-11");
    expect(blockExtraDateYearDigit(state, "3")).toBe(true);
  });
});

describe("date and time field errors", () => {
  it.each(["", "2026-02-30", "2025-02-29", "2026-13-01", "2026-10-32", "not-a-date"])(
    "reports only a date error for %j",
    (date) => {
      expect(getDateTimeInputErrors({ ...VALID_PARTS, date })).toEqual({
        date: date ? "Enter a valid date" : "Date is required",
      });
    },
  );

  it.each([
    ["", "15", "Time is required"],
    ["09", "", "Time is required"],
    ["", "", "Time is required"],
    ["00", "15", "Enter a valid time"],
    ["13", "15", "Enter a valid time"],
    ["99", "15", "Enter a valid time"],
    ["09", "60", "Enter a valid time"],
    ["09", "99", "Enter a valid time"],
    ["x", "15", "Enter a valid time"],
    ["09", "x", "Enter a valid time"],
  ])("reports only a time error for %j:%j", (hour, minute, message) => {
    expect(getDateTimeInputErrors({ ...VALID_PARTS, hour, minute })).toEqual({ time: message });
  });

  it("reports both missing fields independently", () => {
    expect(getDateTimeInputErrors({ ...VALID_PARTS, date: "", hour: "", minute: "" })).toEqual({
      date: "Date is required",
      time: "Time is required",
    });
  });

  it("reports both invalid fields independently", () => {
    expect(getDateTimeInputErrors({ ...VALID_PARTS, date: "2026-02-30", hour: "99" })).toEqual({
      date: "Enter a valid date",
      time: "Enter a valid time",
    });
  });

  it.each([
    { date: "2024-02-29", hour: "09", minute: "15", period: "AM" },
    { date: "2026-10-11", hour: "12", minute: "00", period: "AM" },
    { date: "2026-10-11", hour: "12", minute: "00", period: "PM" },
    { date: "2026-10-11", hour: "1", minute: "5", period: "PM" },
  ] satisfies DateTimeParts[])("accepts valid date/time parts %j", (parts) => {
    expect(getDateTimeInputErrors(parts)).toEqual({});
  });
});
