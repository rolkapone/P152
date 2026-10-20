/** Hard limits of the setup document (ADR-3D-02, ADR-APP-03, threat model M-01/M-04). */

export const SETUP_FORMAT = "p152.setup";
export const CURRENT_SCHEMA_VERSION = 1;
export const MIN_SUPPORTED_SCHEMA_VERSION = 1;

/** 1 MiB, checked on the declared file size before reading, then on the UTF-8 length. */
export const MAX_SETUP_BYTES = 1024 * 1024;
export const MAX_OBJECTS = 50;
export const MAX_NAME_LENGTH = 80;
/** Legitimate setups are 5 levels deep at most; `extensions` content is bounded by this. */
export const MAX_JSON_DEPTH = 16;
export const MAX_PARAMS = 24;
export const MAX_MATERIAL_OVERRIDES = 8;
export const MAX_EXTENSION_KEYS = 32;
export const MAX_PARAM_STRING_LENGTH = 32;
/** Object position in the desk-top frame, mm. Objects may overhang (overflow alerts). */
export const MAX_COORDINATE_MM = 10_000;
/** Raw numeric parameter magnitude before the catalog bounds are applied. */
export const MAX_PARAM_MAGNITUDE = 1_000_000;
