import { DOMParser, type Document } from '@xmldom/xmldom';

/**
 * Parse an XML source string into a DOM document.
 *
 * Thin wrapper so the underlying parser can be swapped later without
 * touching callers. All XML input (source docs and stylesheets) goes
 * through here. Strips a leading UTF-8 BOM because xmldom treats it as
 * content-before-declaration.
 */
export function parseXml(source: string): Document {
  const stripped = source.charCodeAt(0) === 0xfeff ? source.slice(1) : source;
  const parser = new DOMParser();
  return parser.parseFromString(stripped, 'text/xml');
}

export type { Document } from '@xmldom/xmldom';
