// scripts/workbench-site/presets.ts
var DEFAULT_PRESET_ID = "hello-world";
var PRESETS = [
  {
    id: "hello-world",
    label: "Hello world",
    description: "Minimal value extraction and output rendering.",
    sourceXml: {
      uri: "memory:/workbench/hello-world.xml",
      text: `<root>
  <name>world</name>
</root>`
    },
    stylesheet: {
      uri: "memory:/workbench/hello-world.xsl",
      text: `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <hello>
      <xsl:value-of select="/root/name"/>
    </hello>
  </xsl:template>
</xsl:stylesheet>`
    }
  },
  {
    id: "parameters-with-defaults",
    label: "Parameters with defaults",
    description: "Shows a stylesheet parameter with a useful default result.",
    sourceXml: {
      uri: "memory:/workbench/parameters-with-defaults.xml",
      text: "<root/>"
    },
    stylesheet: {
      uri: "memory:/workbench/parameters-with-defaults.xsl",
      text: `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:param name="greeting" select="'hello'"/>
  <xsl:template match="/root">
    <out>
      <xsl:value-of select="$greeting"/>
    </out>
  </xsl:template>
</xsl:stylesheet>`
    }
  },
  {
    id: "apply-templates-flow",
    label: "Apply-templates flow",
    description: "Shows multi-template rule dispatch over repeated items.",
    sourceXml: {
      uri: "memory:/workbench/apply-templates-flow.xml",
      text: `<catalog>
  <item>alpha</item>
  <item>beta</item>
</catalog>`
    },
    stylesheet: {
      uri: "memory:/workbench/apply-templates-flow.xsl",
      text: `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/catalog">
    <items>
      <xsl:apply-templates select="item"/>
    </items>
  </xsl:template>

  <xsl:template match="item">
    <entry>
      <xsl:value-of select="."/>
    </entry>
  </xsl:template>
</xsl:stylesheet>`
    }
  }
];

// scripts/workbench-site/app.ts
var root = document.querySelector("#weaver-workbench-root");
if (root !== null) {
  initializeWorkbench(root);
}
function initializeWorkbench(rootElement) {
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
      <p class="weaver-workbench__status" id="weaver-workbench-status">Loading default preset\u2026</p>
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
      </section>
    </section>
  `;
  const presetSelect = rootElement.querySelector("#weaver-workbench-preset");
  const xmlInput = rootElement.querySelector("#weaver-workbench-xml");
  const xslInput = rootElement.querySelector("#weaver-workbench-xsl");
  const generatedOutput = rootElement.querySelector("#weaver-workbench-generated");
  const resultOutput = rootElement.querySelector("#weaver-workbench-output");
  const diagnosticsList = rootElement.querySelector("#weaver-workbench-diagnostics");
  const noticesList = rootElement.querySelector("#weaver-workbench-notices");
  const statusElement = rootElement.querySelector("#weaver-workbench-status");
  const executionElement = rootElement.querySelector("#weaver-workbench-execution");
  if (presetSelect === null || xmlInput === null || xslInput === null || generatedOutput === null || resultOutput === null || diagnosticsList === null || noticesList === null || statusElement === null || executionElement === null) {
    return;
  }
  for (const preset of PRESETS) {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    presetSelect.append(option);
  }
  const worker = new Worker("/assets/workbench/worker.js", { type: "module" });
  let requestId = 0;
  let debounceHandle;
  worker.addEventListener("message", (event) => {
    const response = event.data;
    if (response.requestId !== requestId) {
      return;
    }
    generatedOutput.textContent = response.generatedTs.length > 0 ? response.generatedTs : "// No generated TypeScript available.";
    resultOutput.textContent = response.ok ? response.output.length > 0 ? response.output : "<empty result>" : "<no output>";
    executionElement.textContent = response.execution;
    renderList(diagnosticsList, response.diagnostics, "No diagnostics.");
    renderList(noticesList, response.notices, "No notices.");
    statusElement.textContent = response.ok ? "Ready." : "Compile or transform failed.";
  });
  const hydratePreset = (presetId) => {
    const preset = PRESETS.find((entry) => entry.id === presetId) ?? PRESETS[0];
    if (preset === void 0) {
      return;
    }
    presetSelect.value = preset.id;
    xmlInput.value = preset.sourceXml.text;
    xslInput.value = preset.stylesheet.text;
    runImmediately();
  };
  const queueRun = () => {
    statusElement.textContent = "Updating\u2026";
    if (debounceHandle !== void 0) {
      window.clearTimeout(debounceHandle);
    }
    debounceHandle = window.setTimeout(() => {
      debounceHandle = void 0;
      runImmediately();
    }, 250);
  };
  const runImmediately = () => {
    const preset = PRESETS.find((entry) => entry.id === presetSelect.value) ?? PRESETS[0];
    if (preset === void 0) {
      return;
    }
    requestId += 1;
    statusElement.textContent = "Compiling\u2026";
    worker.postMessage({
      requestId,
      sourceXml: {
        uri: preset.sourceXml.uri,
        text: xmlInput.value
      },
      stylesheet: {
        uri: preset.stylesheet.uri,
        text: xslInput.value
      }
    });
  };
  presetSelect.addEventListener("change", () => hydratePreset(presetSelect.value));
  xmlInput.addEventListener("input", queueRun);
  xslInput.addEventListener("input", queueRun);
  hydratePreset(DEFAULT_PRESET_ID);
}
function renderList(container, items, emptyMessage) {
  container.replaceChildren();
  const values = items.length === 0 ? [emptyMessage] : items;
  for (const value of values) {
    const item = document.createElement("li");
    item.textContent = value;
    container.append(item);
  }
}
