import type { Attr, Element, Node } from '@xmldom/xmldom';

import { getNodeSourceLocation } from '../../xml/parse.js';
import type { AttributeInstruction } from './ir.js';

export type ExcludedNamespaceState = {
  readonly excludedNamespaceNames: ReadonlySet<string>;
  readonly excludeAllNamespaces: boolean;
};

export function collectInheritedNamespaceAttributes(
  element: Element,
  stylesheetXml: string,
  excludedNamespaces: ExcludedNamespaceState,
  xsltNamespace: string,
  stylesheetSourceName: string,
): AttributeInstruction[] {
  const namespaceAttributes = new Map<string, string>();
  const ancestors: Element[] = [];

  let current: Node | null = element.parentNode;
  while (current !== null) {
    if (current.nodeType === current.ELEMENT_NODE) {
      ancestors.unshift(current as Element);
    }
    current = current.parentNode;
  }

  for (const ancestor of ancestors) {
    for (let index = 0; index < ancestor.attributes.length; index += 1) {
      const attribute = ancestor.attributes.item(index) as Attr | null;
      if (attribute === null || !isNamespaceDeclaration(attribute) || attribute.value === xsltNamespace) {
        continue;
      }

      if (excludedNamespaces.excludeAllNamespaces || excludedNamespaces.excludedNamespaceNames.has(attribute.name)) {
        continue;
      }

      if (!namespaceAttributes.has(attribute.name)) {
        namespaceAttributes.set(attribute.name, attribute.value);
      }
    }
  }

  const attributes: AttributeInstruction[] = [];

  for (const [name, value] of namespaceAttributes) {
    if (element.hasAttribute(name)) {
      continue;
    }

    const sourceAttribute = ancestors
      .flatMap((ancestor) => Array.from(ancestor.attributes))
      .find((attribute) => attribute.name === name && attribute.value === value);
    const location = sourceAttribute === undefined
      ? undefined
      : getNodeSourceLocation(stylesheetXml, sourceAttribute, stylesheetSourceName);

    attributes.push({
      name,
      value,
      ...(location === undefined ? {} : { location }),
    });
  }

  return attributes;
}

export function collectExcludedNamespaceState(element: Element): ExcludedNamespaceState {
  const excludedNamespaceNames = new Set<string>();
  let excludeAllNamespaces = false;

  let current: Node | null = element;
  while (current !== null) {
    if (current.nodeType === current.ELEMENT_NODE) {
      const excludedPrefixes = (current as Element).getAttribute('exclude-result-prefixes');
      if (excludedPrefixes !== null) {
        for (const prefix of excludedPrefixes.trim().split(/\s+/)) {
          if (prefix.length === 0) {
            continue;
          }

          if (prefix === '#all') {
            excludeAllNamespaces = true;
            excludedNamespaceNames.clear();
            continue;
          }

          excludedNamespaceNames.add(prefix === '#default' ? 'xmlns' : `xmlns:${prefix}`);
        }
      }
    }

    current = current.parentNode;
  }

  return {
    excludedNamespaceNames,
    excludeAllNamespaces,
  };
}

export function isExcludeResultPrefixesAttribute(attribute: Attr): boolean {
  return (attribute.namespaceURI === null || attribute.namespaceURI.length === 0)
    && attribute.name === 'exclude-result-prefixes';
}

export function isNamespaceDeclaration(attribute: Attr): boolean {
  return attribute.name === 'xmlns' || attribute.prefix === 'xmlns';
}