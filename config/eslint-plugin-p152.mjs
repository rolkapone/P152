// Local ESLint rules of the project (ADR-APP-10): no extra dependency, tested by
// tests/unit/lint-rules.test.ts.
import path from "node:path";

const RELATIVE = /^\.{1,2}(\/|$)/;
const LETTERS = /[A-Za-z]/;

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
 * also through a ternary, `&&`, `||`, `??` or a `+` concatenation. Not detected: a constant
 * defined elsewhere (`const M = "Hello"; … {M}`). Other attributes (className…) are free.
 */
const noLiteralText = {
  meta: {
    type: "problem",
    docs: { description: "Visible UI text comes from i18n (ADR-APP-05)." },
    schema: [
      {
        type: "object",
        properties: { textAttributes: { type: "array", items: { type: "string" } } },
        additionalProperties: false,
      },
    ],
    messages: {
      text: "Visible text must come from i18n: use t('key') (ADR-APP-05).",
      accessible: "Accessible text must come from i18n: use t('key') (ADR-APP-05).",
    },
  },
  create(context) {
    const textAttributes = new Set(context.options[0]?.textAttributes ?? []);
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
        if (name === null || !textAttributes.has(name) || !node.value) return;
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
