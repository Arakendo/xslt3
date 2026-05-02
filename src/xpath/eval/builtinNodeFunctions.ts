import { createXdmQName, createXdmString, type XdmItem, type XdmNode } from '../../xdm/types.js';
import type { DynamicContext } from './context.js';
import type { XPathAst } from '../parse/ast.js';
import { getRootNode } from './navigation.js';
import { getLocalNameValue, getNamespaceUriValue, getNodeNameValue } from './names.js';

type SpanLike = {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly end: number;
};

type BuiltinNodeSupport = {
  evaluateOptionalSingletonNodeArg(name: string, args: readonly XPathAst[], context: DynamicContext, span: SpanLike): XdmNode | undefined;
  getGeneratedNodeId(item: XdmNode | undefined): string;
};

export function createBuiltinNodeFunctionEvaluator(
  support: BuiltinNodeSupport,
): {
  evaluateNodeBuiltinFunction(normalized: string, args: readonly XPathAst[], context: DynamicContext, span: SpanLike): XdmItem[] | undefined;
} {
  function evaluateNodeBuiltinFunction(
    normalized: string,
    args: readonly XPathAst[],
    context: DynamicContext,
    span: SpanLike,
  ): XdmItem[] | undefined {
    switch (normalized) {
      case 'fn:root': {
        const item = support.evaluateOptionalSingletonNodeArg(normalized, args, context, span);
        if (item === undefined) {
          return [];
        }
        return [getRootNode(item)];
      }
      case 'fn:name': {
        const item = support.evaluateOptionalSingletonNodeArg(normalized, args, context, span);
        return [createXdmString(getNodeNameValue(item))];
      }
      case 'fn:local-name': {
        const item = support.evaluateOptionalSingletonNodeArg(normalized, args, context, span);
        return [createXdmString(getLocalNameValue(item))];
      }
      case 'fn:namespace-uri': {
        const item = support.evaluateOptionalSingletonNodeArg(normalized, args, context, span);
        return [createXdmString(getNamespaceUriValue(item))];
      }
      case 'fn:generate-id': {
        const item = support.evaluateOptionalSingletonNodeArg(normalized, args, context, span);
        return [createXdmString(support.getGeneratedNodeId(item))];
      }
      case 'fn:node-name': {
        const item = support.evaluateOptionalSingletonNodeArg(normalized, args, context, span);
        const name = getNodeNameValue(item);
        return name.length === 0 ? [] : [createXdmQName(name)];
      }
      default:
        return undefined;
    }
  }

  return {
    evaluateNodeBuiltinFunction,
  };
}