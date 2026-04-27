/**
 * XPath evaluator.
 *
 * Walks a parsed XPath AST and produces an XDM sequence given a dynamic
 * context.
 */

import { XPDY0002, XPTY0004 } from '../../errors/codes.js';
import { XPathError } from '../../errors/XPathError.js';
import {
  createXdmNode,
  createXdmNumber,
  type XdmAtomicValue,
  type XdmItem,
  type XdmNode,
  type XdmSequence,
} from '../../xdm/types.js';
import type { Node } from '@xmldom/xmldom';
import type { DynamicContext } from './context.js';
import type { PathExpression, StepExpression, XPathAst } from '../parse/ast.js';

export function evaluate(ast: XPathAst, context: DynamicContext): XdmSequence {
  return evaluateExpression(ast, context);
}

function evaluateExpression(ast: XPathAst, context: DynamicContext): XdmItem[] {
  switch (ast.kind) {
    case 'binary': {
      const left = requireSingleNumber(evaluateExpression(ast.left, context), ast.left.span);
      const right = requireSingleNumber(evaluateExpression(ast.right, context), ast.right.span);
      return [createXdmNumber(ast.operator === '+' ? left + right : left - right)];
    }
    case 'contextItem': {
      return [requireContextNode(context, ast.span)];
    }
    case 'number': {
      return [createXdmNumber(ast.value)];
    }
    case 'path': {
      return evaluatePath(ast, context);
    }
  }
}

function evaluatePath(ast: PathExpression, context: DynamicContext): XdmNode[] {
  let nodes = ast.absolute
    ? [getRootNode(requireContextNode(context, ast.span))]
    : [requireContextNode(context, ast.span)];

  for (const step of ast.steps) {
    nodes = applyStep(step, nodes, context);
  }

  return nodes;
}

function applyStep(step: StepExpression, input: readonly XdmNode[], context: DynamicContext): XdmNode[] {
  let selected = input.flatMap((item) => selectAxis(step, item.node));
  selected = selected.filter((item) => matchesNodeTest(step, item.node));

  for (const predicate of step.predicates) {
    const size = selected.length;
    selected = selected.filter((item, index) => {
      const predicateResult = evaluateExpression(predicate, {
        ...context,
        contextItem: item,
        contextPosition: index + 1,
        contextSize: size,
      });
      return predicateMatches(predicateResult, index + 1);
    });
  }

  return selected;
}

function selectAxis(step: StepExpression, node: Node): XdmNode[] {
  switch (step.axis) {
    case 'attribute':
      return collectAttributes(node).map(createXdmNode);
    case 'child':
      return collectChildren(node).map(createXdmNode);
    case 'descendant-or-self':
      return collectDescendantsOrSelf(node).map(createXdmNode);
    case 'self':
      return [createXdmNode(node)];
  }
}

function matchesNodeTest(step: StepExpression, node: Node): boolean {
  if (step.nodeTest.kind === 'kindTest') {
    return step.nodeTest.name === 'node' ? true : node.nodeType === 3;
  }
  return node.nodeName === step.nodeTest.name;
}

function predicateMatches(result: readonly XdmItem[], position: number): boolean {
  if (result.length === 0) {
    return false;
  }

  if (result.length === 1 && result[0]?.xdmKind === 'atomic') {
    const atomic = result[0] as XdmAtomicValue;
    if (atomic.type === 'xs:double') {
      return atomic.value === position;
    }
    if (atomic.type === 'xs:boolean') {
      return atomic.value === true;
    }
  }

  return true;
}

function requireSingleNumber(items: readonly XdmItem[], span: { line: number; column: number; start: number }): number {
  const item = items[0];
  if (
    items.length !== 1 ||
    item?.xdmKind !== 'atomic' ||
    (item as XdmAtomicValue).type !== 'xs:double'
  ) {
    throw new XPathError(XPTY0004, 'Expected a single numeric value.', {
      line: span.line,
      column: span.column,
      offset: span.start,
    });
  }
  return (item as XdmAtomicValue).value as number;
}

function requireContextNode(
  context: DynamicContext,
  span: { line: number; column: number; start: number },
): XdmNode {
  if (!isXdmNode(context.contextItem)) {
    throw new XPathError(XPDY0002, 'The XPath expression requires a context node.', {
      line: span.line,
      column: span.column,
      offset: span.start,
    });
  }
  return context.contextItem;
}

function isXdmNode(value: unknown): value is XdmNode {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'xdmKind' in value &&
    'node' in value &&
    value.xdmKind === 'node'
  );
}

function getRootNode(item: XdmNode): XdmNode {
  let current = item.node;
  while (current.parentNode !== null) {
    current = current.parentNode;
  }
  return createXdmNode(current);
}

function collectAttributes(node: Node): Node[] {
  const attributes = (node as Node & {
    attributes?: { readonly length: number; item(index: number): Node | null };
  }).attributes;
  if (attributes === undefined) {
    return [];
  }

  const items: Node[] = [];
  for (let index = 0; index < attributes.length; index += 1) {
    const attribute = attributes.item(index);
    if (attribute !== null) {
      items.push(attribute);
    }
  }
  return items;
}

function collectChildren(node: Node): Node[] {
  const items: Node[] = [];
  const children = node.childNodes;
  for (let index = 0; index < children.length; index += 1) {
    const child = children.item(index);
    if (child !== null) {
      items.push(child);
    }
  }
  return items;
}

function collectDescendantsOrSelf(node: Node): Node[] {
  const items: Node[] = [node];
  for (const child of collectChildren(node)) {
    items.push(...collectDescendantsOrSelf(child));
  }
  return items;
}
