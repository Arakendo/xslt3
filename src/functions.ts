export type XsltFunctionImplementation = (...args: readonly unknown[]) => unknown;

export interface DefinedXsltFunctions<TFunctions extends Readonly<Record<string, XsltFunctionImplementation>>> {
  readonly namespaceUri: string;
  readonly functions: TFunctions;
}

export function defineXsltFunctions<const TFunctions extends Readonly<Record<string, XsltFunctionImplementation>>>(
  namespaceUri: string,
  functions: TFunctions,
): DefinedXsltFunctions<TFunctions> {
  return {
    namespaceUri,
    functions,
  };
}