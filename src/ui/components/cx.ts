/** Joins class names, skipping empty ones (CSS Modules lookups are `string | undefined`). */
export function cx(...names: readonly (string | false | null | undefined)[]): string {
  return names.filter(Boolean).join(" ");
}
