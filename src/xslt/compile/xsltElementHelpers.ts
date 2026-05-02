import type { Element } from '@xmldom/xmldom';

export const XSLT_NAMESPACE = 'http://www.w3.org/1999/XSL/Transform';

export function isXsltElement(element: Element, localName: string): boolean {
  return element.namespaceURI === XSLT_NAMESPACE && (element.localName ?? element.nodeName) === localName;
}

export function hasMeaningfulTemplateContent(element: Element): boolean {
  for (let index = 0; index < element.childNodes.length; index += 1) {
    const node = element.childNodes.item(index);
    if (node === null) {
      continue;
    }

    if (node.nodeType === node.ELEMENT_NODE) {
      return true;
    }

    if ((node.nodeType === node.TEXT_NODE || node.nodeType === node.CDATA_SECTION_NODE) && (node.nodeValue ?? '').trim().length > 0) {
      return true;
    }
  }

  return false;
}

export function childElements(element: Element): Element[] {
  const children: Element[] = [];

  for (let index = 0; index < element.childNodes.length; index += 1) {
    const child = element.childNodes.item(index);
    if (child !== null && child.nodeType === child.ELEMENT_NODE) {
      children.push(child as Element);
    }
  }

  return children;
}

export function descendantElements(element: Element): Element[] {
  const descendants: Element[] = [];

  for (const child of childElements(element)) {
    descendants.push(child);
    descendants.push(...descendantElements(child));
  }

  return descendants;
}

export function leadingTemplateParamElements(templateElement: Element): Element[] {
  const params: Element[] = [];

  for (let index = 0; index < templateElement.childNodes.length; index += 1) {
    const node = templateElement.childNodes.item(index);
    if (node === null) {
      continue;
    }

    if (node.nodeType === node.TEXT_NODE || node.nodeType === node.CDATA_SECTION_NODE) {
      if ((node.nodeValue ?? '').trim().length === 0) {
        continue;
      }

      break;
    }

    if (node.nodeType !== node.ELEMENT_NODE) {
      continue;
    }

    const element = node as Element;
    if (!isXsltElement(element, 'param')) {
      break;
    }

    params.push(element);
  }

  return params;
}

export function parseRequiredAttribute(element: Element): boolean {
  return parseBooleanFlagAttribute(element, 'required');
}

export function isTunnelParamElement(element: Element): boolean {
  return parseBooleanFlagAttribute(element, 'tunnel');
}

function parseBooleanFlagAttribute(element: Element, attributeName: string): boolean {
  const rawValue = element.getAttribute(attributeName);
  if (rawValue === null) {
    return false;
  }

  const normalized = rawValue.trim().toLowerCase();
  return normalized === 'yes' || normalized === 'true' || normalized === '1';
}