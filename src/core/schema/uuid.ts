/** Number of random bytes behind a UUID v4 (RFC 9562 §5.4: 122 random bits + version + variant). */
export const UUID_BYTES = 16;

const HEX = Array.from({ length: 256 }, (_, byte) => byte.toString(16).padStart(2, "0"));

/**
 * UUID v4 from 16 random bytes supplied by the caller (no platform API inside `core`): sets the
 * version (4) and the variant (10xx), then formats as lower-case 8-4-4-4-12. Returns null if
 * the input is not exactly 16 bytes. The input is not modified.
 */
export function uuidV4FromBytes(bytes: Uint8Array): string | null {
  if (bytes.length !== UUID_BYTES) return null;
  const b = Uint8Array.from(bytes);
  b[6] = (b[6]! & 0x0f) | 0x40;
  b[8] = (b[8]! & 0x3f) | 0x80;
  const hex = Array.from(b, (byte) => HEX[byte]!).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
