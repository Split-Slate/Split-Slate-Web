export const EXPORT_SCHEMA_VERSION = 2 as const;
export const MAX_TRANSFER_URL_LENGTH = 32_000;
export const MAX_DECODED_LINK_BYTES = 256 * 1024;
export const MAX_GROUP_TEXT_BYTES = 16 * 1024 * 1024;
export const MAX_GROUP_ZIP_BYTES = 64 * 1024 * 1024;
export const MAX_GROUP_EXPANDED_BYTES = 128 * 1024 * 1024;

export const EXPORT_CSV_COLUMNS = [
  "schemaVersion",
  "recordType",
  "id",
  "groupId",
  "name",
  "icon",
  "currency",
  "createdAt",
  "frequentPayerIds",
  "personId",
  "isActive",
  "color",
  "expenseName",
  "description",
  "createdBy",
  "categoryId",
  "when",
  "splitType",
  "splitMeta",
  "paid",
  "owes",
  "tagIds",
  "attachmentIds",
  "expenseId",
  "mimeType",
  "fromMemberId",
  "toMemberId",
  "recordedBy",
  "amount",
  "kind",
  "selection",
  "sourceCounts",
  "includedCounts",
  "integrityAlgorithm",
  "integrityDigest",
] as const;
