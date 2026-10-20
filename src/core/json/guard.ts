/**
 * Structural guard run on every parsed JSON tree before schema validation
 * (setup files, localStorage, catalog). Threat model M-02 / M-27.
 * Iterative (no recursion): a deeply nested 1 MiB document cannot overflow the stack.
 */

/** Keys rejected everywhere: they enable prototype pollution when data is merged or copied. */
export const FORBIDDEN_KEYS: ReadonlySet<string> = new Set([
  "__proto__",
  "constructor",
  "prototype",
]);

export type JsonPath = readonly (string | number)[];

export interface JsonGuardIssue {
  readonly code: "forbiddenKey" | "tooDeep" | "notPlainObject";
  readonly path: JsonPath;
}

interface Node {
  readonly value: unknown;
  readonly depth: number;
  readonly key: string | number | null;
  readonly parent: Node | null;
}

function pathOf(node: Node): (string | number)[] {
  const path: (string | number)[] = [];
  for (let n: Node | null = node; n !== null && n.key !== null; n = n.parent) path.push(n.key);
  return path.reverse();
}

/**
 * Returns the first issue found, or null if the tree only contains plain objects,
 * arrays and primitives, no forbidden key, and no container deeper than `maxDepth`.
 * Objects whose prototype is not `Object.prototype` (or null) are rejected: an object
 * literal `{"__proto__": …}` would hide the key by changing the prototype instead.
 */
export function inspectJsonTree(root: unknown, maxDepth: number): JsonGuardIssue | null {
  const stack: Node[] = [{ value: root, depth: 0, key: null, parent: null }];
  while (stack.length > 0) {
    const node = stack.pop() as Node;
    const { value } = node;
    if (typeof value !== "object" || value === null) continue;
    if (node.depth >= maxDepth) return { code: "tooDeep", path: pathOf(node) };
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        stack.push({ value: value[i], depth: node.depth + 1, key: i, parent: node });
      }
      continue;
    }
    const proto: unknown = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
      return { code: "notPlainObject", path: pathOf(node) };
    }
    for (const key of Object.keys(value)) {
      const child: Node = {
        value: (value as Record<string, unknown>)[key],
        depth: node.depth + 1,
        key,
        parent: node,
      };
      if (FORBIDDEN_KEYS.has(key)) return { code: "forbiddenKey", path: pathOf(child) };
      stack.push(child);
    }
  }
  return null;
}

/** Plain, non-array object (as produced by JSON.parse). */
export function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
