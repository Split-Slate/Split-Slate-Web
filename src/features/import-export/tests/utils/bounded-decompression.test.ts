import { strFromU8, strToU8, zipSync, zlibSync } from "fflate";
import { describe, expect, it } from "vitest";

import {
  boundedUnzip,
  boundedUnzlib,
  DecompressionLimitError,
} from "@/features/import-export/utils/bounded-decompression";

const limits = { compressedBytes: 4096, expandedBytes: 4096 };

describe("bounded decompression", () => {
  it("round-trips zlib across chunk boundaries and rejects expansion past the quota", () => {
    const bytes = strToU8("Unicode 🦊 ".repeat(100));
    expect(boundedUnzlib(zlibSync(bytes), bytes.length)).toEqual(bytes);
    expect(() => boundedUnzlib(zlibSync(bytes), bytes.length - 1)).toThrow(DecompressionLimitError);
    expect(() => boundedUnzlib(new Uint8Array(), 4096)).toThrow("incomplete");
  });
  it("rejects highly compressible payloads before retaining all expanded data", () => {
    expect(() => boundedUnzlib(zlibSync(new Uint8Array(1_000_000)), 1024)).toThrow("too large");
  });
  it("supports stored and deflated ZIP files, empty files and selective extraction", () => {
    for (const level of [0, 6] as const) {
      const zip = zipSync(
        { "one.txt": strToU8("hello"), "empty.txt": new Uint8Array() },
        { level },
      );
      const archive = boundedUnzip(zip, limits);
      expect(strFromU8(archive["one.txt"])).toBe("hello");
      expect(archive["empty.txt"]).toHaveLength(0);
      expect(
        Object.keys(boundedUnzip(zip, { ...limits, filter: (entry) => entry.name === "one.txt" })),
      ).toEqual(["one.txt"]);
    }
  });
  it("enforces compressed, expanded, per-entry and entry-count budgets", () => {
    const zip = zipSync({ "one.txt": new Uint8Array(100), "two.txt": new Uint8Array(100) });
    expect(() => boundedUnzip(zip, { ...limits, compressedBytes: zip.length - 1 })).toThrow(
      "too large",
    );
    expect(() => boundedUnzip(zip, { ...limits, expandedBytes: 199 })).toThrow("excessive");
    expect(() => boundedUnzip(zip, { ...limits, entryBytes: () => 99 })).toThrow("excessive");
    expect(() => boundedUnzip(zip, { ...limits, entries: 1 })).toThrow("excessive");
  });
  it("rejects false uncompressed sizes instead of trusting directory allocation hints", () => {
    const zip = zipSync({ "one.txt": new Uint8Array(1000) });
    const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);
    for (let offset = 0; offset + 28 <= zip.length; offset += 1) {
      if (view.getUint32(offset, true) === 0x02014b50) view.setUint32(offset + 24, 1, true);
      if (view.getUint32(offset, true) === 0x04034b50) view.setUint32(offset + 22, 1, true);
    }
    expect(() => boundedUnzip(zip, limits)).toThrow("size");
  });
  it("rejects duplicate names and local/directory disagreement", () => {
    const zip = zipSync({ one: strToU8("a"), two: strToU8("b") });
    for (let offset = 0; offset + 3 <= zip.length; offset += 1) {
      if (zip[offset] === 116 && zip[offset + 1] === 119 && zip[offset + 2] === 111)
        zip.set(strToU8("one"), offset);
    }
    expect(() => boundedUnzip(zip, limits)).toThrow("duplicate");
    const mismatch = zipSync({ one: strToU8("a") });
    mismatch.set(strToU8("two"), 30);
    expect(() => boundedUnzip(mismatch, limits)).toThrow("directory");
    expect(() => boundedUnzip(mismatch.slice(0, 30), limits)).toThrow();
  });
});
