/**
 * XPath evaluator.
 *
 * Walks a parsed XPath AST and produces an XDM sequence given a dynamic
 * context. Not yet implemented.
 */

import type { XPathAst } from '../parse/ast.js';
import type { XdmSequence } from '../../xdm/types.js';
import type { DynamicContext } from './context.js';

export function evaluate(_ast: XPathAst, _context: DynamicContext): XdmSequence {
  throw new Error('XPath evaluator is not yet implemented.');
}
