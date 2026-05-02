import type { Attr, Element, Node } from '@xmldom/xmldom';

import { getNodeSourceLocation } from '../../xml/parse.js';
import type { AttributeInstruction, Instruction } from './ir.js';
import {
  collectExcludedNamespaceState,
  collectInheritedNamespaceAttributes,
  isExcludeResultPrefixesAttribute,
  isNamespaceDeclaration,
  type ExcludedNamespaceState,
} from './literalResultNamespaces.js';

type NodeListLike = {
  readonly length: number;
  item(index: number): Node | null;
};

export function compileLiteralResultElement(
  element: Element,
  stylesheetXml: string,
  compileInstructions: (nodes: NodeListLike, stylesheetXml: string) => Instruction[],
  xsltNamespace: string,
  stylesheetSourceName: string,
): Extract<Instruction, { readonly kind: 'literalElement' }> {
  const location = getNodeSourceLocation(stylesheetXml, element, stylesheetSourceName);

  return {
    kind: 'literalElement',
    name: element.tagName,
    attributes: compileLiteralResultAttributes(element, stylesheetXml, xsltNamespace, stylesheetSourceName),
    body: compileInstructions(element.childNodes, stylesheetXml),
    ...(location === undefined ? {} : { location }),
  };
}

export function compileLiteralResultAttribute(
  attribute: Attr,
  stylesheetXml: string,
  excludedNamespaces: ExcludedNamespaceState,
  xsltNamespace: string,
  stylesheetSourceName: string,
): AttributeInstruction | undefined {
  if (isExcludeResultPrefixesAttribute(attribute)) {
    return undefined;
  }

  if (isNamespaceDeclaration(attribute)) {
    if (attribute.value === xsltNamespace) {
      return undefined;
    }

    if (excludedNamespaces.excludeAllNamespaces || excludedNamespaces.excludedNamespaceNames.has(attribute.name)) {
      return undefined;
    }
  }

  const location = getNodeSourceLocation(stylesheetXml, attribute, stylesheetSourceName);
  return {
    name: attribute.name,
    value: attribute.value,
    ...(location === undefined ? {} : { location }),
  };
}

function compileLiteralResultAttributes(
  element: Element,
  stylesheetXml: string,
  xsltNamespace: string,
  stylesheetSourceName: string,
): AttributeInstruction[] {
  const excludedNamespaces = collectExcludedNamespaceState(element);
  const attributes = collectInheritedNamespaceAttributes(
    element,
    stylesheetXml,
    excludedNamespaces,
    xsltNamespace,
    stylesheetSourceName,
  );

  for (let index = 0; index < element.attributes.length; index += 1) {
    const attribute = element.attributes.item(index) as Attr | null;
    if (attribute === null) {
      continue;
    }

    const compiledAttribute = compileLiteralResultAttribute(
      attribute,
      stylesheetXml,
      excludedNamespaces,
      xsltNamespace,
      stylesheetSourceName,
    );
    if (compiledAttribute !== undefined) {
      attributes.push(compiledAttribute);
    }
  }

  return attributes;
}
