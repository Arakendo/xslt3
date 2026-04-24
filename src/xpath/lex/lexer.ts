/**
 * XPath 3.1 lexer.
 *
 * Not yet implemented. Planned as a hand-written, context-aware tokenizer
 * that emits a flat `Token[]`. See docs/ARCHITECTURE.md DEC-004.
 */

export interface Token {
  readonly kind: string;
  readonly value: string;
  readonly offset: number;
  readonly line: number;
  readonly column: number;
}

export function tokenize(_expression: string): readonly Token[] {
  throw new Error('XPath lexer is not yet implemented.');
}
