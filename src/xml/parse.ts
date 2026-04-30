import { DOMParser, type Document, type Node } from '@xmldom/xmldom';

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
  const document = parser.parseFromString(stripped, 'text/xml');
  stripXmlDeclarationProcessingInstruction(document);
  return document;
}

export type { Document } from '@xmldom/xmldom';

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
