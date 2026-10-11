import { strFromU8, strToU8, unzipSync, zipSync } from "fflate";
import { describe, expect, it } from "vitest";

import { buildGroupTransfer } from "@/features/import-export/utils/build-transfer";
import {
  AppBackupFileError,
  createPortableGroupZip,
  parsePortableGroupZip,
} from "@/features/import-export/utils/export-zip";

import {
  createExportSource,
  GROUP_ONLY_SELECTION,
} from "@/features/import-export/tests/fixtures/transfer-fixture";

describe("portable group ZIP", () => {
  it("round-trips the verified manifest, CSV, index, and receipt files", async () => {
    const fixture = createExportSource({ withAttachments: true, expenseCount: 2 });
    fixture.expenses[0].description = 'Dinner  and drinks\n\nInvoice: "123" 🥘';
    const source = await buildGroupTransfer(fixture, {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    const bytes = await createPortableGroupZip(source);
    const archive = unzipSync(bytes);
    expect(Object.keys(archive).sort()).toEqual([
      "README.txt",
      "attachments/1-attachment-0001-12345678-90ab-cdef.jpg",
      "attachments/2-attachment-0002-12345678-90ab-cdef.jpg",
      "attachments/index.json",
      "group.csv",
      "manifest.json",
    ]);
    expect(strFromU8(archive["README.txt"])).toContain("new editable group");
    const parsed = await parsePortableGroupZip(bytes);
    expect(parsed.bundle).toEqual(source.bundle);
    expect(parsed.bundle.expenses[0].description).toBe(fixture.expenses[0].description);
    expect(parsed.bundle.expenses[1]).not.toHaveProperty("description");
    expect(await parsed.attachmentFiles[0].blob.text()).toBe("receipt 1");
  });

  it("accepts a previous ZIP with a description-free CSV header and unchanged manifest digest", async () => {
    const source = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      ...GROUP_ONLY_SELECTION,
      attachments: true,
    });
    const archive = unzipSync(await createPortableGroupZip(source));
    // This legacy fixture has single-line cells; quoted nested JSON remains intact.
    const lines = strFromU8(archive["group.csv"])
      .replace(/^\uFEFF/u, "")
      .split("\r\n");
    const header = lines[0].match(/"(?:[^"]|"")*"/gu)!;
    const descriptionIndex = header.indexOf('"description"');
    expect(descriptionIndex).toBeGreaterThan(-1);
    archive["group.csv"] = strToU8(
      `\uFEFF${lines
        .map((line) => {
          const cells = line.match(/"(?:[^"]|"")*"/gu) ?? [];
          return cells.filter((_, index) => index !== descriptionIndex).join(",");
        })
        .join("\r\n")}`,
    );
    const parsed = await parsePortableGroupZip(zipSync(archive));
    expect(parsed.bundle).toEqual(source.bundle);
    expect(parsed.bundle.expenses[0]).not.toHaveProperty("description");
    expect(await parsed.attachmentFiles[0].blob.text()).toBe("receipt 1");
  });

  it("supports ZIP transfers without receipts", async () => {
    const source = await buildGroupTransfer(createExportSource(), GROUP_ONLY_SELECTION);
    const parsed = await parsePortableGroupZip(await createPortableGroupZip(source));
    expect(parsed.bundle).toEqual(source.bundle);
    expect(parsed.attachmentFiles).toEqual([]);
  });

  it("recognizes a whole-app backup and rejects unrelated archives as group transfers", async () => {
    await expect(
      parsePortableGroupZip(
        zipSync({ "backup.json": strToU8("{}"), "manifest.json": strToU8("{}") }),
      ),
    ).rejects.toThrow(AppBackupFileError);
    await expect(parsePortableGroupZip(zipSync({ "notes.txt": strToU8("hi") }))).rejects.toThrow(
      "not a SplitSlate group transfer",
    );
  });

  it("rejects missing, surplus, and corrupted attachment files", async () => {
    const source = await buildGroupTransfer(createExportSource({ withAttachments: true }), {
      categories: true,
      tags: true,
      members: true,
      expenses: true,
      attachments: true,
    });
    await expect(createPortableGroupZip({ ...source, attachmentFiles: [] })).rejects.toThrow(
      "do not match",
    );
    await expect(
      createPortableGroupZip({
        ...source,
        attachmentFiles: [
          ...source.attachmentFiles,
          { ...source.attachmentFiles[0], id: "surplus" },
        ],
      }),
    ).rejects.toThrow("do not match");

    const archive = unzipSync(await createPortableGroupZip(source));
    const receiptPath = Object.keys(archive).find((path) => path.startsWith("attachments/1-"))!;
    archive[receiptPath] = new TextEncoder().encode("corrupt");
    await expect(parsePortableGroupZip(zipSync(archive))).rejects.toThrow("integrity");
  });
});
