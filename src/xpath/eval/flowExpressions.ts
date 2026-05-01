import { createXdmBoolean, type XdmItem } from '../../xdm/types.js';
import type { DynamicContext } from './context.js';
import type { XPathAst } from '../parse/ast.js';

type FlowBinding = {
  readonly name: string;
  readonly value: XPathAst;
};

type FlowExpressionDependencies = {
  evaluateExpression(ast: XPathAst, context: DynamicContext): XdmItem[];
  effectiveBooleanValue(items: readonly XdmItem[], span: XPathAst['span']): boolean;
};

export function createFlowExpressionEvaluator(dependencies: FlowExpressionDependencies): {
  evaluateLetExpression(bindings: readonly FlowBinding[], returnExpr: XPathAst, context: DynamicContext): XdmItem[];
  evaluateForExpression(bindings: readonly FlowBinding[], returnExpr: XPathAst, context: DynamicContext): XdmItem[];
  evaluateQuantifiedExpression(
    quantifier: 'some' | 'every',
    bindings: readonly FlowBinding[],
    satisfiesExpr: XPathAst,
    context: DynamicContext,
  ): boolean;
} {
  function evaluateLetExpression(
    bindings: readonly FlowBinding[],
    returnExpr: XPathAst,
    context: DynamicContext,
  ): XdmItem[] {
    const variables = new Map(context.variables);

    for (const binding of bindings) {
      variables.set(binding.name, dependencies.evaluateExpression(binding.value, { ...context, variables }));
    }

    return dependencies.evaluateExpression(returnExpr, {
      ...context,
      variables,
    });
  }

  function evaluateForExpression(
    bindings: readonly FlowBinding[],
    returnExpr: XPathAst,
    context: DynamicContext,
  ): XdmItem[] {
    return evaluateFlowBindings(bindings, context, (variables) =>
      dependencies.evaluateExpression(returnExpr, {
        ...context,
        variables,
      }),
    );
  }

  function evaluateQuantifiedExpression(
    quantifier: 'some' | 'every',
    bindings: readonly FlowBinding[],
    satisfiesExpr: XPathAst,
    context: DynamicContext,
  ): boolean {
    if (quantifier === 'some') {
      return evaluateFlowBindings(bindings, context, (variables) => {
        const result = dependencies.effectiveBooleanValue(
          dependencies.evaluateExpression(satisfiesExpr, {
            ...context,
            variables,
          }),
          satisfiesExpr.span,
        );
        return result ? [createXdmBoolean(true)] : [];
      }).length > 0;
    }

    let sawBinding = false;
    const failures = evaluateFlowBindings(bindings, context, (variables) => {
      sawBinding = true;
      const result = dependencies.effectiveBooleanValue(
        dependencies.evaluateExpression(satisfiesExpr, {
          ...context,
          variables,
        }),
        satisfiesExpr.span,
      );
      return result ? [] : [createXdmBoolean(false)];
    });

    return sawBinding ? failures.length === 0 : true;
  }

  function evaluateFlowBindings(
    bindings: readonly FlowBinding[],
    context: DynamicContext,
    project: (variables: ReadonlyMap<string, unknown>) => XdmItem[],
    variables = new Map(context.variables),
    index = 0,
  ): XdmItem[] {
    if (index >= bindings.length) {
      return project(variables);
    }

    const binding = bindings[index]!;
    const input = dependencies.evaluateExpression(binding.value, {
      ...context,
      variables,
    });
    const results: XdmItem[] = [];
    for (const item of input) {
      const nextVariables = new Map(variables);
      nextVariables.set(binding.name, [item]);
      results.push(...evaluateFlowBindings(bindings, context, project, nextVariables, index + 1));
    }
    return results;
  }

  return {
    evaluateLetExpression,
    evaluateForExpression,
    evaluateQuantifiedExpression,
  };
}