import { DOMParser, type Document } from '@xmldom/xmldom';

/**
 * Parse an XML source string into a DOM document.
 *
 * Thin wrapper so the underlying parser can be swapped later without
 * touching callers. All XML input (source docs and stylesheets) goes
 * through here.
 */
export function parseXml(source: string): Document {
  const parser = new DOMParser();
  return parser.parseFromString(source, 'text/xml');
}

export type { Document } from '@xmldom/xmldom';
