/**
 * XPath evaluator.
 *
 * Walks a parsed XPath AST and produces an XDM sequence given a dynamic
 * context.
 */

import type { Node } from '@xmldom/xmldom';

import { FOAR0001, FOCA0002, XPDY0002, XPST0008, XPST0017, XPTY0004 } from '../../errors/codes.js';
import { XPathError } from '../../errors/XPathError.js';
import { createSequence, materialize } from '../../xdm/sequence.js';
import {
  createXdmBoolean,
  createXdmNode,
  createXdmNumber,
  createXdmString,
  type XdmAtomicValue,
  type XdmItem,
  type XdmNode,
  type XdmSequence,
} from '../../xdm/types.js';
import type { DynamicContext } from './context.js';
import type { PathExpression, StepExpression, XPathAst, XPathBinaryOperator } from '../parse/ast.js';

type SpanLike = {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly end: number;
};

export function evaluate(ast: XPathAst, context: DynamicContext): XdmSequence {
  return createSequence(evaluateExpression(ast, context));
}

function evaluateExpression(ast: XPathAst, context: DynamicContext): XdmItem[] {
  switch (ast.kind) {
    case 'binary':
      return evaluateBinaryExpression(ast.operator, ast.left, ast.right, context, ast.span);
    case 'contextItem':
      return [requireContextItem(context, ast.span)];
    case 'functionCall':
      return evaluateFunctionCall(ast.callee, ast.arguments, context, ast.span);
    case 'if':
      return effectiveBooleanValue(evaluateExpression(ast.test, context), ast.test.span)
        ? evaluateExpression(ast.thenBranch, context)
        : evaluateExpression(ast.elseBranch, context);
    case 'number':
      return [createXdmNumber(ast.value)];
    case 'string':
      return [createXdmString(ast.value)];
    case 'sequence':
      return ast.items.flatMap((item) => evaluateExpression(item, context));
    case 'unary': {
      const operand = requireSingleNumber(evaluateExpression(ast.operand, context), ast.operand.span);
      return [createXdmNumber(-operand)];
    }
    case 'variable':
      return resolveVariableReference(ast.name, context, ast.span);
    case 'path':
      return evaluatePath(ast, context);
  }
}

function evaluateFunctionCall(
  callee: string,
  args: readonly XPathAst[],
  context: DynamicContext,
  span: SpanLike,
): XdmItem[] {
  const normalized = callee.includes(':') ? callee : `fn:${callee}`;

  switch (normalized) {
    case 'fn:position':
      requireArity(normalized, args, 0, span);
      return [createXdmNumber(context.contextPosition)];
    case 'fn:last':
      requireArity(normalized, args, 0, span);
      return [createXdmNumber(context.contextSize)];
    case 'fn:count':
      requireArity(normalized, args, 1, span);
      return [createXdmNumber(evaluateExpression(args[0]!, context).length)];
    case 'fn:exists':
      requireArity(normalized, args, 1, span);
      return [createXdmBoolean(evaluateExpression(args[0]!, context).length > 0)];
    case 'fn:empty':
      requireArity(normalized, args, 1, span);
      return [createXdmBoolean(evaluateExpression(args[0]!, context).length === 0)];
    case 'fn:boolean':
      requireArity(normalized, args, 1, span);
      return [createXdmBoolean(effectiveBooleanValue(evaluateExpression(args[0]!, context), span))];
    case 'fn:not':
      requireArity(normalized, args, 1, span);
      return [createXdmBoolean(!effectiveBooleanValue(evaluateExpression(args[0]!, context), span))];
    case 'fn:string': {
      const item = evaluateOptionalSingletonItemArg(normalized, args, context, span);
      return [createXdmString(itemToStringValue(item))];
    }
    case 'fn:string-length': {
      const item = evaluateOptionalSingletonItemArg(normalized, args, context, span);
      return [createXdmNumber(itemToStringValue(item).length)];
    }
    case 'fn:substring': {
      if (args.length !== 2 && args.length !== 3) {
        throw createXPathError(XPST0017, `Function ${normalized} expects 2 or 3 arguments but got ${args.length}.`, span);
      }
      const source = itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized));
      const start = Math.round(requireSingleNumber(evaluateExpression(args[1]!, context), span));
      const zeroBasedStart = Math.max(start - 1, 0);
      if (args.length === 2) {
        return [createXdmString(source.slice(zeroBasedStart))];
      }
      const length = Math.max(Math.round(requireSingleNumber(evaluateExpression(args[2]!, context), span)), 0);
      return [createXdmString(source.slice(zeroBasedStart, zeroBasedStart + length))];
    }
    case 'fn:concat': {
      if (args.length < 2) {
        throw createXPathError(XPST0017, `Function ${normalized} expects at least 2 arguments but got ${args.length}.`, span);
      }
      return [createXdmString(args.map((arg) => itemToStringValue(evaluateSingletonStringishArg(arg, context, span, normalized))).join(''))];
    }
    case 'fn:string-join': {
      requireArity(normalized, args, 2, span);
      const items = evaluateExpression(args[0]!, context);
      const separator = itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized));
      return [createXdmString(items.map(itemToStringValue).join(separator))];
    }
    case 'fn:matches': {
      if (args.length !== 2 && args.length !== 3) {
        throw createXPathError(XPST0017, `Function ${normalized} expects 2 or 3 arguments but got ${args.length}.`, span);
      }
      const input = itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized));
      const pattern = itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized));
      const flags = args.length === 3
        ? itemToStringValue(evaluateSingletonStringishArg(args[2]!, context, span, normalized))
        : '';
      return [createXdmBoolean(compileRegex(pattern, flags, span).test(input))];
    }
    case 'fn:replace': {
      if (args.length !== 3 && args.length !== 4) {
        throw createXPathError(XPST0017, `Function ${normalized} expects 3 or 4 arguments but got ${args.length}.`, span);
      }
      const input = itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized));
      const pattern = itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized));
      const replacement = itemToStringValue(evaluateSingletonStringishArg(args[2]!, context, span, normalized));
      const flags = args.length === 4
        ? itemToStringValue(evaluateSingletonStringishArg(args[3]!, context, span, normalized))
        : '';
      return [createXdmString(input.replace(compileRegex(pattern, flags, span, true), replacement))];
    }
    case 'fn:tokenize': {
      if (args.length !== 2 && args.length !== 3) {
        throw createXPathError(XPST0017, `Function ${normalized} expects 2 or 3 arguments but got ${args.length}.`, span);
      }
      const input = itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized));
      const pattern = itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized));
      const flags = args.length === 3
        ? itemToStringValue(evaluateSingletonStringishArg(args[2]!, context, span, normalized))
        : '';
      return input.split(compileRegex(pattern, flags, span, true)).map(createXdmString);
    }
    case 'fn:normalize-space': {
      const item = evaluateOptionalSingletonItemArg(normalized, args, context, span);
      return [createXdmString(normalizeSpace(itemToStringValue(item)))];
    }
    case 'fn:contains':
      requireArity(normalized, args, 2, span);
      return [
        createXdmBoolean(
          itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized)).includes(
            itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized)),
          ),
        ),
      ];
    case 'fn:starts-with':
      requireArity(normalized, args, 2, span);
      return [
        createXdmBoolean(
          itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized)).startsWith(
            itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized)),
          ),
        ),
      ];
    case 'fn:ends-with':
      requireArity(normalized, args, 2, span);
      return [
        createXdmBoolean(
          itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized)).endsWith(
            itemToStringValue(evaluateSingletonStringishArg(args[1]!, context, span, normalized)),
          ),
        ),
      ];
    case 'fn:upper-case': {
      requireArity(normalized, args, 1, span);
      return [createXdmString(itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized)).toUpperCase())];
    }
    case 'fn:lower-case': {
      requireArity(normalized, args, 1, span);
      return [createXdmString(itemToStringValue(evaluateSingletonStringishArg(args[0]!, context, span, normalized)).toLowerCase())];
    }
    case 'fn:number': {
      const item = evaluateOptionalSingletonItemArg(normalized, args, context, span);
      return [createXdmNumber(itemToNumberValue(item))];
    }
    case 'fn:sum': {
      requireArity(normalized, args, 1, span);
      const values = atomizedNumericValues(evaluateExpression(args[0]!, context), span, normalized);
      return [createXdmNumber(values.reduce((total, value) => total + value, 0))];
    }
    case 'fn:min': {
      requireArity(normalized, args, 1, span);
      const values = atomizedNumericValues(evaluateExpression(args[0]!, context), span, normalized);
      return values.length === 0 ? [] : [createXdmNumber(Math.min(...values))];
    }
    case 'fn:max': {
      requireArity(normalized, args, 1, span);
      const values = atomizedNumericValues(evaluateExpression(args[0]!, context), span, normalized);
      return values.length === 0 ? [] : [createXdmNumber(Math.max(...values))];
    }
    case 'fn:avg': {
      requireArity(normalized, args, 1, span);
      const values = atomizedNumericValues(evaluateExpression(args[0]!, context), span, normalized);
      return values.length === 0
        ? []
        : [createXdmNumber(values.reduce((total, value) => total + value, 0) / values.length)];
    }
    case 'fn:distinct-values': {
      requireArity(normalized, args, 1, span);
      const items = atomizeItems(evaluateExpression(args[0]!, context));
      const distinct = new Set<string>();
      const results: XdmAtomicValue[] = [];
      for (const item of items) {
        const key = `${typeof item}:${String(item)}`;
        if (distinct.has(key)) {
          continue;
        }
        distinct.add(key);
        results.push(createAtomicValueFromAtomized(item));
      }
      return results;
    }
    case 'fn:data':
      requireArity(normalized, args, 1, span);
      return atomizeItems(evaluateExpression(args[0]!, context)).map(createAtomicValueFromAtomized);
    case 'fn:root': {
      const item = evaluateOptionalSingletonNodeArg(normalized, args, context, span);
      if (item === undefined) {
        return [];
      }
      return [getRootNode(item)];
    }
    case 'fn:reverse':
      requireArity(normalized, args, 1, span);
      return [...evaluateExpression(args[0]!, context)].reverse();
    case 'fn:head': {
      requireArity(normalized, args, 1, span);
      const items = evaluateExpression(args[0]!, context);
      return items.length === 0 ? [] : [items[0]!];
    }
    case 'fn:tail': {
      requireArity(normalized, args, 1, span);
      const items = evaluateExpression(args[0]!, context);
      return items.slice(1);
    }
    case 'fn:subsequence': {
      if (args.length !== 2 && args.length !== 3) {
        throw createXPathError(XPST0017, `Function ${normalized} expects 2 or 3 arguments but got ${args.length}.`, span);
      }
      const items = evaluateExpression(args[0]!, context);
      const start = Math.trunc(requireSingleNumber(evaluateExpression(args[1]!, context), span));
      const zeroBasedStart = Math.max(start - 1, 0);
      if (args.length === 2) {
        return items.slice(zeroBasedStart);
      }
      const length = Math.max(Math.trunc(requireSingleNumber(evaluateExpression(args[2]!, context), span)), 0);
      return items.slice(zeroBasedStart, zeroBasedStart + length);
    }
    case 'fn:name': {
      const item = evaluateOptionalSingletonNodeArg(normalized, args, context, span);
      return [createXdmString(getNodeNameValue(item))];
    }
    case 'fn:local-name': {
      const item = evaluateOptionalSingletonNodeArg(normalized, args, context, span);
      return [createXdmString(getLocalNameValue(item))];
    }
    case 'fn:true':
      requireArity(normalized, args, 0, span);
      return [createXdmBoolean(true)];
    case 'fn:false':
      requireArity(normalized, args, 0, span);
      return [createXdmBoolean(false)];
    case 'fn:abs':
      requireArity(normalized, args, 1, span);
      return [createXdmNumber(Math.abs(requireSingleNumber(evaluateExpression(args[0]!, context), span)))];
    case 'fn:floor':
      requireArity(normalized, args, 1, span);
      return [createXdmNumber(Math.floor(requireSingleNumber(evaluateExpression(args[0]!, context), span)))];
    case 'fn:ceiling':
      requireArity(normalized, args, 1, span);
      return [createXdmNumber(Math.ceil(requireSingleNumber(evaluateExpression(args[0]!, context), span)))];
    case 'fn:round':
      requireArity(normalized, args, 1, span);
      return [createXdmNumber(Math.round(requireSingleNumber(evaluateExpression(args[0]!, context), span)))];
    default:
      throw createXPathError(XPST0017, `Unknown function ${callee} with arity ${args.length}.`, span);
  }
}

function evaluateBinaryExpression(
  operator: XPathBinaryOperator,
  leftAst: XPathAst,
  rightAst: XPathAst,
  context: DynamicContext,
  span: SpanLike,
): XdmItem[] {
  if (operator === 'and') {
    const leftValue = effectiveBooleanValue(evaluateExpression(leftAst, context), leftAst.span);
    if (!leftValue) {
      return [createXdmBoolean(false)];
    }
    return [createXdmBoolean(effectiveBooleanValue(evaluateExpression(rightAst, context), rightAst.span))];
  }

  if (operator === 'or') {
    const leftValue = effectiveBooleanValue(evaluateExpression(leftAst, context), leftAst.span);
    if (leftValue) {
      return [createXdmBoolean(true)];
    }
    return [createXdmBoolean(effectiveBooleanValue(evaluateExpression(rightAst, context), rightAst.span))];
  }

  if (operator === '+' || operator === '-' || operator === '*' || operator === 'div' || operator === 'mod') {
    const left = requireSingleNumber(evaluateExpression(leftAst, context), leftAst.span);
    const right = requireSingleNumber(evaluateExpression(rightAst, context), rightAst.span);
    if ((operator === 'div' || operator === 'mod') && right === 0) {
      throw createXPathError(FOAR0001, 'Division by zero.', span);
    }

    switch (operator) {
      case '+':
        return [createXdmNumber(left + right)];
      case '-':
        return [createXdmNumber(left - right)];
      case '*':
        return [createXdmNumber(left * right)];
      case 'div':
        return [createXdmNumber(left / right)];
      case 'mod':
        return [createXdmNumber(left % right)];
    }
  }

  if (operator === 'to') {
    return evaluateRangeExpression(leftAst, rightAst, context);
  }

  if (operator === 'eq' || operator === 'ne' || operator === 'lt' || operator === 'le' || operator === 'gt' || operator === 'ge') {
    return compareValue(
      operator,
      evaluateExpression(leftAst, context),
      evaluateExpression(rightAst, context),
      span,
    );
  }

  if (operator === 'is' || operator === '<<' || operator === '>>') {
    return compareNodes(
      operator,
      evaluateExpression(leftAst, context),
      evaluateExpression(rightAst, context),
      span,
    );
  }

  return [
    createXdmBoolean(
      compareGeneral(
        operator,
        evaluateExpression(leftAst, context),
        evaluateExpression(rightAst, context),
        span,
      ),
    ),
  ];
}

function evaluateRangeExpression(
  leftAst: XPathAst,
  rightAst: XPathAst,
  context: DynamicContext,
): XdmItem[] {
  const start = requireSingleInteger(evaluateExpression(leftAst, context), leftAst.span, 'Range expression start');
  const end = requireSingleInteger(evaluateExpression(rightAst, context), rightAst.span, 'Range expression end');

  if (start > end) {
    return [];
  }

  const items: XdmItem[] = [];
  for (let value = start; value <= end; value += 1) {
    items.push(createXdmNumber(value));
  }
  return items;
}

function compareNodes(
  operator: 'is' | '<<' | '>>',
  leftItems: readonly XdmItem[],
  rightItems: readonly XdmItem[],
  span: SpanLike,
): XdmItem[] {
  const left = requireSingletonNode(leftItems, span, 'left');
  const right = requireSingletonNode(rightItems, span, 'right');

  if (left === undefined || right === undefined) {
    return [];
  }

  if (operator === 'is') {
    return [createXdmBoolean(left.node === right.node)];
  }

  const order = compareNodeOrder(left.node, right.node);
  return [createXdmBoolean(operator === '<<' ? order < 0 : order > 0)];
}

function compareValue(
  operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge',
  leftItems: readonly XdmItem[],
  rightItems: readonly XdmItem[],
  span: SpanLike,
): XdmItem[] {
  const leftValue = atomizeSingleton(leftItems, span);
  const rightValue = atomizeSingleton(rightItems, span);

  if (leftValue === undefined || rightValue === undefined) {
    return [];
  }

  return [createXdmBoolean(compareValueOperands(operator, leftValue, rightValue, span))];
}

function evaluatePath(ast: PathExpression, context: DynamicContext): XdmNode[] {
  let nodes = ast.absolute
    ? [getRootNode(requireContextNode(context, ast.span))]
    : [requireContextNode(context, ast.span)];

  if (ast.absolute && ast.steps.length === 0) {
    return nodes;
  }

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
      return predicateMatches(predicateResult, index + 1, predicate.span);
    });
  }

  return selected;
}

function selectAxis(step: StepExpression, node: Node): XdmNode[] {
  switch (step.axis) {
    case 'ancestor':
      return collectAncestors(node, false).map(createXdmNode);
    case 'ancestor-or-self':
      return collectAncestors(node, true).map(createXdmNode);
    case 'attribute':
      return collectAttributes(node).map(createXdmNode);
    case 'child':
      return collectChildren(node).map(createXdmNode);
    case 'descendant':
      return collectDescendants(node).map(createXdmNode);
    case 'descendant-or-self':
      return collectDescendantsOrSelf(node).map(createXdmNode);
    case 'following':
      return collectFollowingNodes(node).map(createXdmNode);
    case 'following-sibling':
      return collectFollowingSiblings(node).map(createXdmNode);
    case 'parent':
      return collectParent(node).map(createXdmNode);
    case 'preceding':
      return collectPrecedingNodes(node).map(createXdmNode);
    case 'preceding-sibling':
      return collectPrecedingSiblings(node).map(createXdmNode);
    case 'self':
      return [createXdmNode(node)];
  }
}

function matchesNodeTest(step: StepExpression, node: Node): boolean {
  if (step.nodeTest.kind === 'wildcardTest') {
    return true;
  }
  if (step.nodeTest.kind === 'kindTest') {
    return step.nodeTest.name === 'node' ? true : node.nodeType === 3;
  }
  return node.nodeName === step.nodeTest.name;
}

function predicateMatches(result: readonly XdmItem[], position: number, span: SpanLike): boolean {
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

  return effectiveBooleanValue(result, span);
}

function requireSingleNumber(items: readonly XdmItem[], span: SpanLike): number {
  const item = items[0];
  if (
    items.length !== 1 ||
    item?.xdmKind !== 'atomic' ||
    (item as XdmAtomicValue).type !== 'xs:double'
  ) {
    throw createXPathError(XPTY0004, 'Expected a single numeric value.', span);
  }
  return (item as XdmAtomicValue).value as number;
}

function requireSingleInteger(items: readonly XdmItem[], span: SpanLike, description: string): number {
  const value = requireSingleNumber(items, span);
  if (!Number.isInteger(value)) {
    throw createXPathError(XPTY0004, `${description} must be an integer in this slice.`, span);
  }
  return value;
}

function requireContextItem(context: DynamicContext, span: SpanLike): XdmItem {
  const items = coerceValueToItems(context.contextItem, span);
  const item = items[0];
  if (item === undefined) {
    throw createXPathError(XPDY0002, 'The XPath expression requires a context item.', span);
  }
  if (items.length !== 1) {
    throw createXPathError(XPTY0004, 'The XPath expression requires a single context item.', span);
  }
  return item;
}

function requireContextNode(context: DynamicContext, span: SpanLike): XdmNode {
  const item = requireContextItem(context, span);
  if (!isXdmNode(item)) {
    throw createXPathError(XPDY0002, 'The XPath expression requires a context node.', span);
  }
  return item;
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

function isXdmAtomicValue(value: unknown): value is XdmAtomicValue {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'xdmKind' in value &&
    value.xdmKind === 'atomic'
  );
}

function isXdmSequence(value: unknown): value is XdmSequence {
  return (
    value !== null &&
    value !== undefined &&
    typeof value === 'object' &&
    'toArray' in value &&
    typeof (value as XdmSequence).toArray === 'function'
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

function collectDescendants(node: Node): Node[] {
  const items: Node[] = [];
  for (const child of collectChildren(node)) {
    items.push(child);
    items.push(...collectDescendants(child));
  }
  return items;
}

function collectDescendantsOrSelf(node: Node): Node[] {
  return [node, ...collectDescendants(node)];
}

function collectParent(node: Node): Node[] {
  return node.parentNode === null ? [] : [node.parentNode];
}

function collectAncestors(node: Node, includeSelf: boolean): Node[] {
  const items: Node[] = [];

  if (includeSelf) {
    items.push(node);
  }

  let current = node.parentNode;
  while (current !== null) {
    items.push(current);
    current = current.parentNode;
  }

  return items;
}

function collectFollowingSiblings(node: Node): Node[] {
  const parent = node.parentNode;
  if (parent === null) {
    return [];
  }

  const siblings = parent.childNodes;
  const items: Node[] = [];
  let seenCurrent = false;
  for (let index = 0; index < siblings.length; index += 1) {
    const sibling = siblings.item(index);
    if (sibling === null) {
      continue;
    }
    if (seenCurrent) {
      items.push(sibling);
      continue;
    }
    if (sibling === node) {
      seenCurrent = true;
    }
  }

  return items;
}

function collectPrecedingSiblings(node: Node): Node[] {
  const parent = node.parentNode;
  if (parent === null) {
    return [];
  }

  const siblings = parent.childNodes;
  const items: Node[] = [];
  for (let index = 0; index < siblings.length; index += 1) {
    const sibling = siblings.item(index);
    if (sibling === null) {
      continue;
    }
    if (sibling === node) {
      break;
    }
    items.push(sibling);
  }

  return items.reverse();
}

function collectFollowingNodes(node: Node): Node[] {
  const items: Node[] = [];
  let current: Node | null = node;

  while (current !== null && current.parentNode !== null) {
    for (const sibling of collectFollowingSiblings(current)) {
      items.push(sibling);
      items.push(...collectDescendants(sibling));
    }
    current = current.parentNode;
  }

  return items;
}

function collectPrecedingNodes(node: Node): Node[] {
  const items: Node[] = [];
  let current: Node | null = node;

  while (current !== null && current.parentNode !== null) {
    for (const sibling of collectPrecedingSiblings(current)) {
      items.push(...collectDescendantsOrSelfReverse(sibling));
    }
    current = current.parentNode;
  }

  return items;
}

function collectDescendantsOrSelfReverse(node: Node): Node[] {
  const items: Node[] = [];
  for (const child of collectChildren(node).reverse()) {
    items.push(...collectDescendantsOrSelfReverse(child));
  }
  items.push(node);
  return items;
}

function resolveVariableReference(name: string, context: DynamicContext, span: SpanLike): XdmItem[] {
  const value = context.variables.get(name) ?? context.variables.get(`{}${name}`);
  if (value === undefined) {
    throw createXPathError(XPST0008, `Unknown variable $${name}.`, span);
  }
  return coerceValueToItems(value, span);
}

function coerceValueToItems(value: unknown, span: SpanLike): XdmItem[] {
  if (value === null || value === undefined) {
    return [];
  }

  if (isXdmSequence(value)) {
    return [...materialize(value)];
  }

  if (isXdmNode(value) || isXdmAtomicValue(value)) {
    return [value];
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => coerceValueToItems(entry, span));
  }

  if (typeof value === 'boolean') {
    return [createXdmBoolean(value)];
  }

  if (typeof value === 'number') {
    return [createXdmNumber(value)];
  }

  if (typeof value === 'string') {
    return [createXdmString(value)];
  }

  throw createXPathError(XPTY0004, 'Unsupported external value in the dynamic context.', span);
}

function effectiveBooleanValue(items: readonly XdmItem[], span: SpanLike): boolean {
  if (items.length === 0) {
    return false;
  }

  if (items.every((item) => item.xdmKind === 'node')) {
    return true;
  }

  if (items.length !== 1 || items[0]?.xdmKind !== 'atomic') {
    throw createXPathError(XPTY0004, 'Expected an effective boolean value.', span);
  }

  const atomic = items[0] as XdmAtomicValue;
  if (atomic.type === 'xs:boolean') {
    return atomic.value as boolean;
  }
  if (atomic.type === 'xs:double') {
    return (atomic.value as number) !== 0 && !Number.isNaN(atomic.value as number);
  }
  return (atomic.value as string).length > 0;
}

function evaluateOptionalSingletonItemArg(
  name: string,
  args: readonly XPathAst[],
  context: DynamicContext,
  span: SpanLike,
): XdmItem | undefined {
  if (args.length === 0) {
    return requireContextItem(context, span);
  }

  requireArity(name, args, 1, span);
  const items = evaluateExpression(args[0]!, context);
  if (items.length === 0) {
    return undefined;
  }
  if (items.length !== 1) {
    throw createXPathError(XPTY0004, `Function ${name} requires an empty sequence or singleton item.`, span);
  }
  return items[0];
}

function evaluateOptionalSingletonNodeArg(
  name: string,
  args: readonly XPathAst[],
  context: DynamicContext,
  span: SpanLike,
): XdmNode | undefined {
  const item = evaluateOptionalSingletonItemArg(name, args, context, span);
  if (item === undefined) {
    return undefined;
  }
  if (!isXdmNode(item)) {
    throw createXPathError(XPTY0004, `Function ${name} requires a node argument.`, span);
  }
  return item;
}

function evaluateSingletonStringishArg(
  arg: XPathAst,
  context: DynamicContext,
  span: SpanLike,
  name: string,
): XdmItem | undefined {
  const items = evaluateExpression(arg, context);
  if (items.length === 0) {
    return undefined;
  }
  if (items.length !== 1) {
    throw createXPathError(XPTY0004, `Function ${name} requires empty-sequence() or a singleton item argument.`, span);
  }
  return items[0];
}

function itemToStringValue(item: XdmItem | undefined): string {
  if (item === undefined) {
    return '';
  }

  if (item.xdmKind === 'node') {
    return (item as XdmNode).node.textContent ?? '';
  }

  const atomic = item as XdmAtomicValue;
  if (atomic.type === 'xs:boolean') {
    return atomic.value === true ? 'true' : 'false';
  }

  return String(atomic.value);
}

function itemToNumberValue(item: XdmItem | undefined): number {
  if (item === undefined) {
    return Number.NaN;
  }

  if (item.xdmKind === 'node') {
    return Number((item as XdmNode).node.textContent ?? '');
  }

  const atomic = item as XdmAtomicValue;
  if (atomic.type === 'xs:boolean') {
    return atomic.value === true ? 1 : 0;
  }

  return Number(atomic.value);
}

function createAtomicValueFromAtomized(value: boolean | number | string): XdmAtomicValue {
  if (typeof value === 'boolean') {
    return createXdmBoolean(value);
  }

  if (typeof value === 'number') {
    return createXdmNumber(value);
  }

  return createXdmString(value);
}

function normalizeSpace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function compileRegex(pattern: string, flags: string, span: SpanLike, global = false): RegExp {
  const ecmaFlags = toEcmaRegexFlags(flags, span, global);
  try {
    return new RegExp(pattern, ecmaFlags);
  } catch {
    throw createXPathError(FOCA0002, 'Invalid regular expression for the current ECMAScript-compatible regex slice.', span);
  }
}

function toEcmaRegexFlags(flags: string, span: SpanLike, global: boolean): string {
  let result = global ? 'g' : '';

  for (const flag of flags) {
    if (flag === 'i' || flag === 'm' || flag === 's') {
      if (!result.includes(flag)) {
        result += flag;
      }
      continue;
    }

    throw createXPathError(
      FOCA0002,
      `Unsupported regular expression flag ${flag} in the current ECMAScript-compatible regex slice.`,
      span,
    );
  }

  return result;
}

function getNodeNameValue(node: XdmNode | undefined): string {
  if (node === undefined) {
    return '';
  }

  const rawName = node.node.nodeName;
  return rawName.startsWith('#') ? '' : rawName;
}

function getLocalNameValue(node: XdmNode | undefined): string {
  const name = getNodeNameValue(node);
  if (name.length === 0) {
    return '';
  }

  const separator = name.indexOf(':');
  return separator >= 0 ? name.slice(separator + 1) : name;
}

function compareGeneral(
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=',
  leftItems: readonly XdmItem[],
  rightItems: readonly XdmItem[],
  span: SpanLike,
): boolean {
  const leftValues = atomizeItems(leftItems);
  const rightValues = atomizeItems(rightItems);

  for (const left of leftValues) {
    for (const right of rightValues) {
      if (compareAtomicValues(operator, left, right, span)) {
        return true;
      }
    }
  }

  return false;
}

function atomizeItems(items: readonly XdmItem[]): readonly (boolean | number | string)[] {
  return items.map((item) => {
    if (item.xdmKind === 'node') {
      return (item as XdmNode).node.textContent ?? '';
    }

    return (item as XdmAtomicValue).value;
  });
}

function atomizedNumericValues(items: readonly XdmItem[], span: SpanLike, functionName: string): number[] {
  return atomizeItems(items).map((value) => {
    if (typeof value === 'boolean') {
      throw createXPathError(XPTY0004, `Function ${functionName} requires numeric values after atomization.`, span);
    }

    const numericValue = coerceNumericValue(value);
    if (numericValue === undefined) {
      throw createXPathError(XPTY0004, `Function ${functionName} requires numeric values after atomization.`, span);
    }

    return numericValue;
  });
}

function compareAtomicValues(
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=',
  left: boolean | number | string,
  right: boolean | number | string,
  span: SpanLike,
): boolean {
  if (typeof left === 'boolean' || typeof right === 'boolean') {
    if (typeof left !== 'boolean' || typeof right !== 'boolean') {
      throw createXPathError(XPTY0004, 'Boolean comparisons require boolean operands.', span);
    }

    switch (operator) {
      case '=':
        return left === right;
      case '!=':
        return left !== right;
      default:
        throw createXPathError(XPTY0004, 'Relational comparison is not defined for booleans in this slice.', span);
    }
  }

  const numericLeft = coerceNumericValue(left);
  const numericRight = coerceNumericValue(right);
  if (numericLeft !== undefined && numericRight !== undefined) {
    return compareScalars(operator, numericLeft, numericRight);
  }

  return compareScalars(operator, String(left), String(right));
}

function atomizeSingleton(
  items: readonly XdmItem[],
  span: SpanLike,
): boolean | number | string | undefined {
  if (items.length === 0) {
    return undefined;
  }

  if (items.length !== 1) {
    throw createXPathError(XPTY0004, 'Value comparisons require singleton operands.', span);
  }

  const [item] = items;
  if (item?.xdmKind === 'node') {
    return (item as XdmNode).node.textContent ?? '';
  }

  return (item as XdmAtomicValue).value;
}

function requireSingletonNode(
  items: readonly XdmItem[],
  span: SpanLike,
  side: 'left' | 'right',
): XdmNode | undefined {
  if (items.length === 0) {
    return undefined;
  }

  if (items.length !== 1 || items[0]?.xdmKind !== 'node') {
    throw createXPathError(XPTY0004, `Node comparisons require a singleton node on the ${side} side.`, span);
  }

  return items[0] as XdmNode;
}

function compareNodeOrder(left: Node, right: Node): number {
  if (left === right) {
    return 0;
  }

  const leftPath = getDocumentOrderPath(left);
  const rightPath = getDocumentOrderPath(right);
  const length = Math.min(leftPath.length, rightPath.length);

  for (let index = 0; index < length; index += 1) {
    const leftPart = leftPath[index]!;
    const rightPart = rightPath[index]!;
    if (leftPart !== rightPart) {
      return leftPart < rightPart ? -1 : 1;
    }
  }

  return leftPath.length < rightPath.length ? -1 : 1;
}

function getDocumentOrderPath(node: Node): readonly number[] {
  const path: number[] = [];
  let current: Node | null = node;

  while (current !== null) {
    path.unshift(getNodeSiblingIndex(current));
    current = current.parentNode;
  }

  return path;
}

function getNodeSiblingIndex(node: Node): number {
  const parent = node.parentNode;
  if (parent === null) {
    return 0;
  }

  const siblings = parent.childNodes;
  for (let index = 0; index < siblings.length; index += 1) {
    if (siblings.item(index) === node) {
      return index;
    }
  }

  return 0;
}

function compareValueOperands(
  operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge',
  left: boolean | number | string,
  right: boolean | number | string,
  span: SpanLike,
): boolean {
  if (typeof left === 'boolean' || typeof right === 'boolean') {
    if (typeof left !== 'boolean' || typeof right !== 'boolean') {
      throw createXPathError(XPTY0004, 'Value comparisons require matching operand types.', span);
    }

    if (operator !== 'eq' && operator !== 'ne') {
      throw createXPathError(XPTY0004, 'Relational value comparisons are not defined for booleans.', span);
    }

    return compareScalars(operator, left, right);
  }

  if (typeof left === 'number' || typeof right === 'number') {
    if (typeof left !== 'number' || typeof right !== 'number') {
      throw createXPathError(XPTY0004, 'Value comparisons require matching operand types.', span);
    }

    return compareScalars(operator, left, right);
  }

  return compareScalars(operator, left, right);
}

function coerceNumericValue(value: number | string): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function compareScalars<T extends boolean | number | string>(
  operator: '=' | '!=' | '<' | '<=' | '>' | '>=' | 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge',
  left: T,
  right: T,
): boolean {
  switch (operator) {
    case '=':
    case 'eq':
      return left === right;
    case '!=':
    case 'ne':
      return left !== right;
    case '<':
    case 'lt':
      return left < right;
    case '<=':
    case 'le':
      return left <= right;
    case '>':
    case 'gt':
      return left > right;
    case '>=':
    case 'ge':
      return left >= right;
  }
}

function createXPathError(code: string, message: string, span: SpanLike): XPathError {
  return new XPathError(code, message, {
    source: '<xpath>',
    line: span.line,
    column: span.column,
    offset: span.start,
    endLine: span.endLine,
    endColumn: span.endColumn,
    endOffset: span.end,
  });
}

function requireArity(name: string, args: readonly XPathAst[], expected: number, span: SpanLike): void {
  if (args.length !== expected) {
    throw createXPathError(XPST0017, `Function ${name} expects ${expected} arguments but got ${args.length}.`, span);
  }
}
