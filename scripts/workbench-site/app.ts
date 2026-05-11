import { DEFAULT_PRESET_ID, PRESETS } from './presets.ts';
import type { XmlTraceEventKind } from '../../src/processor/types.ts';

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

const root = document.querySelector<HTMLElement>('#weaver-workbench-root');

if (root !== null) {
  initializeWorkbench(root);
}

function initializeWorkbench(rootElement: HTMLElement): void {
  rootElement.innerHTML = `
    <section class="weaver-workbench" aria-label="Weaver workbench demo">
      <header class="weaver-workbench__header">
        <div>
          <p class="weaver-workbench__eyebrow">Live prototype</p>
          <h1 class="weaver-workbench__title">Weaver Workbench</h1>
          <p class="weaver-workbench__summary">Edit XML and XSLT, inspect generated TypeScript, and watch output update from the same engine boundary used by the rest of Weaver.</p>
        </div>
        <label class="weaver-workbench__preset">
          <span>Preset</span>
          <select id="weaver-workbench-preset"></select>
        </label>
      </header>
      <p class="weaver-workbench__status" id="weaver-workbench-status">Loading default preset…</p>
      <section class="weaver-workbench__trace-toolbar" aria-label="XML breakpoint demo controls">
        <div>
          <h2>XML breakpoint demo</h2>
          <p>Select an element, attribute value, or text span in Source XML, then run a trace breakpoint against that selection.</p>
        </div>
        <label class="weaver-workbench__trace-field">
          <span>Pause on</span>
          <select id="weaver-workbench-trace-kind">
            <option value="template-enter">template-enter</option>
            <option value="focus-enter">focus-enter</option>
            <option value="instruction-select">instruction-select</option>
            <option value="value-read">value-read</option>
          </select>
        </label>
        <button class="weaver-workbench__trace-button" id="weaver-workbench-trace-run" type="button">Run XML breakpoint from selection</button>
      </section>
      <div class="weaver-workbench__grid">
        <section class="weaver-workbench__panel">
          <div class="weaver-workbench__panel-header">
            <h2>Source XML</h2>
          </div>
          <textarea id="weaver-workbench-xml" spellcheck="false"></textarea>
        </section>
        <section class="weaver-workbench__panel">
          <div class="weaver-workbench__panel-header">
            <h2>Stylesheet</h2>
          </div>
          <textarea id="weaver-workbench-xsl" spellcheck="false"></textarea>
        </section>
        <section class="weaver-workbench__panel weaver-workbench__panel--readonly">
          <div class="weaver-workbench__panel-header">
            <h2>Generated TypeScript</h2>
            <span>Read-only</span>
          </div>
          <pre id="weaver-workbench-generated"></pre>
        </section>
        <section class="weaver-workbench__panel weaver-workbench__panel--readonly">
          <div class="weaver-workbench__panel-header">
            <h2>Output</h2>
            <span id="weaver-workbench-execution"></span>
          </div>
          <pre id="weaver-workbench-output"></pre>
        </section>
      </div>
      <section class="weaver-workbench__messages">
        <div class="weaver-workbench__message-panel">
          <h2>Diagnostics</h2>
          <ul id="weaver-workbench-diagnostics"></ul>
        </div>
        <div class="weaver-workbench__message-panel">
          <h2>Notices</h2>
          <ul id="weaver-workbench-notices"></ul>
        </div>
        <div class="weaver-workbench__message-panel">
          <h2>Breakpoint</h2>
          <p class="weaver-workbench__trace-summary" id="weaver-workbench-trace-status">Select XML text and click "Run XML breakpoint from selection" to capture a pause payload.</p>
          <pre class="weaver-workbench__message-pre" id="weaver-workbench-trace-handle">// No XML breakpoint resolved yet.</pre>
        </div>
        <div class="weaver-workbench__message-panel">
          <h2>Pause payload</h2>
          <pre class="weaver-workbench__message-pre" id="weaver-workbench-trace-pause">// No pause captured yet.</pre>
        </div>
      </section>
    </section>
  `;

  const presetSelect = rootElement.querySelector<HTMLSelectElement>('#weaver-workbench-preset');
  const xmlInput = rootElement.querySelector<HTMLTextAreaElement>('#weaver-workbench-xml');
  const xslInput = rootElement.querySelector<HTMLTextAreaElement>('#weaver-workbench-xsl');
  const generatedOutput = rootElement.querySelector<HTMLElement>('#weaver-workbench-generated');
  const resultOutput = rootElement.querySelector<HTMLElement>('#weaver-workbench-output');
  const diagnosticsList = rootElement.querySelector<HTMLUListElement>('#weaver-workbench-diagnostics');
  const noticesList = rootElement.querySelector<HTMLUListElement>('#weaver-workbench-notices');
  const statusElement = rootElement.querySelector<HTMLElement>('#weaver-workbench-status');
  const executionElement = rootElement.querySelector<HTMLElement>('#weaver-workbench-execution');
  const traceKindSelect = rootElement.querySelector<HTMLSelectElement>('#weaver-workbench-trace-kind');
  const traceRunButton = rootElement.querySelector<HTMLButtonElement>('#weaver-workbench-trace-run');
  const traceStatusElement = rootElement.querySelector<HTMLElement>('#weaver-workbench-trace-status');
  const traceHandleElement = rootElement.querySelector<HTMLElement>('#weaver-workbench-trace-handle');
  const tracePauseElement = rootElement.querySelector<HTMLElement>('#weaver-workbench-trace-pause');

  if (
    presetSelect === null
    || xmlInput === null
    || xslInput === null
    || generatedOutput === null
    || resultOutput === null
    || diagnosticsList === null
    || noticesList === null
    || statusElement === null
    || executionElement === null
    || traceKindSelect === null
    || traceRunButton === null
    || traceStatusElement === null
    || traceHandleElement === null
    || tracePauseElement === null
  ) {
    return;
  }

  for (const preset of PRESETS) {
    const option = document.createElement('option');
    option.value = preset.id;
    option.textContent = preset.label;
    presetSelect.append(option);
  }

  const worker = new Worker('/assets/workbench/worker.js', { type: 'module' });
  let requestId = 0;
  let debounceHandle: number | undefined;

  worker.addEventListener('message', (event: MessageEvent<WorkbenchResponse>) => {
    const response = event.data;
    if (response.requestId !== requestId) {
      return;
    }

    generatedOutput.textContent = response.generatedTs.length > 0 ? response.generatedTs : '// No generated TypeScript available.';
    resultOutput.textContent = response.ok
      ? (response.output.length > 0 ? response.output : '<empty result>')
      : '<no output>';
    executionElement.textContent = response.execution;
    renderList(diagnosticsList, response.diagnostics, 'No diagnostics.');
    renderList(noticesList, response.notices, 'No notices.');
    traceStatusElement.textContent = response.traceStatus;
    traceHandleElement.textContent = response.traceHandle.length > 0 ? response.traceHandle : '// No XML breakpoint resolved yet.';
    tracePauseElement.textContent = response.pause.length > 0 ? response.pause : '// No pause captured yet.';
    statusElement.textContent = response.ok ? 'Ready.' : 'Compile or transform failed.';
  });

  const hydratePreset = (presetId: string): void => {
    const preset = PRESETS.find((entry) => entry.id === presetId) ?? PRESETS[0];
    if (preset === undefined) {
      return;
    }

    presetSelect.value = preset.id;
    xmlInput.value = preset.sourceXml.text;
    xslInput.value = preset.stylesheet.text;
    traceKindSelect.value = 'template-enter';
    traceStatusElement.textContent = 'Select XML text and click "Run XML breakpoint from selection" to capture a pause payload.';
    traceHandleElement.textContent = '// No XML breakpoint resolved yet.';
    tracePauseElement.textContent = '// No pause captured yet.';
    runImmediately();
  };

  const queueRun = (): void => {
    statusElement.textContent = 'Updating…';
    if (debounceHandle !== undefined) {
      window.clearTimeout(debounceHandle);
    }
    debounceHandle = window.setTimeout(() => {
      debounceHandle = undefined;
      runImmediately();
    }, 250);
  };

  const runImmediately = (traceBreakpoint?: { readonly offsetStart: number; readonly offsetEnd: number; readonly eventKind: XmlTraceEventKind }): void => {
    const preset = PRESETS.find((entry) => entry.id === presetSelect.value) ?? PRESETS[0];
    if (preset === undefined) {
      return;
    }

    requestId += 1;
    statusElement.textContent = 'Compiling…';
    worker.postMessage({
      requestId,
      sourceXml: {
        uri: preset.sourceXml.uri,
        text: xmlInput.value,
      },
      stylesheet: {
        uri: preset.stylesheet.uri,
        text: xslInput.value,
      },
      ...(traceBreakpoint === undefined ? {} : { traceBreakpoint }),
    });
  };

  const runTraceBreakpoint = (): void => {
    const selectionStart = xmlInput.selectionStart ?? 0;
    const selectionEnd = xmlInput.selectionEnd ?? selectionStart;

    traceStatusElement.textContent = 'Resolving XML selection and running trace breakpoint…';
    runImmediately({
      offsetStart: selectionStart,
      offsetEnd: selectionEnd,
      eventKind: traceKindSelect.value as XmlTraceEventKind,
    });
  };

  presetSelect.addEventListener('change', () => hydratePreset(presetSelect.value));
  xmlInput.addEventListener('input', queueRun);
  xslInput.addEventListener('input', queueRun);
  traceRunButton.addEventListener('click', runTraceBreakpoint);

  hydratePreset(DEFAULT_PRESET_ID);
}

function renderList(container: HTMLUListElement, items: readonly string[], emptyMessage: string): void {
  container.replaceChildren();
  const values = items.length === 0 ? [emptyMessage] : items;
  for (const value of values) {
    const item = document.createElement('li');
    item.textContent = value;
    container.append(item);
  }
}