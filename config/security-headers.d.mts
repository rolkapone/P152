import type { Plugin } from "vite";

export const CSP_DIRECTIVES: Readonly<Record<string, readonly string[]>>;
export const CSP: string;
export const SECURITY_HEADERS: Readonly<Record<string, string>>;
export const CACHE_RULES: ReadonlyArray<readonly [string, Readonly<Record<string, string>>]>;
export function renderHeadersFile(): string;
export function securityHeadersPlugin(): Plugin;
