/**
 * UTF-8 byte length of a JS string without allocating (no TextEncoder: `core` stays
 * free of platform APIs). Lone surrogates count as U+FFFD (3 bytes), like TextEncoder.
 * Stops counting once `limit` is exceeded.
 */
export function utf8ByteLength(text: string, limit = Number.POSITIVE_INFINITY): number {
  let bytes = 0;
  for (let i = 0; i < text.length && bytes <= limit; i++) {
    const code = text.charCodeAt(i);
    if (code < 0x80) bytes += 1;
    else if (code < 0x800) bytes += 2;
    else if (code >= 0xd800 && code <= 0xdbff && i + 1 < text.length) {
      const next = text.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        bytes += 4;
        i++;
      } else bytes += 3;
    } else bytes += 3;
  }
  return bytes;
}
