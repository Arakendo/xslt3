import { FORG0005 } from '../../errors/codes.js';
import { createXdmBoolean, createXdmInteger, type XdmItem } from '../../xdm/types.js';
import type { DynamicContext } from './context.js';
import type { XPathAst } from '../parse/ast.js';

type SpanLike = {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly end: number;
};

type BuiltinSequenceFunctionHelpers = {
  evaluateExpression(ast: XPathAst, context: DynamicContext): XdmItem[];
  requireArity(name: string, args: readonly XPathAst[], expected: number, span: SpanLike): void;
  throwArityError(name: string, actualArity: number, arityRequirement: string, span: SpanLike): never;
  createXPathError(code: string, message: string, span: SpanLike, details?: Readonly<Record<string, unknown>>): Error;
  describeItemsType(items: readonly XdmItem[]): string;
  requireContextItem(context: DynamicContext, span: SpanLike): XdmItem;
  requireSingleNumber(items: readonly XdmItem[], span: SpanLike): number;
};

type BuiltinSequenceSupport = {
  xpathRound(value: number): number;
};

export function createBuiltinSequenceFunctionEvaluator(
  helpers: BuiltinSequenceFunctionHelpers,
  support: BuiltinSequenceSupport,
): {
  evaluateSequenceBuiltinFunction(normalized: string, args: readonly XPathAst[], context: DynamicContext, span: SpanLike): XdmItem[] | undefined;
} {
  function evaluateSequenceBuiltinFunction(
    normalized: string,
    args: readonly XPathAst[],
    context: DynamicContext,
    span: SpanLike,
  ): XdmItem[] | undefined {
    switch (normalized) {
      case 'fn:position':
        helpers.requireArity(normalized, args, 0, span);
        helpers.requireContextItem(context, span);
        return [createXdmInteger(context.contextPosition)];
      case 'fn:last':
        helpers.requireArity(normalized, args, 0, span);
        helpers.requireContextItem(context, span);
        return [createXdmInteger(context.contextSize)];
      case 'fn:count':
        helpers.requireArity(normalized, args, 1, span);
        return [createXdmInteger(helpers.evaluateExpression(args[0]!, context).length)];
      case 'fn:exists':
        helpers.requireArity(normalized, args, 1, span);
        return [createXdmBoolean(helpers.evaluateExpression(args[0]!, context).length > 0)];
      case 'fn:empty':
        helpers.requireArity(normalized, args, 1, span);
        return [createXdmBoolean(helpers.evaluateExpression(args[0]!, context).length === 0)];
      case 'fn:exactly-one': {
        helpers.requireArity(normalized, args, 1, span);
        const items = helpers.evaluateExpression(args[0]!, context);
        if (items.length !== 1) {
          throw helpers.createXPathError(FORG0005, 'Function fn:exactly-one requires exactly one item.', span, {
            functionName: normalized,
            expectedType: 'exactly one item()',
            actualType: helpers.describeItemsType(items),
          });
        }
        return [items[0]!];
      }
      case 'fn:one-or-more': {
        helpers.requireArity(normalized, args, 1, span);
        const items = helpers.evaluateExpression(args[0]!, context);
        if (items.length === 0) {
          throw helpers.createXPathError(FORG0005, 'Function fn:one-or-more requires at least one item.', span, {
            functionName: normalized,
            expectedType: 'one or more item()',
            actualType: helpers.describeItemsType(items),
          });
        }
        return items;
      }
      case 'fn:zero-or-one': {
        helpers.requireArity(normalized, args, 1, span);
        const items = helpers.evaluateExpression(args[0]!, context);
        if (items.length > 1) {
          throw helpers.createXPathError(FORG0005, 'Function fn:zero-or-one requires zero or one item.', span, {
            functionName: normalized,
            expectedType: 'zero or one item()',
            actualType: helpers.describeItemsType(items),
          });
        }
        return items;
      }
      case 'fn:reverse':
        helpers.requireArity(normalized, args, 1, span);
        return [...helpers.evaluateExpression(args[0]!, context)].reverse();
      case 'fn:head': {
        helpers.requireArity(normalized, args, 1, span);
        const items = helpers.evaluateExpression(args[0]!, context);
        return items.length === 0 ? [] : [items[0]!];
      }
      case 'fn:tail': {
        helpers.requireArity(normalized, args, 1, span);
        const items = helpers.evaluateExpression(args[0]!, context);
        return items.slice(1);
      }
      case 'fn:remove': {
        helpers.requireArity(normalized, args, 2, span);
        const items = helpers.evaluateExpression(args[0]!, context);
        const position = Math.trunc(helpers.requireSingleNumber(helpers.evaluateExpression(args[1]!, context), span));
        if (position < 1 || position > items.length) {
          return items;
        }
        return items.filter((_, index) => index !== position - 1);
      }
      case 'fn:subsequence': {
        if (args.length !== 2 && args.length !== 3) {
          helpers.throwArityError(normalized, args.length, '2..3', span);
        }
        const items = helpers.evaluateExpression(args[0]!, context);
        const start = support.xpathRound(helpers.requireSingleNumber(helpers.evaluateExpression(args[1]!, context), span));
        if (args.length === 2) {
          return items.filter((_, index) => index + 1 >= start);
        }
        const length = support.xpathRound(helpers.requireSingleNumber(helpers.evaluateExpression(args[2]!, context), span));
        const end = start + length;
        return items.filter((_, index) => {
          const position = index + 1;
          return position >= start && position < end;
        });
      }
      default:
        return undefined;
    }
  }

  return {
    evaluateSequenceBuiltinFunction,
  };
}