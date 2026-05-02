import type { Attr, Element, Node } from '@xmldom/xmldom';

import { XPST0081 } from '../../errors/codes.js';
import type { ErrorFrame } from '../../errors/index.js';
import type { PathExpression, StepExpression, XPathAst } from '../../xpath/parse/ast.js';
import { parseXPath } from '../../xpath/parse/parser.js';
import { getAttributeValueSourceLocation, getNodeSourceLocation } from '../../xml/parse.js';
import { prependXsltErrorFrame as withPrependedCompileFrame } from '../diagnostics.js';
import type { TemplateRule } from './ir.js';
import { STYLESHEET_SOURCE_NAME, createXsltStaticError } from './compilerSupport.js';

export function normalizeXsltQName(
  name: string,
  element: Element,
  stylesheetXml: string,
  attributeName: string,
  ownerName: string,
): string {
  const eqName = tryNormalizeEqName(name);
  if (eqName !== undefined) {
    return eqName;
  }

  const separator = name.indexOf(':');
  if (separator < 0) {
    return name;
  }

  const prefix = name.slice(0, separator);
  const localName = name.slice(separator + 1);
  const namespaceUri = lookupNamespaceUri(element, prefix);
  if (namespaceUri === undefined) {
    throw createXsltStaticError(
      `Unknown namespace prefix ${JSON.stringify(prefix)} in ${ownerName} ${attributeName}.`,
      getAttributeValueSourceLocation(stylesheetXml, element, attributeName, STYLESHEET_SOURCE_NAME)
        ?? getNodeSourceLocation(stylesheetXml, element, STYLESHEET_SOURCE_NAME),
      {
        namespacePrefix: prefix,
        qName: name,
      },
      XPST0081,
    );
  }

  return `{${namespaceUri}}${localName}`;
}

export function parseXPathInContext(
  expression: string,
  location: TemplateRule['location'],
  ownerName: string,
  attributeName: string,
  frameKind: ErrorFrame['kind'] = 'instruction',
): XPathAst {
  try {
    return parseXPath(expression);
  } catch (error) {
    const frameLabel = frameKind === 'template'
      ? `${attributeName}="${expression}"`
      : `${ownerName} ${attributeName}="${expression}"`;
    throw withPrependedCompileFrame(
      error,
      {
        kind: frameKind,
        label: frameLabel,
        ...(location === undefined ? {} : { location }),
      },
      location === undefined
        ? undefined
        : {
            label: frameKind === 'template' ? 'containing template' : 'containing instruction',
            location,
          },
    );
  }
}

export function isSupportedTemplateMatch(ast: XPathAst): boolean {
  if (ast.kind !== 'path') {
    return false;
  }

  const path = ast as PathExpression;
  if (path.base !== undefined) {
    return false;
  }

  if (path.absolute && path.steps.length === 0) {
    return true;
  }

  if (path.steps.length === 0) {
    return false;
  }

  for (const step of path.steps) {
    if (step?.kind !== 'step' || !isSupportedTemplateStep(step as StepExpression)) {
      return false;
    }
  }

  return true;
}

function tryNormalizeEqName(name: string): string | undefined {
  if (!name.startsWith('Q{')) {
    return undefined;
  }

  const endBrace = name.indexOf('}');
  if (endBrace < 0) {
    return undefined;
  }

  const namespaceUri = name.slice(2, endBrace);
  const localName = name.slice(endBrace + 1);
  if (localName.length === 0) {
    return undefined;
  }

  return namespaceUri.length === 0 ? localName : `{${namespaceUri}}${localName}`;
}

function lookupNamespaceUri(element: Element, prefix: string): string | undefined {
  for (let current: Node | null = element; current !== null; current = current.parentNode) {
    if (current.nodeType !== current.ELEMENT_NODE) {
      continue;
    }

    const currentElement = current as Element;
    for (let index = 0; index < currentElement.attributes.length; index += 1) {
      const attribute = currentElement.attributes.item(index) as Attr | null;
      if (attribute?.prefix === 'xmlns' && attribute.localName === prefix) {
        return attribute.value;
      }
    }
  }

  return undefined;
}

function isSupportedTemplateStep(step: StepExpression): boolean {
  if (step.axis !== 'child' || step.predicates.length > 0) {
    return false;
  }

  return step.nodeTest.kind === 'nameTest'
    || step.nodeTest.kind === 'wildcardTest'
    || (step.nodeTest.kind === 'kindTest' && step.nodeTest.name === 'node')
    || (step.nodeTest.kind === 'kindTest' && step.nodeTest.name === 'text');
}