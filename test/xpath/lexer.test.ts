import { describe, expect, it } from 'vitest';

import { XPathError } from '../../src/errors/XPathError.js';
import { tokenize } from '../../src/xpath/lex/lexer.js';

describe('XPath lexer', () => {
  it('tokenizes arithmetic with stable positions', () => {
    const tokens = tokenize('1 + 2');

    expect(tokens.map((token) => token.kind)).toEqual(['number', 'plus', 'number', 'eof']);
    expect(tokens[0]).toMatchObject({
      value: '1',
      span: { start: 0, end: 1, line: 1, column: 1, endLine: 1, endColumn: 2 },
    });
    expect(tokens[1]).toMatchObject({
      value: '+',
      span: { start: 2, end: 3, line: 1, column: 3, endLine: 1, endColumn: 4 },
    });
    expect(tokens[2]).toMatchObject({
      value: '2',
      span: { start: 4, end: 5, line: 1, column: 5, endLine: 1, endColumn: 6 },
    });
  });

  it('tokenizes abbreviated path syntax for the MVP+1 examples', () => {
    const tokens = tokenize('//foo/bar[1]');

    expect(tokens.map((token) => token.kind)).toEqual([
      'slashSlash',
      'name',
      'slash',
      'name',
      'leftBracket',
      'number',
      'rightBracket',
      'eof',
    ]);
    expect(tokens[0]).toMatchObject({
      value: '//',
      span: { line: 1, column: 1, endColumn: 3 },
    });
    expect(tokens[1]).toMatchObject({
      value: 'foo',
      span: { line: 1, column: 3, endColumn: 6 },
    });
    expect(tokens[3]).toMatchObject({
      value: 'bar',
      span: { line: 1, column: 7, endColumn: 10 },
    });
  });

  it('tokenizes axis syntax and node tests without special-casing the parser yet', () => {
    const tokens = tokenize('descendant-or-self::node()');

    expect(tokens.map((token) => token.kind)).toEqual([
      'name',
      'doubleColon',
      'name',
      'leftParen',
      'rightParen',
      'eof',
    ]);
    expect(tokens[0]).toMatchObject({
      value: 'descendant-or-self',
      span: { line: 1, column: 1, endColumn: 19 },
    });
  });

  it('throws an XPathError with a location for unexpected characters', () => {
    let thrown: unknown;

    try {
      tokenize('foo ? bar');
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(XPathError);
    expect(thrown).toMatchObject({
      message: '[XPST0003] Unexpected character "?".',
      location: { line: 1, column: 5, offset: 4 },
    });
  });
});