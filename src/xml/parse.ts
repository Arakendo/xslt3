import { DOMParser, type Document, type Node } from '@xmldom/xmldom';

import { WEAVER_XML_SOURCE_PARSE_ERROR, WEAVER_XML_STYLESHEET_PARSE_ERROR } from '../errors/codes.js';
import { XsltError, type ErrorSuggestion, type SourceLocation } from '../errors/index.js';

export {
  getAttributeValueSourceLocation,
  getElementNameSourceLocation,
  getNodeSourceLocation,
} from './sourceLocations.js';

export interface ParseXmlOptions {
  readonly role?: 'source-document' | 'stylesheet';
  readonly sourceName?: string;
}

/**
 * Parse an XML source string into a DOM document.
 *
 * Thin wrapper so the underlying parser can be swapped later without
 * touching callers. All XML input (source docs and stylesheets) goes
 * through here. Strips a leading UTF-8 BOM because xmldom treats it as
 * content-before-declaration.
 */
export function parseXml(source: string, options: ParseXmlOptions = {}): Document {
  const stripped = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const parser = new DOMParser({
    onError: () => {
      // ParseError carries the fatal message and locator; suppress xmldom console noise.
    },
  });

  let document: Document;

  try {
    document = parser.parseFromString(stripped, 'text/xml');
  } catch (error) {
    throw translateXmlParseError(error, stripped, options);
  }

  stripXmlDeclarationProcessingInstruction(document);
  return document;
}

export type { Document } from '@xmldom/xmldom';

type XmlDomParseError = Error & {
  readonly locator?: {
    readonly lineNumber?: number;
    readonly columnNumber?: number;
  };
};

function translateXmlParseError(error: unknown, source: string, options: ParseXmlOptions): unknown {
  if (!isXmlDomParseError(error) || options.role === undefined) {
    return error;
  }

  const message = normalizeXmlParseMessage(error.message);
  const location = createParseErrorLocation(source, options.sourceName, error.locator);
  const suggestion = createParseSuggestion(options.role);

  if (options.role === 'stylesheet') {
    return new XsltError(
      WEAVER_XML_STYLESHEET_PARSE_ERROR,
      `Stylesheet XML is not well-formed: ${message}.`,
      location,
      undefined,
      { suggestions: [suggestion] },
    );
  }

  return new XsltError(
    WEAVER_XML_SOURCE_PARSE_ERROR,
    `Source XML is not well-formed: ${message}.`,
    location,
    undefined,
    { suggestions: [suggestion] },
  );
}

function isXmlDomParseError(error: unknown): error is XmlDomParseError {
  return error instanceof Error && typeof error.message === 'string' && 'locator' in error;
}

function normalizeXmlParseMessage(message: string): string {
  return message.endsWith('.') ? message.slice(0, -1) : message;
}

function createParseSuggestion(role: ParseXmlOptions['role']): ErrorSuggestion {
  return role === 'stylesheet'
    ? {
        kind: 'fix',
        label: 'fix the XML well-formedness error in the stylesheet document',
        confidence: 1,
      }
    : {
        kind: 'fix',
        label: 'supply a well-formed XML source document',
        confidence: 1,
      };
}

function createParseErrorLocation(
  source: string,
  sourceName: string | undefined,
  locator: XmlDomParseError['locator'],
): SourceLocation | undefined {
  const line = locator?.lineNumber;
  const column = locator?.columnNumber;
  if (line === undefined || column === undefined) {
    return sourceName === undefined ? undefined : { source: sourceName };
  }

  const offset = computeNormalizedOffset(source, line, column);
  return {
    ...(sourceName === undefined ? {} : { source: sourceName }),
    offset,
    endOffset: offset + 1,
    line,
    column,
    endLine: line,
    endColumn: column + 1,
  };
}

function computeNormalizedOffset(source: string, line: number, column: number): number {
  const normalizedSource = source
    .replace(/\r\n/g, '\n')
    .replace(/[\r\u0085\u2028\u2029]/g, '\n');
  const lines = normalizedSource.split('\n');
  let offset = 0;

  for (let index = 0; index < line - 1; index += 1) {
    offset += (lines[index] ?? '').length + 1;
  }

  return offset + Math.max(column - 1, 0);
}

function stripXmlDeclarationProcessingInstruction(document: Document): void {
  const toRemove: Node[] = [];

  for (let index = 0; index < document.childNodes.length; index += 1) {
    const child = document.childNodes.item(index);
    if (child?.nodeType === 7 && child.nodeName === 'xml') {
      toRemove.push(child);
    }
  }

  for (const child of toRemove) {
    document.removeChild(child);
  }
}
