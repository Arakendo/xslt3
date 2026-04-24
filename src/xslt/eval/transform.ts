/**
 * Transform evaluator: runs a compiled StylesheetIR against an input doc.
 * Not yet implemented.
 */

import type { StylesheetIR } from '../compile/ir.js';
import type { TransformOptions, TransformResult } from '../../processor/types.js';

export function runTransform(
  _ir: StylesheetIR,
  _sourceXml: string,
  _options: TransformOptions,
): TransformResult {
  throw new Error('Transform evaluator is not yet implemented.');
}
