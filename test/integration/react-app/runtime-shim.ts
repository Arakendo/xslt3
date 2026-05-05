export interface TransformContext {
  readonly initialTemplate?: string;
  readonly initialMode?: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
  readonly baseUri?: string;
}

export interface TransformResult {
  readonly output: string;
  readonly secondaryOutputs?: Readonly<Record<string, string>>;
}

export type StylesheetIR = unknown;

export function transformCompiledStylesheet(
  _ir: StylesheetIR,
  _sourceXml: string,
  _context: TransformContext = {},
): TransformResult {
  return { output: '' };
}