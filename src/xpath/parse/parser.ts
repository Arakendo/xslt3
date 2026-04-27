/**
 * XPath 3.1 parser.
 *
 * Recursive-descent for paths/statements, Pratt parsing for expressions.
 * See docs/ARCHITECTURE.md DEC-004.
 */

import { XPST0003 } from '../../errors/codes.js';
import { XPathError } from '../../errors/XPathError.js';
import { tokenize, type SourceSpan, type Token, type TokenKind } from '../lex/lexer.js';
import type {
  ContextItemExpression,
  KindTest,
  NameTest,
  NumberLiteral,
  PathExpression,
  StepExpression,
  XPathAst,
  XPathAxis,
} from './ast.js';

export function parseXPath(expression: string): XPathAst {
  const parser = new Parser(tokenize(expression));
  const ast = parser.parseExpression();
  parser.expect('eof', 'Expected the end of the XPath expression.');
  return ast;
}

class Parser {
  readonly tokens: readonly Token[];
  index = 0;

  constructor(tokens: readonly Token[]) {
    this.tokens = tokens;
  }

  parseExpression(): XPathAst {
    return this.parseAdditiveExpression();
  }

  current(): Token {
    return this.tokens[this.index] ?? this.tokens[this.tokens.length - 1]!;
  }

  expect(kind: TokenKind, message: string): Token {
    const token = this.current();
    if (token.kind !== kind) {
      throw new XPathError(XPST0003, message, {
        line: token.span.line,
        column: token.span.column,
        offset: token.span.start,
      });
    }
    this.index += 1;
    return token;
  }

  match(kind: TokenKind): Token | undefined {
    const token = this.current();
    if (token.kind !== kind) {
      return undefined;
    }
    this.index += 1;
    return token;
  }

  peek(offset = 1): Token {
    return this.tokens[this.index + offset] ?? this.tokens[this.tokens.length - 1]!;
  }

  private parseAdditiveExpression(): XPathAst {
    let expression = this.parsePrimaryExpression();

    while (true) {
      const operatorToken = this.match('plus') ?? this.match('minus');
      if (operatorToken === undefined) {
        return expression;
      }

      const right = this.parsePrimaryExpression();
      expression = {
        kind: 'binary',
        operator: operatorToken.kind === 'plus' ? '+' : '-',
        left: expression,
        right,
        span: mergeSpans(expression.span, right.span),
      };
    }
  }

  private parsePrimaryExpression(): XPathAst {
    const token = this.current();

    switch (token.kind) {
      case 'number':
        return this.parseNumberLiteral();
      case 'dot':
      case 'slash':
      case 'slashSlash':
      case 'at':
      case 'name':
        return this.parsePathExpression();
      default:
        throw new XPathError(XPST0003, `Unexpected token ${JSON.stringify(token.value)}.`, {
          line: token.span.line,
          column: token.span.column,
          offset: token.span.start,
        });
    }
  }

  private parseNumberLiteral(): NumberLiteral {
    const token = this.expect('number', 'Expected a numeric literal.');
    return {
      kind: 'number',
      lexeme: token.value,
      value: Number(token.value),
      span: token.span,
    };
  }

  private parsePathExpression(): PathExpression {
    const startToken = this.current();
    const steps: StepExpression[] = [];
    let absolute = false;

    if (this.match('slashSlash') !== undefined) {
      absolute = true;
      steps.push(createSyntheticDescendantOrSelfStep(startToken.span));
      steps.push(this.parseStepExpression());
    } else if (this.match('slash') !== undefined) {
      absolute = true;
      steps.push(this.parseStepExpression());
    } else {
      steps.push(this.parseStepExpression());
    }

    while (true) {
      const slashToken = this.match('slashSlash') ?? this.match('slash');
      if (slashToken === undefined) {
        break;
      }
      if (slashToken.kind === 'slashSlash') {
        steps.push(createSyntheticDescendantOrSelfStep(slashToken.span));
      }
      steps.push(this.parseStepExpression());
    }

    const endSpan = steps[steps.length - 1]?.span ?? startToken.span;
    return {
      kind: 'path',
      absolute,
      steps,
      span: mergeSpans(startToken.span, endSpan),
    };
  }

  private parseStepExpression(): StepExpression {
    const startToken = this.current();

    if (this.match('dot') !== undefined) {
      const contextItem: ContextItemExpression = { kind: 'contextItem', span: startToken.span };
      return {
        kind: 'step',
        axis: 'self',
        nodeTest: { kind: 'kindTest', name: 'node', span: startToken.span },
        predicates: [contextItem],
        span: startToken.span,
      };
    }

    let axis: XPathAxis = 'child';
    if (this.match('at') !== undefined) {
      axis = 'attribute';
    } else if (this.current().kind === 'name' && this.peek().kind === 'doubleColon') {
      const axisToken = this.expect('name', 'Expected an axis name.');
      this.expect('doubleColon', 'Expected :: after the axis name.');
      axis = parseAxisName(axisToken);
    }

    const nodeTest = this.parseNodeTest();
    const predicates: XPathAst[] = [];
    let span = mergeSpans(startToken.span, nodeTest.span);

    while (this.match('leftBracket') !== undefined) {
      const predicate = this.parseExpression();
      const rightBracket = this.expect('rightBracket', 'Expected ] to close the predicate.');
      predicates.push(predicate);
      span = mergeSpans(startToken.span, rightBracket.span);
    }

    return {
      kind: 'step',
      axis,
      nodeTest,
      predicates,
      span,
    };
  }

  private parseNodeTest(): KindTest | NameTest {
    const token = this.expect('name', 'Expected a node test.');
    if (this.match('leftParen') === undefined) {
      return {
        kind: 'nameTest',
        name: token.value,
        span: token.span,
      };
    }

    const rightParen = this.expect('rightParen', 'Expected ) to close the node test.');
    if (token.value !== 'node' && token.value !== 'text') {
      throw new XPathError(XPST0003, `Unsupported kind test ${JSON.stringify(token.value)}.`, {
        line: token.span.line,
        column: token.span.column,
        offset: token.span.start,
      });
    }

    return {
      kind: 'kindTest',
      name: token.value,
      span: mergeSpans(token.span, rightParen.span),
    };
  }
}

function createSyntheticDescendantOrSelfStep(span: SourceSpan): StepExpression {
  return {
    kind: 'step',
    axis: 'descendant-or-self',
    nodeTest: { kind: 'kindTest', name: 'node', span },
    predicates: [],
    span,
  };
}

function parseAxisName(token: Token): XPathAxis {
  if (token.value === 'child' || token.value === 'descendant-or-self' || token.value === 'self') {
    return token.value;
  }
  if (token.value === 'attribute') {
    return 'attribute';
  }

  throw new XPathError(XPST0003, `Unsupported axis ${JSON.stringify(token.value)}.`, {
    line: token.span.line,
    column: token.span.column,
    offset: token.span.start,
  });
}

function mergeSpans(start: SourceSpan, end: SourceSpan): SourceSpan {
  return {
    start: start.start,
    end: end.end,
    line: start.line,
    column: start.column,
    endLine: end.endLine,
    endColumn: end.endColumn,
  };
}
