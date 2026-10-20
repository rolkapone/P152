/** Recursively freezes plain data (objects, arrays, Maps' values are not traversed). */
export function deepFreeze<T>(value: T): T {
  const stack: unknown[] = [value];
  while (stack.length > 0) {
    const current = stack.pop();
    if (typeof current !== "object" || current === null || Object.isFrozen(current)) continue;
    Object.freeze(current);
    for (const child of Object.values(current)) stack.push(child);
  }
  return value;
}
