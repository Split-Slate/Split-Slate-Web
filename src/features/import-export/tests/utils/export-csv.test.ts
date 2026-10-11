import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  createPortableGroupCsv,
  parsePortableGroupCsv,
} from "@/features/import-export/utils/export-csv";
import {
  canonicalTransferJson,
  digestBytes,
} from "@/features/import-export/utils/transfer-integrity";

import type { PortableGroup } from "@/features/import-export/types/import-export.types";

import { createExportSource } from "@/features/import-export/tests/fixtures/transfer-fixture";

const selection = {
  categories: true,
  tags: true,
  members: true,
  expenses: true,
  attachments: false,
};

// Legacy fixtures use single-line cells; retain quoted JSON cells when dropping newer columns.
const withoutCsvColumns = (csv: string, omitted: string[]): string => {
  const lines = csv.replace(/^\uFEFF/u, "").split("\r\n");
  const header = lines[0].match(/"(?:[^"]|"")*"/gu)!;
  const keep = header.map((cell) => !omitted.includes(cell.slice(1, -1)));
  return `\uFEFF${lines
    .map((line) =>
      (line.match(/"(?:[^"]|"")*"/gu) ?? []).filter((_, index) => keep[index]).join(","),
    )
    .join("\r\n")}`;
};

describe("portable group CSV", () => {
  it.each(["=SUM(1,2)", "+reference", "-reference", "@reference"])(
    "preserves multiline descriptions beginning with %s and detects description tampering",
    async (prefix) => {
      const source = createExportSource({ expenseCount: 2 });
      source.expenses[0].description = `${prefix}\nDinner  for everyone, "quoted" 🥘\n\nLast line`;
      const { bundle } = await buildGroupTransfer(source, selection);
      const csv = await createPortableGroupCsv(bundle);
      expect(csv).toContain(`\t${prefix}`);
      const parsed = await parsePortableGroupCsv(csv);
      expect(parsed).toEqual(bundle);
      expect(parsed.expenses[0].description).toBe(source.expenses[0].description);
      expect(parsed.expenses[1]).not.toHaveProperty("description");
      await expect(
        parsePortableGroupCsv(csv.replace("Dinner  for everyone", "Changed description")),
      ).rejects.toThrow("integrity");
    },
  );

  it("accepts the previous version-2 header without adding descriptions or changing its digest", async () => {
    const { bundle } = await buildGroupTransfer(
      createExportSource({ withSettlements: true }),
      selection,
    );
    const oldCsv = withoutCsvColumns(await createPortableGroupCsv(bundle), ["description"]);
    expect(oldCsv).not.toContain('"description"');
    const parsed = await parsePortableGroupCsv(oldCsv);
    expect(parsed).toEqual(bundle);
    expect(parsed.expenses[0]).not.toHaveProperty("description");
  });

  it("accepts the version-1 header and original digest without descriptions or payments", async () => {
    const { bundle } = await buildGroupTransfer(createExportSource(), selection);
    const { settlements, ...legacyData } = bundle;
    const { settlements: sourcePayments, ...sourceCounts } = bundle.manifest.sourceCounts;
    const { settlements: includedPayments, ...includedCounts } = bundle.manifest.includedCounts;
    void settlements;
    void sourcePayments;
    void includedPayments;
    const unsigned = {
      ...legacyData,
      schemaVersion: 1,
      manifest: { selection: bundle.manifest.selection, sourceCounts, includedCounts },
    };
    const digest = await digestBytes(
      new TextEncoder().encode(canonicalTransferJson(unsigned as unknown as PortableGroup)),
    );
    const cell = (value: unknown) => `"${JSON.stringify(value).replace(/"/gu, '""')}"`;
    const csv = (await createPortableGroupCsv(bundle))
      .replaceAll('"2","', '"1","')
      .replace(cell(bundle.manifest.sourceCounts), cell(sourceCounts))
      .replace(cell(bundle.manifest.includedCounts), cell(includedCounts))
      .replace(bundle.manifest.integrity.digest, digest);
    const oldCsv = withoutCsvColumns(csv, [
      "description",
      "fromMemberId",
      "toMemberId",
      "recordedBy",
      "amount",
      "kind",
    ]);
    await expect(parsePortableGroupCsv(oldCsv)).resolves.toEqual(bundle);
  });

  it("round-trips manifests, Unicode, quoted content, and spreadsheet-safe text", async () => {
    const source = createExportSource();
    source.group.name = '=यात्रा, "special"\nline';
    source.people[0].name = "+Amy";
    const value = await buildGroupTransfer(source, selection);
    const csv = await createPortableGroupCsv(value.bundle);
    expect(csv.startsWith("\uFEFF")).toBe(true);
    expect(csv).toContain("\t=यात्रा");
    expect(csv).toContain("\t+Amy");
    await expect(parsePortableGroupCsv(csv)).resolves.toEqual(value.bundle);
  });

  it("is deterministic regardless of source collection order", async () => {
    const source = createExportSource();
    const first = await createPortableGroupCsv(
      (await buildGroupTransfer(source, selection)).bundle,
    );
    source.people.reverse();
    source.members.reverse();
    source.categories.reverse();
    source.tags.reverse();
    const second = await createPortableGroupCsv(
      (await buildGroupTransfer(source, selection)).bundle,
    );
    expect(second).toBe(first);
  });

  it("rejects unsupported headers, versions, malformed cells, and tampering", async () => {
    await expect(parsePortableGroupCsv("wrong,header\n")).rejects.toThrow("header");
    const transfer = await buildGroupTransfer(createExportSource(), selection);
    const csv = await createPortableGroupCsv(transfer.bundle);
    await expect(
      parsePortableGroupCsv(csv.replace('"2","manifest"', '"3","manifest"')),
    ).rejects.toThrow("version");
    await expect(parsePortableGroupCsv('"schemaVersion')).rejects.toThrow("unterminated");
    await expect(
      parsePortableGroupCsv(csv.replace("Expense 1", "Changed expense")),
    ).rejects.toThrow("integrity");
  });

  it("round-trips tagged payments separately from expenses", async () => {
    const transfer = await buildGroupTransfer(
      createExportSource({ withSettlements: true }),
      selection,
    );
    const csv = await createPortableGroupCsv(transfer.bundle);
    const parsed = await parsePortableGroupCsv(csv);
    expect(parsed.settlements).toEqual(transfer.bundle.settlements);
    expect(csv).toContain('"settlement"');
  });
});
