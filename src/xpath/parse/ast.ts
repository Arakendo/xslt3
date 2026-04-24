/**
 * XPath 3.1 AST node types.
 *
 * Populated as the parser is built. Currently a minimal union so other
 * modules can reference the type.
 */

export type XPathAst =
  | { kind: 'placeholder'; source: string };
