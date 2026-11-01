import { UUID_BYTES, uuidV4FromBytes } from "../core";

/** The part of Web Crypto used for ids. `randomUUID` only exists in a secure context. */
export interface RandomSource {
  readonly randomUUID?: () => string;
  getRandomValues(array: Uint8Array<ArrayBuffer>): Uint8Array;
}

/**
 * New UUID v4 for a setup. `crypto.randomUUID` is missing outside a secure context (plain
 * HTTP on a LAN address, e.g. a phone test): the fallback draws 16 bytes from
 * `crypto.getRandomValues`, available everywhere, and formats them in `core`.
 */
export function randomUuid(source: RandomSource = globalThis.crypto): string {
  if (typeof source.randomUUID === "function") return source.randomUUID();
  // Never null: exactly UUID_BYTES bytes are passed.
  return uuidV4FromBytes(source.getRandomValues(new Uint8Array(UUID_BYTES)))!;
}
