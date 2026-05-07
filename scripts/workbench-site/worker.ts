import { compileAndTransform } from '../../src/workbench.ts';

interface WorkbenchRequest {
  readonly requestId: number;
  readonly sourceXml: {
    readonly uri: string;
    readonly text: string;
  };
  readonly stylesheet: {
    readonly uri: string;
    readonly text: string;
  };
}

interface WorkbenchResponse {
  readonly requestId: number;
  readonly ok: boolean;
  readonly generatedTs: string;
  readonly output: string;
  readonly diagnostics: readonly string[];
  readonly notices: readonly string[];
  readonly execution: string;
}

self.addEventListener('message', (event: MessageEvent<WorkbenchRequest>) => {
  const request = event.data;
  const result = compileAndTransform({
    stylesheet: request.stylesheet,
    sourceXml: request.sourceXml,
    options: {
      emitGeneratedTs: true,
      execution: 'auto',
    },
  });

  const response: WorkbenchResponse = {
    requestId: request.requestId,
    ok: result.ok,
    generatedTs: result.generatedTs ?? '',
    output: result.ok ? result.output : '',
    diagnostics: result.diagnostics.map(formatDiagnostic),
    notices: result.ok ? (result.notices ?? []).map(formatNotice) : [],
    execution: result.ok && result.execution !== undefined
      ? `${result.execution.requested} -> ${result.execution.resolved}`
      : '',
  };

  self.postMessage(response);
});

function formatDiagnostic(diagnostic: ReturnType<typeof compileAndTransform>['diagnostics'][number]): string {
  const location = diagnostic.primary === undefined
    ? ''
    : ` (${diagnostic.primary.uri ?? '<memory>'}:${diagnostic.primary.lineStart}:${diagnostic.primary.columnStart})`;
  return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}${location}`;
}

function formatNotice(notice: NonNullable<Extract<ReturnType<typeof compileAndTransform>, { ok: true }>['notices']>[number]): string {
  return `${notice.severity.toUpperCase()} ${notice.code}: ${notice.message}`;
}