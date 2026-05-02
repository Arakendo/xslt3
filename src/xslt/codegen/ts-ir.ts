export interface TsModule {
  readonly statements: readonly string[];
}

export interface TsExpression {
  readonly code: string;
}

export function tsRawExpression(code: string): TsExpression {
  return { code };
}

export function tsStringLiteral(value: string): TsExpression {
  return { code: JSON.stringify(value) };
}

export function tsCallExpression(callee: string, args: readonly TsExpression[]): TsExpression {
  return {
    code: `${callee}(${args.map((arg) => arg.code).join(', ')})`,
  };
}

export function tsBinaryExpression(left: TsExpression, operator: string, right: TsExpression): TsExpression {
  return {
    code: `(${left.code} ${operator} ${right.code})`,
  };
}

export function tsConditionalExpression(
  test: TsExpression,
  whenTrue: TsExpression,
  whenFalse: TsExpression,
): TsExpression {
  return {
    code: `(${test.code} ? ${whenTrue.code} : ${whenFalse.code})`,
  };
}

export function tsConcatExpression(expressions: readonly TsExpression[]): TsExpression {
  const nonEmptyExpressions = expressions.filter((expression) => expression.code.length > 0 && expression.code !== '""');

  if (nonEmptyExpressions.length === 0) {
    return tsStringLiteral('');
  }

  if (nonEmptyExpressions.length === 1) {
    return nonEmptyExpressions[0] ?? tsStringLiteral('');
  }

  return {
    code: nonEmptyExpressions.map((expression) => expression.code).join(' +\n    '),
  };
}

export function renderTsExpression(expression: TsExpression): string {
  return expression.code;
}

export function renderTsModule(module: TsModule): string {
  return `${module.statements.join('\n')}\n`;
}