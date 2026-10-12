import { describe, expect, it } from "vitest";

import { paymentPreviewBalances } from "@/features/settlements/utils/payment-preview";

import type { Settlement } from "@/shared/types/domain.types";

const payment = (id: string, reverse = false): Settlement => ({
  id,
  groupId: "trip",
  kind: "payment",
  fromMemberId: reverse ? "b" : "a",
  toMemberId: reverse ? "a" : "b",
  recordedBy: "a",
  when: 1,
  createdAt: 1,
  amount: Number.MAX_SAFE_INTEGER,
  tagIds: [],
});

describe("payment edit preview", () => {
  const payments = [payment("first"), payment("second"), payment("offset", true)];
  it("allows an intermediate net above the number limit without changing safe saved nets", () => {
    const preview = paymentPreviewBalances([], ["a", "b"], payments, "offset");
    expect(preview.get("a")).toBe(BigInt(Number.MAX_SAFE_INTEGER) * 2n);
    expect(preview.get("b")).toBe(-BigInt(Number.MAX_SAFE_INTEGER) * 2n);
    expect(payments[2].amount).toBe(Number.MAX_SAFE_INTEGER);
  });
  it("retains saved nets for new payments and unknown edit IDs", () => {
    for (const id of [undefined, "missing"]) {
      expect(paymentPreviewBalances([], ["a", "b"], payments, id)).toEqual(
        new Map([
          ["a", BigInt(Number.MAX_SAFE_INTEGER)],
          ["b", -BigInt(Number.MAX_SAFE_INTEGER)],
        ]),
      );
    }
  });
  it("still rejects invalid saved final nets and missing members", () => {
    expect(() => paymentPreviewBalances([], ["a", "b"], payments.slice(0, 2))).toThrow("range");
    expect(() => paymentPreviewBalances([], ["a"], payments)).toThrow("missing");
  });
});
