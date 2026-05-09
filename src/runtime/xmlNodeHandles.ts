import type { Element, Node } from '@xmldom/xmldom';

import { XTSE0010 } from '../errors/codes.js';
import { XsltError, type SourceLocation } from '../errors/index.js';
import type { XmlNodeHandle } from '../processor/types.js';
import {
  getAttributeValueSourceLocation,
  getElementNameSourceLocation,
  getNodeSourceLocation,
} from '../xml/sourceLocations.js';

export function createXmlNodeHandle(node: Node, documentUri: string): XmlNodeHandle {
  return {
    documentUri,
    kind: getXmlNodeHandleKind(node),
    path: getXmlNodePath(node),
  };
}

export function resolveXmlNodeHandle(node: Node, documentUri: string, path: string): XmlNodeHandle | undefined {
  const document = getDocumentNode(node);
  if (document === undefined) {
    return undefined;
  }

  const resolvedNode = resolveXmlNodePath(document, path);
  if (resolvedNode === undefined) {
    return undefined;
  }

  const handle = createXmlNodeHandle(resolvedNode, documentUri);
  return handle.path === path ? handle : undefined;
}

export function resolveXmlNodeHandleAtOffset(
  node: Node,
  documentUri: string,
  source: string,
  offset: number,
): XmlNodeHandle | undefined {
  if (!Number.isInteger(offset) || offset < 0 || offset >= source.length) {
    return undefined;
  }

  const document = getDocumentNode(node);
  if (document === undefined) {
    return undefined;
  }

  const resolvedNode = findDeepestNodeAtOffset(document, source, offset);
  return resolvedNode === undefined ? undefined : createXmlNodeHandle(resolvedNode, documentUri);
}

export function resolveXmlNodeHandleInRange(
  node: Node,
  documentUri: string,
  source: string,
  offsetStart: number,
  offsetEnd: number,
): XmlNodeHandle | undefined {
  if (
    !Number.isInteger(offsetStart)
    || !Number.isInteger(offsetEnd)
    || offsetStart < 0
    || offsetEnd <= offsetStart
    || offsetEnd > source.length
  ) {
    return undefined;
  }

  const document = getDocumentNode(node);
  if (document === undefined) {
    return undefined;
  }

  const resolvedNode = findDeepestNodeInRange(document, source, offsetStart, offsetEnd);
  return resolvedNode === undefined ? undefined : createXmlNodeHandle(resolvedNode, documentUri);
}

function getXmlNodeHandleKind(node: Node): XmlNodeHandle['kind'] {
  switch (node.nodeType) {
    case node.DOCUMENT_NODE:
      return 'document';
    case node.ELEMENT_NODE:
      return 'element';
    case node.ATTRIBUTE_NODE:
      return 'attribute';
    case node.TEXT_NODE:
      return 'text';
    case node.COMMENT_NODE:
      return 'comment';
    case node.PROCESSING_INSTRUCTION_NODE:
      return 'pi';
    default:
      throw new XsltError(
        XTSE0010,
        `Node type ${node.nodeType} cannot be represented as an XML trace handle.`,
      );
  }
}

function getXmlNodePath(node: Node): string {
  if (node.nodeType === node.DOCUMENT_NODE) {
    return '/';
  }

  if (node.nodeType === node.ATTRIBUTE_NODE) {
    const ownerElement = (node as Node & { ownerElement?: Node | null }).ownerElement;
    if (ownerElement === undefined || ownerElement === null) {
      return `/@${node.nodeName}`;
    }

    return `${getXmlNodePath(ownerElement)}/@${node.nodeName}`;
  }

  const parent = node.parentNode;
  const basePath = parent === null ? '' : getXmlNodePath(parent);
  if (basePath === '' || basePath === '/') {
    return `/${getXmlNodePathSegment(node)}`;
  }

  return `${basePath}/${getXmlNodePathSegment(node)}`;
}

function getXmlNodePathSegment(node: Node): string {
  if (node.nodeType === node.ELEMENT_NODE) {
    return `${node.nodeName}[${countPrecedingMatchingSiblings(node) + 1}]`;
  }

  if (node.nodeType === node.TEXT_NODE) {
    return `text()[${countPrecedingMatchingSiblings(node) + 1}]`;
  }

  if (node.nodeType === node.COMMENT_NODE) {
    return `comment()[${countPrecedingMatchingSiblings(node) + 1}]`;
  }

  if (node.nodeType === node.PROCESSING_INSTRUCTION_NODE) {
    return `processing-instruction(${JSON.stringify(node.nodeName)})[${countPrecedingMatchingSiblings(node) + 1}]`;
  }

  throw new XsltError(
    XTSE0010,
    `Node type ${node.nodeType} cannot be represented as an XML trace path segment.`,
  );
}

function countPrecedingMatchingSiblings(node: Node): number {
  let count = 0;
  let sibling = node.previousSibling;

  while (sibling !== null) {
    if (isSamePathKind(sibling, node)) {
      count += 1;
    }

    sibling = sibling.previousSibling;
  }

  return count;
}

function isSamePathKind(left: Node, right: Node): boolean {
  if (left.nodeType !== right.nodeType) {
    return false;
  }

  if (left.nodeType === left.ELEMENT_NODE || left.nodeType === left.PROCESSING_INSTRUCTION_NODE) {
    return left.nodeName === right.nodeName;
  }

  return true;
}

function findDeepestNodeAtOffset(node: Node, source: string, offset: number): Node | undefined {
  if (node.nodeType === node.DOCUMENT_NODE || node.nodeType === node.ELEMENT_NODE) {
    for (const attribute of getAttributeNodes(node)) {
      const match = findDeepestNodeAtOffset(attribute, source, offset);
      if (match !== undefined) {
        return match;
      }
    }

    for (let index = 0; index < node.childNodes.length; index += 1) {
      const child = node.childNodes.item(index);
      if (child === null) {
        continue;
      }

      const match = findDeepestNodeAtOffset(child, source, offset);
      if (match !== undefined) {
        return match;
      }
    }
  }

  return nodeMatchesOffset(node, source, offset) ? node : undefined;
}

function findDeepestNodeInRange(node: Node, source: string, offsetStart: number, offsetEnd: number): Node | undefined {
  if (node.nodeType === node.DOCUMENT_NODE || node.nodeType === node.ELEMENT_NODE) {
    for (const attribute of getAttributeNodes(node)) {
      const match = findDeepestNodeInRange(attribute, source, offsetStart, offsetEnd);
      if (match !== undefined) {
        return match;
      }
    }

    for (let index = 0; index < node.childNodes.length; index += 1) {
      const child = node.childNodes.item(index);
      if (child === null) {
        continue;
      }

      const match = findDeepestNodeInRange(child, source, offsetStart, offsetEnd);
      if (match !== undefined) {
        return match;
      }
    }
  }

  return nodeMatchesRange(node, source, offsetStart, offsetEnd) ? node : undefined;
}

function getAttributeNodes(node: Node): readonly Node[] {
  if (node.nodeType !== node.ELEMENT_NODE) {
    return [];
  }

  const attributes = (node as Node & {
    attributes?: {
      readonly length: number;
      item(index: number): Node | null;
    } | null;
  }).attributes;
  if (attributes === undefined || attributes === null) {
    return [];
  }

  const nodes: Node[] = [];
  for (let index = 0; index < attributes.length; index += 1) {
    const attribute = attributes.item(index);
    if (attribute !== null) {
      nodes.push(attribute);
    }
  }

  return nodes;
}

function nodeMatchesOffset(node: Node, source: string, offset: number): boolean {
  switch (node.nodeType) {
    case node.ELEMENT_NODE:
      return isOffsetWithinSourceLocation(getElementNameSourceLocation(source, node as Element), offset);
    case node.ATTRIBUTE_NODE:
      return isOffsetWithinAttributeSelection(node, source, offset);
    case node.TEXT_NODE:
      return isOffsetWithinTextSelection(node, source, offset);
    default:
      return false;
  }
}

function nodeMatchesRange(node: Node, source: string, offsetStart: number, offsetEnd: number): boolean {
  switch (node.nodeType) {
    case node.ELEMENT_NODE:
      return isRangeWithinSourceLocation(getElementNameSourceLocation(source, node as Element), offsetStart, offsetEnd);
    case node.ATTRIBUTE_NODE:
      return isRangeWithinAttributeSelection(node, source, offsetStart, offsetEnd);
    case node.TEXT_NODE:
      return isRangeWithinTextSelection(node, source, offsetStart, offsetEnd);
    default:
      return false;
  }
}

function isOffsetWithinAttributeSelection(node: Node, source: string, offset: number): boolean {
  const attributeLocation = getNodeSourceLocation(source, node);
  if (hasOffsetLocation(attributeLocation) && offset >= attributeLocation.offset && offset < attributeLocation.offset + node.nodeName.length) {
    return true;
  }

  const ownerElement = (node as Node & { ownerElement?: Node | null }).ownerElement;
  if (ownerElement === undefined || ownerElement === null) {
    return false;
  }

  return isOffsetWithinSourceLocation(
    getAttributeValueSourceLocation(source, ownerElement as Element, node.nodeName),
    offset,
  );
}

function isRangeWithinAttributeSelection(node: Node, source: string, offsetStart: number, offsetEnd: number): boolean {
  const attributeLocation = getNodeSourceLocation(source, node);
  if (hasOffsetLocation(attributeLocation)) {
    const attributeNameEnd = attributeLocation.offset + node.nodeName.length;
    if (offsetStart >= attributeLocation.offset && offsetEnd <= attributeNameEnd) {
      return true;
    }
  }

  const ownerElement = (node as Node & { ownerElement?: Node | null }).ownerElement;
  if (ownerElement === undefined || ownerElement === null) {
    return false;
  }

  return isRangeWithinSourceLocation(
    getAttributeValueSourceLocation(source, ownerElement as Element, node.nodeName),
    offsetStart,
    offsetEnd,
  );
}

function isOffsetWithinTextSelection(node: Node, source: string, offset: number): boolean {
  const location = getNodeSourceLocation(source, node);
  if (!hasOffsetLocation(location)) {
    return false;
  }

  const textValue = node.nodeValue ?? '';
  if (textValue.trim().length === 0) {
    return false;
  }

  const textLength = textValue.length;
  return textLength > 0 && offset >= location.offset && offset < location.offset + textLength;
}

function isRangeWithinTextSelection(node: Node, source: string, offsetStart: number, offsetEnd: number): boolean {
  const location = getNodeSourceLocation(source, node);
  if (!hasOffsetLocation(location)) {
    return false;
  }

  const textValue = node.nodeValue ?? '';
  if (textValue.trim().length === 0) {
    return false;
  }

  const textEnd = location.offset + textValue.length;
  return offsetStart >= location.offset && offsetEnd <= textEnd;
}

function isOffsetWithinSourceLocation(
  location: SourceLocation | undefined,
  offset: number,
): boolean {
  if (!hasOffsetLocation(location)) {
    return false;
  }

  const endOffset = location.endOffset ?? location.offset + 1;
  return offset >= location.offset && offset < endOffset;
}

function isRangeWithinSourceLocation(
  location: SourceLocation | undefined,
  offsetStart: number,
  offsetEnd: number,
): boolean {
  if (!hasOffsetLocation(location)) {
    return false;
  }

  const endOffset = location.endOffset ?? location.offset + 1;
  return offsetStart >= location.offset && offsetEnd <= endOffset;
}

function hasOffsetLocation(location: SourceLocation | undefined): location is SourceLocation & { offset: number } {
  return location?.offset !== undefined;
}

function getDocumentNode(node: Node): Node | undefined {
  if (node.nodeType === node.DOCUMENT_NODE) {
    return node;
  }

  return (node as Node & { ownerDocument?: Node | null }).ownerDocument ?? undefined;
}

function resolveXmlNodePath(document: Node, path: string): Node | undefined {
  if (path === '/') {
    return document;
  }

  if (!path.startsWith('/')) {
    return undefined;
  }

  const segments = path.slice(1).split('/');
  let current: Node | undefined = document;

  for (const [index, segment] of segments.entries()) {
    if (current === undefined || segment === '') {
      return undefined;
    }

    if (segment.startsWith('@')) {
      if (index !== segments.length - 1) {
        return undefined;
      }

      current = resolveAttributeSegment(current, segment);
      continue;
    }

    current = resolveChildSegment(current, segment);
  }

  return current;
}

function resolveAttributeSegment(node: Node, segment: string): Node | undefined {
  if (node.nodeType !== node.ELEMENT_NODE) {
    return undefined;
  }

  const attributeName = segment.slice(1);
  if (attributeName.length === 0) {
    return undefined;
  }

  return (node as Node & { getAttributeNode(name: string): Node | null }).getAttributeNode(attributeName) ?? undefined;
}

function resolveChildSegment(node: Node, segment: string): Node | undefined {
  const step = parsePathSegment(segment);
  if (step === undefined) {
    return undefined;
  }

  return selectIndexedChild(node, step.ordinal, (child) => isMatchingStep(child, step.kind, step.name));
}

function parsePathSegment(segment: string): { kind: XmlNodeHandle['kind']; ordinal: number; name?: string } | undefined {
  const textMatch = /^text\(\)\[(\d+)\]$/.exec(segment);
  if (textMatch !== null) {
    const ordinalText = textMatch[1];
    return ordinalText === undefined ? undefined : createParsedSegment('text', ordinalText);
  }

  const commentMatch = /^comment\(\)\[(\d+)\]$/.exec(segment);
  if (commentMatch !== null) {
    const ordinalText = commentMatch[1];
    return ordinalText === undefined ? undefined : createParsedSegment('comment', ordinalText);
  }

  const piMatch = /^processing-instruction\((.+)\)\[(\d+)\]$/.exec(segment);
  if (piMatch !== null) {
    try {
      const nameText = piMatch[1];
      const ordinalText = piMatch[2];
      if (nameText === undefined || ordinalText === undefined) {
        return undefined;
      }

      const name = JSON.parse(nameText) as string;
      if (typeof name !== 'string') {
        return undefined;
      }

      return createParsedSegment('pi', ordinalText, name);
    } catch {
      return undefined;
    }
  }

  const elementMatch = /^([^\[\]]+)\[(\d+)\]$/.exec(segment);
  if (elementMatch !== null) {
    const name = elementMatch[1];
    const ordinalText = elementMatch[2];
    return name === undefined || ordinalText === undefined ? undefined : createParsedSegment('element', ordinalText, name);
  }

  return undefined;
}

function createParsedSegment(
  kind: XmlNodeHandle['kind'],
  ordinalText: string | undefined,
  name?: string,
): { kind: XmlNodeHandle['kind']; ordinal: number; name?: string } | undefined {
  const ordinal = Number.parseInt(ordinalText ?? '', 10);
  if (!Number.isInteger(ordinal) || ordinal < 1) {
    return undefined;
  }

  return name === undefined ? { kind, ordinal } : { kind, ordinal, name };
}

function selectIndexedChild(node: Node, ordinal: number, predicate: (child: Node) => boolean): Node | undefined {
  let matches = 0;

  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes.item(index);
    if (child === null || !predicate(child)) {
      continue;
    }

    matches += 1;
    if (matches === ordinal) {
      return child;
    }
  }

  return undefined;
}

function isMatchingStep(child: Node, kind: XmlNodeHandle['kind'], name: string | undefined): boolean {
  switch (kind) {
    case 'document':
    case 'attribute':
      return false;
    case 'element':
      return child.nodeType === child.ELEMENT_NODE && child.nodeName === name;
    case 'text':
      return child.nodeType === child.TEXT_NODE;
    case 'comment':
      return child.nodeType === child.COMMENT_NODE;
    case 'pi':
      return child.nodeType === child.PROCESSING_INSTRUCTION_NODE && child.nodeName === name;
  }
}