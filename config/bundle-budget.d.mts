export interface Budget {
  readonly pattern: RegExp;
  readonly maxGzipBytes: number;
}
export const BUDGETS: Readonly<{ main: Budget; scene: Budget }>;
export function gzipSize(content: Uint8Array | string): number;
export function checkBudgets(
  chunks: ReadonlyArray<{ readonly name: string; readonly gzipBytes: number }>,
  indexHtml: string,
): string[];
