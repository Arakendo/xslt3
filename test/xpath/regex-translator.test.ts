import { describe, expect, it } from 'vitest';

import { XPathError } from '../../src/errors/XPathError.js';
import {
  XML_NAME_CHAR_CLASS,
  XML_NAME_START_CHAR_CLASS,
  compileRegex,
  toEcmaRegexFlags,
  translateRegexPattern,
  type RegexSpanLike,
} from '../../src/xpath/eval/regex.js';

const TEST_SPAN: RegexSpanLike = {
  line: 1,
  column: 1,
  start: 0,
  endLine: 1,
  endColumn: 1,
  end: 0,
};

describe('XPath regex translator fixtures', () => {
  it('translates the current regex-pattern fixtures to ECMAScript source strings', () => {
    const fixtures = [
      { pattern: 'abc', flags: '', expected: 'abc' },
      { pattern: 'a b c', flags: 'x', expected: 'abc' },
      { pattern: 'a # skip\n b c', flags: 'x', expected: 'abc' },
      { pattern: '[a # ]', flags: 'x', expected: '[a # ]' },
      { pattern: 'a.c', flags: 'q', expected: 'a\\.c' },
      { pattern: 'a b', flags: 'qx', expected: 'a b' },
      { pattern: 'a#b', flags: 'qx', expected: 'a#b' },
      { pattern: '\\i\\c*', flags: '', expected: `[${XML_NAME_START_CHAR_CLASS}][${XML_NAME_CHAR_CLASS}]*` },
      { pattern: '\\I+', flags: '', expected: `[^${XML_NAME_START_CHAR_CLASS}]+` },
      { pattern: '[\\s\\i]*', flags: '', expected: `[\\s${XML_NAME_START_CHAR_CLASS}]*` },
      { pattern: '[\\c\\?a-c\\?]+', flags: '', expected: `[${XML_NAME_CHAR_CLASS}\\?a-c\\?]+` },
      { pattern: '[\\I]+', flags: '', expected: `(?:[^${XML_NAME_START_CHAR_CLASS}])+` },
      { pattern: '[\\C\\?a-c\\?]+', flags: '', expected: `(?:[^${XML_NAME_CHAR_CLASS}]|[\\?]|[a-c]|[\\?])+` },
      { pattern: '[^\\I]+', flags: '', expected: `(?:(?!(?:[^${XML_NAME_START_CHAR_CLASS}]))[\\s\\S])+` },
      { pattern: '[^\\C\\?a-c\\?]+', flags: '', expected: `(?:(?!(?:[^${XML_NAME_CHAR_CLASS}]|[\\?]|[a-c]|[\\?]))[\\s\\S])+` },
      { pattern: '[a-d-[b-c]]+', flags: '', expected: `(?:(?!(?:[b-c]))[a-d])+` },
      { pattern: '[\\d-[357]]+', flags: '', expected: `(?:(?!(?:[357]))[\\d])+` },
      { pattern: '[a-c-[^a-c]]+', flags: '', expected: `(?:(?!(?:(?!(?:[a-c]))[\\s\\S]))[a-c])+` },
      { pattern: '[\\w-[^aeiou]]+', flags: '', expected: `(?:(?!(?:(?!(?:[aeiou]))[\\s\\S]))[\\w])+` },
      { pattern: '[^cde-[ag]]+', flags: '', expected: `(?:(?!(?:(?!(?:[ag]))[cde]))[\\s\\S])+` },
      {
        pattern: '[\\c-[^\\i]]+',
        flags: '',
        expected: `(?:(?!(?:(?!(?:[${XML_NAME_START_CHAR_CLASS}]))[\\s\\S]))[${XML_NAME_CHAR_CLASS}])+`,
      },
      {
        pattern: '[\\i-[^\\c]]+',
        flags: '',
        expected: `(?:(?!(?:(?!(?:[${XML_NAME_CHAR_CLASS}]))[\\s\\S]))[${XML_NAME_START_CHAR_CLASS}])+`,
      },
      {
        pattern: '[\\c-[\\I]]+',
        flags: '',
        expected: `(?:(?!(?:[^${XML_NAME_START_CHAR_CLASS}]))[${XML_NAME_CHAR_CLASS}])+`,
      },
      {
        pattern: '[\\i-[\\C]]+',
        flags: '',
        expected: `(?:(?!(?:[^${XML_NAME_CHAR_CLASS}]))[${XML_NAME_START_CHAR_CLASS}])+`,
      },
      {
        pattern: '[\\c-[\\i\\C]]+',
        flags: '',
        expected: `(?:(?!(?:[${XML_NAME_START_CHAR_CLASS}]|[^${XML_NAME_CHAR_CLASS}]))[${XML_NAME_CHAR_CLASS}])+`,
      },
      {
        pattern: '[\\i-[\\c\\I]]+',
        flags: '',
        expected: `(?:(?!(?:[${XML_NAME_CHAR_CLASS}]|[^${XML_NAME_START_CHAR_CLASS}]))[${XML_NAME_START_CHAR_CLASS}])+`,
      },
      {
        pattern: '[^\\c-[\\i\\C]]+',
        flags: '',
        expected: `(?:(?!(?:(?!(?:[${XML_NAME_START_CHAR_CLASS}]|[^${XML_NAME_CHAR_CLASS}]))[${XML_NAME_CHAR_CLASS}]))[\\s\\S])+`,
      },
      {
        pattern: '[^\\i-[\\c\\I]]+',
        flags: '',
        expected: `(?:(?!(?:(?!(?:[${XML_NAME_CHAR_CLASS}]|[^${XML_NAME_START_CHAR_CLASS}]))[${XML_NAME_START_CHAR_CLASS}]))[\\s\\S])+`,
      },
    ] as const;

    for (const fixture of fixtures) {
      expect(translateRegexPattern(fixture.pattern, fixture.flags)).toBe(fixture.expected);
    }
  });

  it('translates the current regex flag fixtures to ECMAScript flags', () => {
    const fixtures = [
      { flags: '', global: false, pattern: undefined, expected: '' },
      { flags: 'i', global: false, pattern: undefined, expected: 'i' },
      { flags: 'im', global: true, pattern: undefined, expected: 'gim' },
      { flags: 'qx', global: false, pattern: undefined, expected: '' },
      { flags: 'sxi', global: true, pattern: undefined, expected: 'gsi' },
      { flags: '', global: false, pattern: `[${XML_NAME_START_CHAR_CLASS}]`, expected: 'u' },
    ] as const;

    for (const fixture of fixtures) {
      expect(toEcmaRegexFlags(fixture.flags, TEST_SPAN, fixture.global, fixture.pattern)).toBe(fixture.expected);
    }
  });

  it('compiles XML name escapes into working ECMAScript regexes', () => {
    expect(compileRegex('\\i\\c*', '', TEST_SPAN).test('_:alpha')).toBe(true);
    expect(compileRegex('\\i+', '', TEST_SPAN).test('1.0')).toBe(false);
    expect(compileRegex('\\I+', '', TEST_SPAN).test('1.0')).toBe(true);
    expect(compileRegex('\\c+', '', TEST_SPAN).test('abc')).toBe(true);
    expect(compileRegex('\\C+', '', TEST_SPAN).test(' \t')).toBe(true);
    expect(compileRegex('^[\\s\\i]*$', '', TEST_SPAN).test('a b  Z:_')).toBe(true);
    expect(compileRegex('^[\\s\\i]*$', '', TEST_SPAN).test('1')).toBe(false);
    expect(compileRegex('^[\\I]+$', '', TEST_SPAN).test('1.0')).toBe(true);
    expect(compileRegex('^[\\I]+$', '', TEST_SPAN).test('_')).toBe(false);
    expect(compileRegex('^[\\C\\?a-c\\?]+$', '', TEST_SPAN).test('?a?')).toBe(true);
    expect(compileRegex('^[\\C\\?a-c\\?]+$', '', TEST_SPAN).test('?d?')).toBe(false);
    expect(compileRegex('^[^\\I]+$', '', TEST_SPAN).test('_')).toBe(true);
    expect(compileRegex('^[^\\I]+$', '', TEST_SPAN).test('1')).toBe(false);
    expect(compileRegex('^[^\\C\\?a-c\\?]+$', '', TEST_SPAN).test('_')).toBe(true);
    expect(compileRegex('^[^\\C\\?a-c\\?]+$', '', TEST_SPAN).test('?')).toBe(false);
    expect(compileRegex('^[a-d-[b-c]]+$', '', TEST_SPAN).test('ad')).toBe(true);
    expect(compileRegex('^[a-d-[b-c]]+$', '', TEST_SPAN).test('b')).toBe(false);
    expect(compileRegex('^[\\d-[357]]+$', '', TEST_SPAN).test('24680')).toBe(true);
    expect(compileRegex('^[\\d-[357]]+$', '', TEST_SPAN).test('357')).toBe(false);
    expect(compileRegex('^[a-c-[^a-c]]+$', '', TEST_SPAN).test('abc')).toBe(true);
    expect(compileRegex('^[a-c-[^a-c]]+$', '', TEST_SPAN).test('d')).toBe(false);
    expect(compileRegex('^m[\\w-[^aeiou]][\\w-[^aeiou]]t$', '', TEST_SPAN).test('meet')).toBe(true);
    expect(compileRegex('^m[\\w-[^aeiou]][\\w-[^aeiou]]t$', '', TEST_SPAN).test('mbbt')).toBe(false);
    expect(compileRegex('^[^cde-[ag]]+$', '', TEST_SPAN).test('bfxyz')).toBe(true);
    expect(compileRegex('^[^cde-[ag]]+$', '', TEST_SPAN).test('d')).toBe(false);
    expect(compileRegex('^[\\c-[^\\i]]+$', '', TEST_SPAN).test('_:alpha')).toBe(true);
    expect(compileRegex('^[\\c-[^\\i]]+$', '', TEST_SPAN).test('1')).toBe(false);
    expect(compileRegex('^[\\i-[^\\c]]+$', '', TEST_SPAN).test('_')).toBe(true);
    expect(compileRegex('^[\\i-[^\\c]]+$', '', TEST_SPAN).test('1')).toBe(false);
    expect(compileRegex('^[\\c-[\\I]]+$', '', TEST_SPAN).test('_:alpha')).toBe(true);
    expect(compileRegex('^[\\c-[\\I]]+$', '', TEST_SPAN).test('a1')).toBe(false);
    expect(compileRegex('^[\\i-[\\C]]+$', '', TEST_SPAN).test('_:alpha')).toBe(true);
    expect(compileRegex('^[\\i-[\\C]]+$', '', TEST_SPAN).test('a1')).toBe(false);
    expect(compileRegex('^[\\c-[\\i\\C]]+$', '', TEST_SPAN).test('1.-')).toBe(true);
    expect(compileRegex('^[\\c-[\\i\\C]]+$', '', TEST_SPAN).test('_')).toBe(false);
    expect(compileRegex('^[\\i-[\\c\\I]]+$', '', TEST_SPAN).test('_')).toBe(false);
    expect(compileRegex('^[\\i-[\\c\\I]]+$', '', TEST_SPAN).test(':')).toBe(false);
    expect(compileRegex('^[^\\c-[\\i\\C]]+$', '', TEST_SPAN).test('_:alpha')).toBe(true);
    expect(compileRegex('^[^\\c-[\\i\\C]]+$', '', TEST_SPAN).test('1.-')).toBe(false);
    expect(compileRegex('^[^\\i-[\\c\\I]]+$', '', TEST_SPAN).test('_:alpha')).toBe(true);
    expect(compileRegex('^[^\\i-[\\c\\I]]+$', '', TEST_SPAN).test('1.-')).toBe(true);
  });

  it('raises FOCA0002 for unsupported regex flags in the translator fixture suite', () => {
    let thrown: unknown;

    try {
      toEcmaRegexFlags('z', TEST_SPAN);
    } catch (error) {
      thrown = error;
    }

    expect(thrown).toBeInstanceOf(XPathError);
    expect(thrown).toMatchObject({ code: 'FOCA0002' });
  });
});