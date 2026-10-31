// Local ESLint rules of the project (ADR-APP-10): no extra dependency, tested by
// tests/unit/lint-rules.test.ts.
import path from "node:path";

const RELATIVE = /^\.{1,2}(\/|$)/;
// Any letter of any script (accented Latin, Greek, CJK…), not only ASCII.
const LETTERS = /\p{L}/u;
// String methods whose result is built from the receiver (and the arguments for concat).
const STRING_METHODS = new Set([
  "concat",
  "join",
  "padEnd",
  "padStart",
  "repeat",
  "replace",
  "replaceAll",
  "toLowerCase",
  "toUpperCase",
  "trim",
  "trimEnd",
  "trimStart",
]);

/**
 * core/ relative imports must resolve inside src/core (and inside the extra folders of
 * `allowOutside`, e.g. tests/ for the shared fixtures of core/ tests). The check is made on
 * the resolved path, so `from ".."` is accepted when it stays in core/ and refused when it
 * leaves it, whatever the spelling (`./../..`, `catalog/../..`).
 */
const coreRelativeImports = {
  meta: {
    type: "problem",
    docs: { description: "core/ relative imports stay inside core/ (ADR-APP-07)." },
    schema: [
      {
        type: "object",
        properties: { allowOutside: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: { outside: "core/ imports only core/ modules (ADR-APP-07)." },
  },
  create(context) {
    const cwd = context.cwd;
    const options = context.options[0] ?? {};
    const roots = ["src/core", ...(options.allowOutside ?? [])].map((dir) =>
      path.resolve(cwd, dir),
    );
    const inside = (target) =>
      roots.some((root) => target === root || target.startsWith(root + path.sep));
    const check = (node) => {
      const source = node.source;
      if (!source || typeof source.value !== "string" || !RELATIVE.test(source.value)) return;
      const target = path.resolve(path.dirname(context.filename), source.value);
      if (!inside(target)) context.report({ node: source, messageId: "outside" });
    };
    return { ImportDeclaration: check, ExportNamedDeclaration: check, ExportAllDeclaration: check };
  },
};

/** Values a function may return: its expression body, or its top-level `return` statements. */
function returnedNodes(fn) {
  if (fn.body.type !== "BlockStatement") return textNodes(fn.body);
  return fn.body.body
    .filter((statement) => statement.type === "ReturnStatement")
    .flatMap((statement) => textNodes(statement.argument));
}

const isFunction = (node) =>
  node?.type === "ArrowFunctionExpression" || node?.type === "FunctionExpression";

/**
 * Text reachable through a call: the result of a callback (`xs.map(() => "Item")`), of an
 * IIFE, of `String("x")`, and of string methods on a literal (`"a".concat(b)`,
 * `["a", "b"].join()`). Plain literal arguments are not text (`t("key")`, `f("id")`).
 */
function callTextNodes(node) {
  const callee = node.callee;
  const fromCallbacks = node.arguments.filter(isFunction).flatMap(returnedNodes);
  if (isFunction(callee)) return [...returnedNodes(callee), ...fromCallbacks];
  if (callee.type === "Identifier" && callee.name === "String") {
    return [...node.arguments.flatMap(textNodes), ...fromCallbacks];
  }
  if (
    callee.type === "MemberExpression" &&
    !callee.computed &&
    STRING_METHODS.has(callee.property.name)
  ) {
    const args = callee.property.name === "concat" ? node.arguments.flatMap(textNodes) : [];
    return [...textNodes(callee.object), ...args, ...fromCallbacks];
  }
  return fromCallbacks;
}

/** Text-bearing expressions reachable from `node` (values the expression may render). */
function textNodes(node) {
  if (!node) return [];
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" && LETTERS.test(node.value) ? [node] : [];
    case "TemplateLiteral":
      return node.quasis.some((quasi) => LETTERS.test(quasi.value.raw))
        ? [node]
        : node.expressions.flatMap(textNodes);
    case "ConditionalExpression":
      return [...textNodes(node.consequent), ...textNodes(node.alternate)];
    case "LogicalExpression":
      // `c && "x"` renders the right side only; `a || "x"` and `a ?? "x"` render either side.
      return node.operator === "&&"
        ? textNodes(node.right)
        : [...textNodes(node.left), ...textNodes(node.right)];
    case "BinaryExpression":
      return node.operator === "+" ? [...textNodes(node.left), ...textNodes(node.right)] : [];
    case "ArrayExpression":
      return node.elements.flatMap((element) =>
        element?.type === "SpreadElement" ? textNodes(element.argument) : textNodes(element),
      );
    case "CallExpression":
      return callTextNodes(node);
    case "TaggedTemplateExpression":
      return textNodes(node.quasi);
    case "ArrowFunctionExpression":
    case "FunctionExpression":
      // A render prop (`{(state) => "Open"}`) renders what it returns.
      return returnedNodes(node);
    case "SequenceExpression":
      return textNodes(node.expressions.at(-1));
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
    case "ParenthesizedExpression":
      return textNodes(node.expression);
    default:
      return [];
  }
}

/**
 * Visible and accessible text goes through i18n (ADR-APP-05): JSX text, and string or
 * template literals rendered as an element child or as a text attribute (alt, aria-label…),
 * also through a ternary, `&&`, `||`, `??`, a `+` concatenation, an array, a callback or a
 * string method. On a component (`<Panel>`, `<Aria.Tab>`), the text props of
 * `componentTextProps` are checked too, with their suffixed forms (`label` → `toggleLabel`).
 * Not detected: a constant defined elsewhere (`const M = "Hello"; … {M}`). Other attributes
 * (className…) are free.
 */
const noLiteralText = {
  meta: {
    type: "problem",
    docs: { description: "Visible UI text comes from i18n (ADR-APP-05)." },
    schema: [
      {
        type: "object",
        properties: {
          textAttributes: { type: "array", items: { type: "string" } },
          componentTextProps: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      text: "Visible text must come from i18n: use t('key') (ADR-APP-05).",
      accessible: "Accessible text must come from i18n: use t('key') (ADR-APP-05).",
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const textAttributes = new Set(options.textAttributes ?? []);
    const componentProps = options.componentTextProps ?? [];
    const suffixes = componentProps.map((prop) => prop[0].toUpperCase() + prop.slice(1));
    const isComponentTextProp = (name) =>
      componentProps.includes(name) ||
      suffixes.some((suffix) => name.endsWith(suffix) && /^[a-z]/.test(name));
    // <Panel>, <Aria.Tab>: an upper-case or dotted name is a component, not a DOM element.
    const isComponent = (opening) =>
      opening.name.type === "JSXMemberExpression" ||
      (opening.name.type === "JSXIdentifier" && /^[A-Z]/.test(opening.name.name));
    const report = (nodes, messageId) => {
      for (const node of nodes) context.report({ node, messageId });
    };
    const isElement = (node) => node?.type === "JSXElement" || node?.type === "JSXFragment";
    return {
      JSXText(node) {
        if (LETTERS.test(node.value)) context.report({ node, messageId: "text" });
      },
      JSXExpressionContainer(node) {
        if (isElement(node.parent)) report(textNodes(node.expression), "text");
      },
      JSXAttribute(node) {
        const name = typeof node.name.name === "string" ? node.name.name : null;
        if (name === null || !node.value) return;
        const isText =
          textAttributes.has(name) || (isComponent(node.parent) && isComponentTextProp(name));
        if (!isText) return;
        const value =
          node.value.type === "JSXExpressionContainer" ? node.value.expression : node.value;
        report(textNodes(value), "accessible");
      },
    };
  },
};

export default {
  meta: { name: "p152" },
  rules: { "core-relative-imports": coreRelativeImports, "no-literal-text": noLiteralText },
};
