/**
 * XPath 3.1 parser.
 *
 * Recursive-descent for paths/statements, Pratt parsing for expressions.
 * See docs/ARCHITECTURE.md DEC-004.
 */

import type { XPathAst } from './ast.js';

export function parseXPath(_expression: string): XPathAst {
  throw new Error('XPath parser is not yet implemented.');
}
