/**
 * Number formatting of the UI (ADR-APP-05): `Intl`, in the active language. `core/` gives raw
 * values (mm); the UI chooses the unit shown.
 */

/** Millimetres to centimetres for display, at most one decimal ("140", "70.5"). */
export function formatCentimetres(millimetres: number, language: string): string {
  return new Intl.NumberFormat(language, { maximumFractionDigits: 1 }).format(millimetres / 10);
}
