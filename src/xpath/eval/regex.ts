import { FOCA0002 } from '../../errors/codes.js';
import { XPathError } from '../../errors/XPathError.js';

export const XML_NAME_START_CHAR_CLASS = ':A-Z_a-z\\xC0-\\xD6\\xD8-\\xF6\\xF8-\\u02FF\\u0370-\\u037D\\u037F-\\u1FFF\\u200C-\\u200D\\u2070-\\u218F\\u2C00-\\u2FEF\\u3001-\\uD7FF\\uF900-\\uFDCF\\uFDF0-\\uFFFD\\u{10000}-\\u{EFFFF}';

export const XML_NAME_CHAR_CLASS = `${XML_NAME_START_CHAR_CLASS}\\-.0-9\\xB7\\u0300-\\u036F\\u203F-\\u2040`;

export type RegexSpanLike = {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly end: number;
};

export function compileRegex(pattern: string, flags: string, span: RegexSpanLike, global = false): RegExp {
  const translatedPattern = translateRegexPattern(pattern, flags);
  const ecmaFlags = toEcmaRegexFlags(flags, span, global, translatedPattern);
  try {
    return new RegExp(translatedPattern, ecmaFlags);
  } catch {
    throw createRegexError(FOCA0002, 'Invalid regular expression for the current ECMAScript-compatible regex slice.', span);
  }
}

export function toEcmaRegexFlags(flags: string, span: RegexSpanLike, global = false, translatedPattern?: string): string {
  let result = global ? 'g' : '';

  for (const flag of flags) {
    if (flag === 'i' || flag === 'm' || flag === 's') {
      if (!result.includes(flag)) {
        result += flag;
      }
      continue;
    }

    if (flag === 'q' || flag === 'x') {
      continue;
    }

    throw createRegexError(
      FOCA0002,
      `Unsupported regular expression flag ${flag} in the current ECMAScript-compatible regex slice.`,
      span,
    );
  }

  if (translatedPattern?.includes('\\u{') && !result.includes('u')) {
    result += 'u';
  }

  return result;
}

export function translateRegexPattern(pattern: string, flags: string): string {
  if (flags.includes('q')) {
    return escapeRegexLiteral(pattern);
  }

  let translated = translateXmlNameEscapes(pattern);

  if (flags.includes('x')) {
    translated = stripExpandedWhitespace(translated);
  }

  return translated;
}

function escapeRegexLiteral(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripExpandedWhitespace(pattern: string): string {
  let result = '';
  let inCharacterClass = false;
  let escaped = false;
  let inComment = false;

  for (const char of pattern) {
    if (inComment) {
      if (char === '\n' || char === '\r') {
        inComment = false;
      }
      continue;
    }

    if (escaped) {
      result += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escaped = true;
      continue;
    }

    if (char === '[' && !inCharacterClass) {
      inCharacterClass = true;
      result += char;
      continue;
    }

    if (char === ']' && inCharacterClass) {
      inCharacterClass = false;
      result += char;
      continue;
    }

    if (!inCharacterClass && /\s/.test(char)) {
      continue;
    }

    if (!inCharacterClass && char === '#') {
      inComment = true;
      continue;
    }

    result += char;
  }

  return result;
}

function translateXmlNameEscapes(pattern: string): string {
  let result = '';
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]!;

    if (char === '[') {
      const translatedClass = translateCharacterClass(pattern, index);
      result += translatedClass.source;
      index = translatedClass.endIndex;
      continue;
    }

    if (char === '\\') {
      const next = pattern[index + 1];
      if (next === undefined) {
        result += '\\';
        continue;
      }

      if (next === 'i' || next === 'I' || next === 'c' || next === 'C') {
        result += translateXmlNameEscape(next);
      } else {
        result += `\\${next}`;
      }
      index += 1;
      continue;
    }

    result += char;
  }

  return result;
}

function translateCharacterClass(pattern: string, startIndex: number): { source: string; endIndex: number } {
  let index = startIndex + 1;
  let escaped = false;
  let nestedCharacterClassDepth = 0;

  while (index < pattern.length) {
    const char = pattern[index]!;
    if (escaped) {
      escaped = false;
      index += 1;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      index += 1;
      continue;
    }

    if (char === '[') {
      nestedCharacterClassDepth += 1;
      index += 1;
      continue;
    }

    if (char === ']') {
      if (nestedCharacterClassDepth === 0) {
        break;
      }

      nestedCharacterClassDepth -= 1;
      index += 1;
      continue;
    }

    index += 1;
  }

  if (index >= pattern.length || pattern[index] !== ']') {
    return {
      source: pattern.slice(startIndex),
      endIndex: pattern.length - 1,
    };
  }

  const content = pattern.slice(startIndex + 1, index);
  return {
    source: translateCharacterClassContent(content),
    endIndex: index,
  };
}

function translateCharacterClassContent(content: string): string {
  const outerNegated = content.startsWith('^');
  const body = outerNegated ? content.slice(1) : content;
  const subtraction = splitTopLevelCharacterClassSubtraction(body);

  if (subtraction !== undefined) {
    const basePattern = translateCharacterClassContent(subtraction.base);
    const subtractPattern = translateCharacterClassContent(subtraction.subtract);
    const subtractedPattern = subtractSingleCharacterPattern(basePattern, subtractPattern);
    return outerNegated ? complementSingleCharacterPattern(subtractedPattern) : subtractedPattern;
  }

  return outerNegated
    ? complementSingleCharacterPattern(translateSimpleCharacterClass(body))
    : translateSimpleCharacterClass(body);
}

function translateSimpleCharacterClass(content: string): string {
  const terms = tokenizeCharacterClassTerms(content);
  const hasComplementXmlEscape = terms.some((term) => term.kind === 'xml-complement');

  if (!hasComplementXmlEscape) {
    const translatedBody = terms.map((term) => characterClassTermToClassBody(term)).join('');
    return `[${translatedBody}]`;
  }

  const translatedTerms = terms.map((term) => characterClassTermToAlternationAtom(term));
  return `(?:${translatedTerms.join('|')})`;
}

function splitTopLevelCharacterClassSubtraction(content: string):
  | { base: string; subtract: string }
  | undefined {
  let escaped = false;
  let nestedCharacterClassDepth = 0;

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]!;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '[') {
      nestedCharacterClassDepth += 1;
      continue;
    }

    if (char === ']') {
      if (nestedCharacterClassDepth > 0) {
        nestedCharacterClassDepth -= 1;
      }
      continue;
    }

    if (char !== '-' || nestedCharacterClassDepth !== 0 || content[index + 1] !== '[') {
      continue;
    }

    const nestedRange = findMatchingCharacterClassRange(content, index + 1);
    if (nestedRange === undefined || nestedRange.endIndex !== content.length - 1) {
      continue;
    }

    return {
      base: content.slice(0, index),
      subtract: nestedRange.content,
    };
  }

  return undefined;
}

function findMatchingCharacterClassRange(content: string, startIndex: number):
  | { content: string; endIndex: number }
  | undefined {
  let escaped = false;
  let nestedCharacterClassDepth = 0;

  for (let index = startIndex + 1; index < content.length; index += 1) {
    const char = content[index]!;

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === '\\') {
      escaped = true;
      continue;
    }

    if (char === '[') {
      nestedCharacterClassDepth += 1;
      continue;
    }

    if (char === ']') {
      if (nestedCharacterClassDepth === 0) {
        return {
          content: content.slice(startIndex + 1, index),
          endIndex: index,
        };
      }

      nestedCharacterClassDepth -= 1;
    }
  }

  return undefined;
}

function subtractSingleCharacterPattern(basePattern: string, subtractPattern: string): string {
  return `(?:(?!${toLookaheadPattern(subtractPattern)})${basePattern})`;
}

function complementSingleCharacterPattern(pattern: string): string {
  return `(?:(?!${toLookaheadPattern(pattern)})[\\s\\S])`;
}

function toLookaheadPattern(pattern: string): string {
  return pattern.startsWith('(?:') && pattern.endsWith(')') ? pattern : `(?:${pattern})`;
}

type CharacterClassTerm =
  | { kind: 'raw'; raw: string }
  | { kind: 'xml-positive'; escape: 'i' | 'c' }
  | { kind: 'xml-complement'; escape: 'I' | 'C' };

function tokenizeCharacterClassTerms(content: string): CharacterClassTerm[] {
  const rawTokens: string[] = [];

  for (let index = 0; index < content.length; index += 1) {
    const char = content[index]!;
    if (char === '\\' && index + 1 < content.length) {
      rawTokens.push(`\\${content[index + 1]!}`);
      index += 1;
      continue;
    }

    rawTokens.push(char);
  }

  const combinedTokens: string[] = [];
  for (let index = 0; index < rawTokens.length; index += 1) {
    const current = rawTokens[index]!;
    const next = rawTokens[index + 1];
    const afterNext = rawTokens[index + 2];
    if (next === '-' && afterNext !== undefined && canFormCharacterClassRange(current, afterNext)) {
      combinedTokens.push(`${current}-${afterNext}`);
      index += 2;
      continue;
    }

    combinedTokens.push(current);
  }

  return combinedTokens.map((token) => {
    if (token === '\\i' || token === '\\c') {
      return { kind: 'xml-positive', escape: token[1]! as 'i' | 'c' };
    }
    if (token === '\\I' || token === '\\C') {
      return { kind: 'xml-complement', escape: token[1]! as 'I' | 'C' };
    }
    return { kind: 'raw', raw: token };
  });
}

function canFormCharacterClassRange(start: string, end: string): boolean {
  return start.length === 1 && end.length === 1;
}

function characterClassTermToClassBody(term: CharacterClassTerm): string {
  switch (term.kind) {
    case 'raw':
      return term.raw;
    case 'xml-positive':
      return translateXmlNameEscapeInCharacterClass(term.escape);
    case 'xml-complement':
      return translateXmlNameEscape(term.escape);
  }
}

function characterClassTermToAlternationAtom(term: CharacterClassTerm): string {
  switch (term.kind) {
    case 'xml-positive':
      return `[${translateXmlNameEscapeInCharacterClass(term.escape)}]`;
    case 'xml-complement':
      return term.escape === 'I'
        ? `[^${XML_NAME_START_CHAR_CLASS}]`
        : `[^${XML_NAME_CHAR_CLASS}]`;
    case 'raw':
      return `[${toGeneratedCharacterClassSource(term.raw)}]`;
  }
}

function toGeneratedCharacterClassSource(raw: string): string {
  if (raw.length === 1) {
    return escapeGeneratedCharacterClassLiteral(raw);
  }

  if (raw.length === 3 && raw[1] === '-') {
    return `${escapeGeneratedCharacterClassLiteral(raw[0]!)}-${escapeGeneratedCharacterClassLiteral(raw[2]!)}`;
  }

  return raw;
}

function escapeGeneratedCharacterClassLiteral(char: string): string {
  return /[-\\\]^]/.test(char) ? `\\${char}` : char;
}

function translateXmlNameEscape(escape: 'i' | 'I' | 'c' | 'C'): string {
  switch (escape) {
    case 'i':
      return `[${XML_NAME_START_CHAR_CLASS}]`;
    case 'I':
      return `[^${XML_NAME_START_CHAR_CLASS}]`;
    case 'c':
      return `[${XML_NAME_CHAR_CLASS}]`;
    case 'C':
      return `[^${XML_NAME_CHAR_CLASS}]`;
  }
}

function translateXmlNameEscapeInCharacterClass(escape: 'i' | 'c'): string {
  switch (escape) {
    case 'i':
      return XML_NAME_START_CHAR_CLASS;
    case 'c':
      return XML_NAME_CHAR_CLASS;
  }
}

function createRegexError(code: string, message: string, span: RegexSpanLike): XPathError {
  return new XPathError(code, message, {
    source: '<xpath>',
    line: span.line,
    column: span.column,
    offset: span.start,
    endLine: span.endLine,
    endColumn: span.endColumn,
    endOffset: span.end,
  });
}