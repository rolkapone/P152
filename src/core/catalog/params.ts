import { isEnumParam, type ParamDef } from "./schema";

/** True if `value` is allowed by the catalog parameter definition (enum member or in [min, max]). */
export function isValidParamValue(def: ParamDef, value: unknown): boolean {
  if (isEnumParam(def)) return def.enum.some((allowed) => allowed === value);
  return (
    typeof value === "number" && Number.isFinite(value) && value >= def.min && value <= def.max
  );
}

/** Default value of each parameter of a type, in catalog order. */
export function defaultParams(
  params: Readonly<Record<string, ParamDef>>,
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const [key, def] of Object.entries(params)) out[key] = def.default;
  return out;
}
