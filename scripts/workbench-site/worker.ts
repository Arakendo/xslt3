import { compileAndTransform, resolveSourceXmlNodeHandleAtOffset, resolveSourceXmlNodeHandleInRange } from '../../src/workbench.ts';
import type { XmlTraceEventKind } from '../../src/processor/types.ts';

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
  readonly traceBreakpoint?: {
    readonly offsetStart: number;
    readonly offsetEnd: number;
    readonly eventKind: XmlTraceEventKind;
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
  readonly traceStatus: string;
  readonly traceHandle: string;
  readonly pause: string;
}

self.addEventListener('message', (event: MessageEvent<WorkbenchRequest>) => {
  const request = event.data;
  const breakpointResolution = resolveTraceBreakpoint(request);
  const result = compileAndTransform({
    stylesheet: request.stylesheet,
    sourceXml: request.sourceXml,
    options: {
      emitGeneratedTs: true,
      execution: 'auto',
      ...(breakpointResolution.handle === undefined
        ? {}
        : {
            trace: {
              documentUri: request.sourceXml.uri,
              breakpoints: [
                {
                  node: breakpointResolution.handle,
                  on: [request.traceBreakpoint?.eventKind ?? 'template-enter'],
                },
              ],
            },
          }),
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
    traceStatus: formatTraceStatus(request, breakpointResolution, result),
    traceHandle: breakpointResolution.handle === undefined ? '' : `${breakpointResolution.handle.kind} ${breakpointResolution.handle.path}`,
    pause: result.ok && result.pause !== undefined ? JSON.stringify(result.pause, null, 2) : '',
  };

  self.postMessage(response);
});

function resolveTraceBreakpoint(request: WorkbenchRequest) {
  const traceBreakpoint = request.traceBreakpoint;
  if (traceBreakpoint === undefined) {
    return { diagnostics: [] as readonly string[], handle: undefined };
  }

  const selectionResult = traceBreakpoint.offsetStart === traceBreakpoint.offsetEnd
    ? resolveSourceXmlNodeHandleAtOffset({
        sourceXml: request.sourceXml,
        offset: traceBreakpoint.offsetStart,
      })
    : resolveSourceXmlNodeHandleInRange({
        sourceXml: request.sourceXml,
        offsetStart: traceBreakpoint.offsetStart,
        offsetEnd: traceBreakpoint.offsetEnd,
      });

  return {
    diagnostics: selectionResult.diagnostics.map(formatDiagnostic),
    handle: selectionResult.ok ? selectionResult.handle : undefined,
  };
}

function formatTraceStatus(
  request: WorkbenchRequest,
  breakpointResolution: { readonly diagnostics: readonly string[]; readonly handle?: { readonly kind: string; readonly path: string } },
  result: ReturnType<typeof compileAndTransform>,
): string {
  const traceBreakpoint = request.traceBreakpoint;
  if (traceBreakpoint === undefined) {
    return 'Select XML text and click "Run XML breakpoint from selection" to capture a pause payload.';
  }

  if (breakpointResolution.diagnostics.length > 0) {
    return breakpointResolution.diagnostics.join('\n');
  }

  if (breakpointResolution.handle === undefined) {
    return 'The current XML selection does not resolve to a selectable trace node.';
  }

  if (!result.ok) {
    return `Resolved ${breakpointResolution.handle.path}, but compile or transform failed.`;
  }

  if (result.pause === undefined) {
    return `Resolved ${breakpointResolution.handle.path}, but no ${traceBreakpoint.eventKind} breakpoint fired.`;
  }

  return `Paused on ${result.pause.event.kind} for ${result.pause.event.node.path}.`;
}

function formatDiagnostic(diagnostic: ReturnType<typeof compileAndTransform>['diagnostics'][number]): string {
  const location = diagnostic.primary === undefined
    ? ''
    : ` (${diagnostic.primary.uri ?? '<memory>'}:${diagnostic.primary.lineStart}:${diagnostic.primary.columnStart})`;
  return `${diagnostic.severity.toUpperCase()} ${diagnostic.code}: ${diagnostic.message}${location}`;
}

function formatNotice(notice: NonNullable<Extract<ReturnType<typeof compileAndTransform>, { ok: true }>['notices']>[number]): string {
  return `${notice.severity.toUpperCase()} ${notice.code}: ${notice.message}`;
}