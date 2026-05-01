import { XPTY0004 } from '../../errors/codes.js';
import { createXdmBoolean, type XdmItem, type XdmNode } from '../../xdm/types.js';
import { compareNodeOrder } from './navigation.js';

type SpanLike = {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly end: number;
};

type ComparisonEvaluationDependencies = {
  createXPathError(code: string, message: string, span: SpanLike, details?: Readonly<Record<string, unknown>>): Error;
  describeItemsType(items: readonly XdmItem[]): string;
  atomizeSingleton(items: readonly XdmItem[], span: SpanLike): boolean | number | string | undefined;
  compareValueOperands(
    operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge',
    left: boolean | number | string,
    right: boolean | number | string,
    span: SpanLike,
  ): boolean;
};

export function createComparisonEvaluator(dependencies: ComparisonEvaluationDependencies): {
  compareNodes(operator: 'is' | '<<' | '>>', leftItems: readonly XdmItem[], rightItems: readonly XdmItem[], span: SpanLike): XdmItem[];
  compareValue(
    operator: 'eq' | 'ne' | 'lt' | 'le' | 'gt' | 'ge',
    leftItems: readonly XdmItem[],
    rightItems: readonly XdmItem[],
    span: SpanLike,
  ): XdmItem[];
} {
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
    const leftValue = dependencies.atomizeSingleton(leftItems, span);
    const rightValue = dependencies.atomizeSingleton(rightItems, span);

    if (leftValue === undefined || rightValue === undefined) {
      return [];
    }

    return [createXdmBoolean(dependencies.compareValueOperands(operator, leftValue, rightValue, span))];
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
      throw dependencies.createXPathError(XPTY0004, `Node comparisons require a singleton node on the ${side} side.`, span, {
        expectedType: 'singleton node()',
        actualType: dependencies.describeItemsType(items),
        operandRole: side,
      });
    }

    return items[0] as XdmNode;
  }

  return {
    compareNodes,
    compareValue,
  };
}