/** Identifier formats shared by the setup schema and the catalog schema. */

/** Catalog entry id: `<type>.<variant>`, e.g. `desk.rect`, `monitor-arm.generic`. */
export const CATALOG_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Material id, e.g. `mat.soft-touch-black`. */
export const MATERIAL_ID = /^mat\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Style preset id, e.g. `style.all-white`. */
export const STYLE_ID = /^style\.[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** Kebab-case slug: object types, categories, presets, tags, sockets. */
export const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** camelCase key: parameter names, slot ids, material roles. */
export const KEY = /^[a-zA-Z][a-zA-Z0-9]*$/;
/** sRGB hex colour. */
export const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
/** No C0 control characters nor DEL in user-visible strings. */
// eslint-disable-next-line no-control-regex -- intentional: rejects control characters
export const NO_CONTROL_CHARS = /^[^\u0000-\u001f\u007f]*$/;

export const MAX_ID_LENGTH = 64;
export const MAX_KEY_LENGTH = 32;
