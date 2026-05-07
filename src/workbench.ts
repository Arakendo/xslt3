import { diagnosticReportFromError, sortDiagnostics, type DiagnosticReport } from './diagnostics/index.js';
import { compileStylesheetRuntimeArtifacts } from './processor/compile.js';
import { XsltProcessor } from './processor/XsltProcessor.js';
import type { TransformExecutionInfo, TransformExecutionFallbackReason, TransformOptions } from './processor/types.js';

export interface SourceDocument {
  readonly uri: string;
  readonly text: string;
}

export interface WorkbenchNoticeDetail {
  readonly key: string;
  readonly value: string;
}

export interface WorkbenchNoticeSuggestion {
  readonly kind: 'fix' | 'hint' | 'alternative';
  readonly label: string;
  readonly confidence?: number;
  readonly replacement?: string;
}

export interface WorkbenchNotice {
  readonly severity: 'warning';
  readonly code: 'native_fallback';
  readonly message: string;
  readonly details: readonly WorkbenchNoticeDetail[];
  readonly suggestions?: readonly WorkbenchNoticeSuggestion[];
}

export interface CompileRequest {
  readonly stylesheet: SourceDocument;
  readonly options?: {
    readonly emitGeneratedTs?: boolean;
    readonly emitSourceMap?: boolean;
    readonly sampleDocument?: SourceDocument;
  };
}

export interface CompileSuccessResult {
  readonly ok: true;
  readonly diagnostics: readonly DiagnosticReport[];
  readonly stylesheet: CompiledStylesheet;
  readonly generatedTs?: string;
  readonly sourceMap?: string;
}

export interface CompileFailureResult {
  readonly ok: false;
  readonly diagnostics: readonly DiagnosticReport[];
}

export type CompileResult = CompileSuccessResult | CompileFailureResult;

export interface TransformRequest {
  readonly stylesheet: CompiledStylesheet;
  readonly sourceXml: SourceDocument;
  readonly options?: TransformOptions;
}

export interface TransformSuccessResult {
  readonly ok: true;
  readonly diagnostics: readonly DiagnosticReport[];
  readonly output: string;
  readonly execution?: TransformExecutionInfo;
  readonly notices?: readonly WorkbenchNotice[];
}

export interface TransformFailureResult {
  readonly ok: false;
  readonly diagnostics: readonly DiagnosticReport[];
}

export type TransformResult = TransformSuccessResult | TransformFailureResult;

export interface CompileAndTransformRequest {
  readonly stylesheet: SourceDocument;
  readonly sourceXml: SourceDocument;
  readonly options?: TransformOptions & {
    readonly emitGeneratedTs?: boolean;
    readonly emitSourceMap?: boolean;
    readonly sampleDocument?: SourceDocument;
  };
}

export interface CompileAndTransformSuccessResult {
  readonly ok: true;
  readonly diagnostics: readonly DiagnosticReport[];
  readonly output: string;
  readonly stylesheet: CompiledStylesheet;
  readonly generatedTs?: string;
  readonly sourceMap?: string;
  readonly execution?: TransformExecutionInfo;
  readonly notices?: readonly WorkbenchNotice[];
}

export interface CompileAndTransformFailureResult {
  readonly ok: false;
  readonly diagnostics: readonly DiagnosticReport[];
  readonly generatedTs?: string;
  readonly sourceMap?: string;
}

export type CompileAndTransformResult = CompileAndTransformSuccessResult | CompileAndTransformFailureResult;

export class CompiledStylesheet {
  readonly stylesheet: SourceDocument;
  readonly diagnostics: readonly DiagnosticReport[];
  readonly generatedTs?: string;
  readonly sourceMap?: string;
  private readonly processor: XsltProcessor;

  private constructor(
    stylesheet: SourceDocument,
    diagnostics: readonly DiagnosticReport[],
    processor: XsltProcessor,
    generatedTs?: string,
    sourceMap?: string,
  ) {
    this.stylesheet = stylesheet;
    this.diagnostics = diagnostics;
    this.processor = processor;
    if (generatedTs !== undefined) {
      this.generatedTs = generatedTs;
    }
    if (sourceMap !== undefined) {
      this.sourceMap = sourceMap;
    }
  }

  static create(
    stylesheet: SourceDocument,
    diagnostics: readonly DiagnosticReport[],
    processor: XsltProcessor,
    generatedTs?: string,
    sourceMap?: string,
  ): CompiledStylesheet {
    return new CompiledStylesheet(
      stylesheet,
      diagnostics,
      processor,
      generatedTs,
      sourceMap,
    );
  }

  transform(sourceXml: SourceDocument, options?: TransformOptions): TransformResult {
    try {
      const result = this.processor.transform(sourceXml.text, options ?? {});
      const notices = createFallbackNotices(result.execution);

      return {
        ok: true,
        diagnostics: this.diagnostics,
        output: result.output,
        ...(result.execution === undefined ? {} : { execution: result.execution }),
        ...(notices.length === 0 ? {} : { notices }),
      };
    } catch (error) {
      return {
        ok: false,
        diagnostics: sortDiagnostics([...this.diagnostics, diagnosticReportFromError(error)]),
      };
    }
  }
}

export function compile(request: CompileRequest): CompileResult {
  try {
    const artifacts = compileStylesheetRuntimeArtifacts(request.stylesheet.text, {
      path: request.stylesheet.uri,
      ...(request.options?.sampleDocument === undefined
        ? {}
        : { sampleDocument: request.options.sampleDocument.text }),
    });
    const processor = XsltProcessor.fromIr(request.stylesheet.text, artifacts.ir, {
      sourceName: request.stylesheet.uri,
    });

    return {
      ok: true,
      diagnostics: artifacts.diagnostics,
      stylesheet: CompiledStylesheet.create(
        request.stylesheet,
        artifacts.diagnostics,
        processor,
        request.options?.emitGeneratedTs === false ? undefined : artifacts.module,
        request.options?.emitSourceMap === false ? undefined : artifacts.sourceMap,
      ),
      ...(request.options?.emitGeneratedTs === false ? {} : { generatedTs: artifacts.module }),
      ...(request.options?.emitSourceMap === false ? {} : { sourceMap: artifacts.sourceMap }),
    };
  } catch (error) {
    return {
      ok: false,
      diagnostics: [diagnosticReportFromError(error)],
    };
  }
}

export function transform(request: TransformRequest): TransformResult {
  return request.stylesheet.transform(request.sourceXml, request.options);
}

export function compileAndTransform(request: CompileAndTransformRequest): CompileAndTransformResult {
  const compileResult = compile({
    stylesheet: request.stylesheet,
    options: {
      ...(request.options?.emitGeneratedTs === undefined ? {} : { emitGeneratedTs: request.options.emitGeneratedTs }),
      ...(request.options?.emitSourceMap === undefined ? {} : { emitSourceMap: request.options.emitSourceMap }),
      ...(request.options?.sampleDocument === undefined ? {} : { sampleDocument: request.options.sampleDocument }),
    },
  });
  if (!compileResult.ok) {
    return compileResult;
  }

  const transformResult = transform({
    stylesheet: compileResult.stylesheet,
    sourceXml: request.sourceXml,
    options: getTransformOptions(request.options),
  });
  if (!transformResult.ok) {
    return {
      ...transformResult,
      ...(compileResult.generatedTs === undefined ? {} : { generatedTs: compileResult.generatedTs }),
      ...(compileResult.sourceMap === undefined ? {} : { sourceMap: compileResult.sourceMap }),
    };
  }

  return {
    ...transformResult,
    stylesheet: compileResult.stylesheet,
    ...(compileResult.generatedTs === undefined ? {} : { generatedTs: compileResult.generatedTs }),
    ...(compileResult.sourceMap === undefined ? {} : { sourceMap: compileResult.sourceMap }),
  };
}

function getTransformOptions(options: CompileAndTransformRequest['options']): TransformOptions {
  if (options === undefined) {
    return {};
  }

  return {
    ...(options.initialTemplate === undefined ? {} : { initialTemplate: options.initialTemplate }),
    ...(options.initialMode === undefined ? {} : { initialMode: options.initialMode }),
    ...(options.execution === undefined ? {} : { execution: options.execution }),
    ...(options.parameters === undefined ? {} : { parameters: options.parameters }),
    ...(options.baseUri === undefined ? {} : { baseUri: options.baseUri }),
  };
}

function createFallbackNotices(execution: TransformExecutionInfo | undefined): readonly WorkbenchNotice[] {
  const fallbackReason = execution?.fallbackReason;
  if (execution === undefined || fallbackReason === undefined) {
    return [];
  }

  return [createFallbackNotice(execution, fallbackReason)];
}

function createFallbackNotice(
  execution: TransformExecutionInfo,
  fallbackReason: TransformExecutionFallbackReason,
): WorkbenchNotice {
  return {
    severity: 'warning',
    code: 'native_fallback',
    message: fallbackReason.message,
    details: [
      { key: 'requestedExecution', value: execution.requested },
      { key: 'resolvedExecution', value: execution.resolved },
      { key: 'fallbackCode', value: fallbackReason.code },
    ],
    ...(fallbackReason.suggestions === undefined
      ? {}
      : {
          suggestions: fallbackReason.suggestions.map((suggestion) => ({
            kind: suggestion.kind,
            label: suggestion.label,
            ...(suggestion.confidence === undefined ? {} : { confidence: suggestion.confidence }),
            ...(suggestion.replacement === undefined ? {} : { replacement: suggestion.replacement }),
          })),
        }),
  };
}