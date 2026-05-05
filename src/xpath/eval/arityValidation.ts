import { XPST0017 } from '../../errors/codes.js';
import type { ErrorDetails } from '../../errors/XdmError.js';
import type { XPathAst } from '../parse/ast.js';

type SpanLike = {
  readonly line: number;
  readonly column: number;
  readonly start: number;
  readonly endLine: number;
  readonly endColumn: number;
  readonly end: number;
};

type CreateXPathError = (
  code: string,
  message: string,
  span: SpanLike,
  details?: ErrorDetails,
) => Error;

const EXACT_ARITY_NAMES = new Map<string, readonly string[]>([
  ['0', ['fn:position', 'fn:last', 'fn:error', 'fn:true', 'fn:false']],
  ['1', [
    'fn:count',
    'fn:exists',
    'fn:empty',
    'fn:exactly-one',
    'fn:one-or-more',
    'fn:zero-or-one',
    'fn:boolean',
    'fn:not',
    'fn:codepoints-to-string',
    'fn:upper-case',
    'fn:lower-case',
    'fn:min',
    'fn:max',
    'fn:avg',
    'fn:distinct-values',
    'fn:data',
    'fn:reverse',
    'fn:head',
    'fn:tail',
  ]],
  ['2', ['fn:deep-equal', 'fn:QName', 'fn:trace', 'map:entry', 'fn:remove', 'fn:contains', 'fn:starts-with', 'fn:ends-with']],
  ['3', ['fn:translate']],
]);

const RANGE_ARITY_NAMES = new Map<string, readonly string[]>([
  ['>=2', ['fn:concat']],
  ['0..1', ['fn:string', 'fn:string-length', 'fn:normalize-space', 'fn:number', 'fn:name', 'fn:local-name', 'fn:namespace-uri', 'fn:generate-id', 'fn:node-name', 'fn:root']],
  ['1..2', ['fn:string-join', 'fn:sum']],
  ['1..3', ['fn:tokenize']],
  ['2..3', ['fn:substring', 'fn:subsequence', 'fn:matches']],
  ['3..4', ['fn:replace']],
]);

const FUNCTION_ARITY_REQUIREMENTS = new Map<string, string>();

for (const [requirement, names] of EXACT_ARITY_NAMES) {
  for (const name of names) {
    FUNCTION_ARITY_REQUIREMENTS.set(name, requirement);
  }
}

for (const [requirement, names] of RANGE_ARITY_NAMES) {
  for (const name of names) {
    FUNCTION_ARITY_REQUIREMENTS.set(name, requirement);
  }
}

export function createArityValidationHelpers(createXPathError: CreateXPathError): {
  requireArity(name: string, args: readonly XPathAst[], expected: number, span: SpanLike): void;
  validateFunctionCallSignature(name: string, actualArity: number, span: SpanLike): void;
  throwArityError(name: string, actualArity: number, arityRequirement: string, span: SpanLike): never;
} {
  function requireArity(name: string, args: readonly XPathAst[], expected: number, span: SpanLike): void {
    if (args.length !== expected) {
      throwArityError(name, args.length, String(expected), span);
    }
  }

  function validateFunctionCallSignature(name: string, actualArity: number, span: SpanLike): void {
    const arityRequirement = FUNCTION_ARITY_REQUIREMENTS.get(name);

    if (arityRequirement === undefined) {
      throw createXPathError(XPST0017, `Unknown function ${name}.`, span, {
        functionName: name,
        actualArity,
      });
    }

    if (!matchesArityRequirement(actualArity, arityRequirement)) {
      throwArityError(name, actualArity, arityRequirement, span);
    }
  }

  function throwArityError(name: string, actualArity: number, arityRequirement: string, span: SpanLike): never {
    const requirementLabel = arityRequirement.includes('..')
      ? arityRequirement.replace('..', ' or ')
      : arityRequirement === '>=2'
        ? 'at least 2'
        : arityRequirement;
    throw createXPathError(XPST0017, `Function ${name} expects ${requirementLabel} arguments but got ${actualArity}.`, span, {
      functionName: name,
      actualArity,
      arityRequirement,
    });
  }

  return {
    requireArity,
    validateFunctionCallSignature,
    throwArityError,
  };
}

export function lookupFunctionArityRequirement(name: string): string | undefined {
  return FUNCTION_ARITY_REQUIREMENTS.get(name);
}

export function matchesArityRequirement(actualArity: number, arityRequirement: string): boolean {
  switch (arityRequirement) {
    case '0':
    case '1':
    case '2':
    case '3':
      return actualArity === Number(arityRequirement);
    case '>=2':
      return actualArity >= 2;
    case '0..1':
      return actualArity === 0 || actualArity === 1;
    case '1..2':
      return actualArity === 1 || actualArity === 2;
    case '1..3':
      return actualArity === 1 || actualArity === 2 || actualArity === 3;
    case '2..3':
      return actualArity === 2 || actualArity === 3;
    case '3..4':
      return actualArity === 3 || actualArity === 4;
    default:
      return false;
  }
}