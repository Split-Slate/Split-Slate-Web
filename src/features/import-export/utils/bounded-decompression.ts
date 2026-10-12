import type { UnzipFileInfo } from "fflate";
import { Unzip, UnzipInflate, unzipSync, Unzlib } from "fflate";

const INPUT_CHUNK_BYTES = 64;

export class DecompressionLimitError extends Error {}

interface ZipLimits {
  compressedBytes: number;
  expandedBytes: number;
  entryBytes?: (name: string) => number;
  entries?: number;
  filter?: (entry: UnzipFileInfo) => boolean;
}

const combineChunks = (chunks: Uint8Array[], size: number): Uint8Array<ArrayBuffer> => {
  const output = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return output;
};

export const boundedUnzlib = (bytes: Uint8Array, maximum: number): Uint8Array<ArrayBuffer> => {
  let size = 0;
  let complete = false;
  const chunks: Uint8Array[] = [];
  const stream = new Unzlib((chunk, final) => {
    size += chunk.byteLength;
    if (size > maximum) throw new DecompressionLimitError("Decompressed payload is too large");
    chunks.push(chunk);
    complete = final;
  });
  // Small compressed slices bound output allocated before each callback, including forged sizes.
  for (let offset = 0; offset < bytes.length; offset += INPUT_CHUNK_BYTES) {
    stream.push(
      bytes.subarray(offset, offset + INPUT_CHUNK_BYTES),
      offset + INPUT_CHUNK_BYTES >= bytes.length,
    );
  }
  if (!complete) throw new Error("Compressed payload is incomplete");
  return combineChunks(chunks, size);
};

export const boundedUnzip = (
  bytes: Uint8Array,
  limits: ZipLimits,
): Record<string, Uint8Array<ArrayBuffer>> => {
  if (bytes.byteLength > limits.compressedBytes)
    throw new DecompressionLimitError("ZIP is too large");
  const metadata = new Map<string, { info: UnzipFileInfo; accepted: boolean }>();
  let declaredBytes = 0;
  // Inspect the central directory without allocating any inflated output.
  unzipSync(bytes, {
    filter: (info) => {
      if (metadata.has(info.name)) throw new Error("ZIP contains duplicate file names");
      declaredBytes += info.originalSize;
      if (
        metadata.size >= (limits.entries ?? 10_000) ||
        declaredBytes > limits.expandedBytes ||
        info.originalSize > (limits.entryBytes?.(info.name) ?? limits.expandedBytes)
      ) {
        throw new DecompressionLimitError("ZIP contains excessive files or expanded data");
      }
      metadata.set(info.name, { info, accepted: limits.filter?.(info) ?? true });
      return false;
    },
  });
  const archive: Record<string, Uint8Array<ArrayBuffer>> = Object.create(null);
  const seen = new Set<string>();
  let expandedBytes = 0;
  let completed = 0;
  let accepted = 0;
  const stream = new Unzip((file) => {
    const entry = metadata.get(file.name);
    if (!entry || seen.has(file.name) || entry.info.compression !== file.compression)
      throw new Error("ZIP local records do not match its directory");
    seen.add(file.name);
    if (!entry.accepted) return;
    accepted += 1;
    const chunks: Uint8Array[] = [];
    let size = 0;
    file.ondata = (error, chunk, final) => {
      if (error) throw error;
      size += chunk.byteLength;
      expandedBytes += chunk.byteLength;
      if (
        size > (limits.entryBytes?.(file.name) ?? limits.expandedBytes) ||
        size > entry.info.originalSize ||
        expandedBytes > limits.expandedBytes
      ) {
        throw new DecompressionLimitError(
          "ZIP expanded data is too large or its size is incorrect",
        );
      }
      chunks.push(chunk);
      if (final) {
        if (size !== entry.info.originalSize)
          throw new Error("ZIP file size does not match its directory");
        archive[file.name] = combineChunks(chunks, size);
        completed += 1;
      }
    };
    file.start();
  });
  stream.register(UnzipInflate);
  for (let offset = 0; offset < bytes.length; offset += INPUT_CHUNK_BYTES) {
    stream.push(
      bytes.subarray(offset, offset + INPUT_CHUNK_BYTES),
      offset + INPUT_CHUNK_BYTES >= bytes.length,
    );
  }
  if (seen.size !== metadata.size || completed !== accepted) throw new Error("ZIP is incomplete");
  return archive;
};
