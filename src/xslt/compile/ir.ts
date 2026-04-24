/**
 * XSLT stylesheet intermediate representation.
 *
 * The compiler lowers the stylesheet DOM into this plain-data tree so the
 * evaluator never walks the stylesheet DOM at runtime. See DEC-005.
 *
 * Currently just the root shape — instruction kinds will be added.
 */

import type { XPathAst } from '../../xpath/parse/ast.js';

export interface StylesheetIR {
  readonly version: '3.0';
  readonly templates: readonly TemplateRule[];
}

export interface TemplateRule {
  /** Match pattern, pre-parsed. Undefined for named-only templates. */
  readonly match?: XPathAst;
  /** Template name in Clark notation, if any. */
  readonly name?: string;
  /** Mode set; empty = default (unnamed) mode. */
  readonly modes: readonly string[];
  /** Priority; undefined means compute from pattern. */
  readonly priority?: number;
  /** Sequence of instructions to evaluate. */
  readonly body: readonly Instruction[];
}

export type Instruction =
  | { readonly kind: 'placeholder' };
