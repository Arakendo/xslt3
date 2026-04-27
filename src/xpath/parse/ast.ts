import type { SourceSpan } from '../lex/lexer.js';

export type XPathAst = BinaryExpression | ContextItemExpression | NumberLiteral | PathExpression;

export type XPathAxis = 'attribute' | 'child' | 'descendant-or-self' | 'self';

export interface BinaryExpression {
  readonly kind: 'binary';
  readonly operator: '+' | '-';
  readonly left: XPathAst;
  readonly right: XPathAst;
  readonly span: SourceSpan;
}

export interface ContextItemExpression {
  readonly kind: 'contextItem';
  readonly span: SourceSpan;
}

export interface KindTest {
  readonly kind: 'kindTest';
  readonly name: 'node' | 'text';
  readonly span: SourceSpan;
}

export interface NameTest {
  readonly kind: 'nameTest';
  readonly name: string;
  readonly span: SourceSpan;
}

export interface NumberLiteral {
  readonly kind: 'number';
  readonly lexeme: string;
  readonly value: number;
  readonly span: SourceSpan;
}

export interface PathExpression {
  readonly kind: 'path';
  readonly absolute: boolean;
  readonly steps: readonly StepExpression[];
  readonly span: SourceSpan;
}

export interface StepExpression {
  readonly kind: 'step';
  readonly axis: XPathAxis;
  readonly nodeTest: KindTest | NameTest;
  readonly predicates: readonly XPathAst[];
  readonly span: SourceSpan;
}
