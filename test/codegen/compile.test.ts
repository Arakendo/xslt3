import { readFileSync } from 'node:fs';

import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { compileStylesheetToTs } from '../../src/compile.js';
import {
  createCompiledDocument,
  escapeText,
  selectDescendantElementsByName,
  selectSimplePathExists,
  selectSimplePathNode,
  selectSimplePathNodes,
  selectSimplePathText,
  stringValueOfNode,
  transformCompiledStylesheet,
} from '../../src/runtime/index.js';
import { compileStylesheet } from '../../src/xslt/compile/compiler.js';
import { XsltProcessor } from '../../src/index.js';

const FIXTURE_STYLESHEET = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><hello><xsl:value-of select="/root/name"/></hello></xsl:template></xsl:stylesheet>';
const CONDITIONAL_FIXTURE_STYLESHEET = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><out><xsl:if test="/root/name = &apos;world&apos;"><yes/></xsl:if><xsl:choose><xsl:when test="/root/role = &apos;admin&apos;"><role>admin</role></xsl:when><xsl:otherwise><role>user</role></xsl:otherwise></xsl:choose></out></xsl:template></xsl:stylesheet>';
const MATCHED_ROOT_FIXTURE_STYLESHEET = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/root">
          <out>
            <xsl:value-of select="name"/>
            <xsl:if test="flag"><flagged/></xsl:if>
          </out>
        </xsl:template>
      </xsl:stylesheet>
    `;
const APPLY_TEMPLATES_FIXTURE_STYLESHEET = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><items><xsl:apply-templates select="/root/item"/></items></xsl:template><xsl:template match="item"><item><xsl:value-of select="name"/></item></xsl:template></xsl:stylesheet>';
const APPLY_TEMPLATES_DOT_FIXTURE_STYLESHEET = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><items><xsl:apply-templates select="/root/item"/></items></xsl:template><xsl:template match="item"><item><xsl:value-of select="."/></item></xsl:template></xsl:stylesheet>';
const APPLY_TEMPLATES_DEFAULT_FIXTURE_STYLESHEET = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><items><xsl:apply-templates/></items></xsl:template><xsl:template match="item"><item><xsl:value-of select="."/></item></xsl:template></xsl:stylesheet>';
const APPLY_TEMPLATES_RELATIVE_SELECT_FIXTURE_STYLESHEET = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"><xsl:template match="/"><items><xsl:apply-templates select="root/item"/></items></xsl:template><xsl:template match="item"><item><xsl:value-of select="name"/></item></xsl:template></xsl:stylesheet>';

describe('XSLT codegen MVP4 slice', () => {
  it('emits a native TypeScript module for the simple literal-result subset', () => {
    const stylesheet = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/"><hello><xsl:value-of select="/root/name"/></hello></xsl:template>
      </xsl:stylesheet>
    `;

    const emitted = compileStylesheetToTs(stylesheet, { path: 'hello.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('@arakendo/weaver-xslt/runtime');
    expect(emitted).toContain("export const source = { path: \"hello.xsl\"");
    expect(emitted).toContain('createCompiledDocument(sourceXml)');
    expect(emitted).toContain('selectSimplePathText(document, ["root","name"])');
    expect(emitted).not.toContain('const currentNode = document;');
    expect(emitted).toContain('"<hello>"');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native code for simple relative child paths and existence tests', () => {
    const stylesheet = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/">
          <out>
            <xsl:value-of select="root/name"/>
            <xsl:if test="root/flag"><flagged/></xsl:if>
          </out>
        </xsl:template>
      </xsl:stylesheet>
    `;

    const emitted = compileStylesheetToTs(stylesheet, { path: 'relative.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('selectSimplePathText(currentNode, ["root","name"])');
    expect(emitted).toContain('selectSimplePathExists(currentNode, ["root","flag"])');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native conditionals for the simple xsl:if and xsl:choose subset', () => {
    const emitted = compileStylesheetToTs(CONDITIONAL_FIXTURE_STYLESHEET, { path: 'conditional.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain("selectSimplePathText(document, [\"root\",\"name\"]) === \"world\"");
    expect(emitted).toContain('? "<yes>" +');
    expect(emitted).toContain('"</yes>" : ""');
    expect(emitted).toContain("selectSimplePathText(document, [\"root\",\"role\"]) === \"admin\"");
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native boolean helper calls in simple tests', () => {
    const stylesheet = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/">
          <out>
            <xsl:if test="not(root/flag)"><missing/></xsl:if>
            <xsl:if test="true()"><always/></xsl:if>
            <xsl:if test="false()"><never/></xsl:if>
          </out>
        </xsl:template>
      </xsl:stylesheet>
    `;

    const emitted = compileStylesheetToTs(stylesheet, { path: 'boolean-helpers.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('(!selectSimplePathExists(currentNode, ["root","flag"]))');
    expect(emitted).toContain('(true ? "<always>" +');
    expect(emitted).toContain('(false ? "<never>" +');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native code for a single absolute matched element with relative body paths', () => {
    const emitted = compileStylesheetToTs(MATCHED_ROOT_FIXTURE_STYLESHEET, { path: 'matched-root.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('const currentNode = selectSimplePathNode(document, ["root"]);');
    expect(emitted).toContain('selectSimplePathText(currentNode, ["name"])');
    expect(emitted).toContain('selectSimplePathExists(currentNode, ["flag"])');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native code for a root apply-templates select and a simple relative match template', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_FIXTURE_STYLESHEET, { path: 'apply-templates.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('selectSimplePathNodes(document, ["root","item"]).map((templateNode) =>');
    expect(emitted).toContain('escapeText(selectSimplePathText(templateNode, ["name"]))');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native code for a root apply-templates with a simple relative select', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_RELATIVE_SELECT_FIXTURE_STYLESHEET, { path: 'apply-templates-relative.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('selectSimplePathNodes(document, ["root","item"]).map((templateNode) =>');
    expect(emitted).toContain('escapeText(selectSimplePathText(templateNode, ["name"]))');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native code for a root apply-templates without select and a simple relative match template', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_DEFAULT_FIXTURE_STYLESHEET, { path: 'apply-templates-default.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('selectDescendantElementsByName(document, "item").map((templateNode) =>');
    expect(emitted).toContain('escapeText(stringValueOfNode(templateNode))');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('emits native code when a child template uses xsl:value-of select="."', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_DOT_FIXTURE_STYLESHEET, { path: 'apply-templates-dot.xsl' });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });

    expect(transpiled.diagnostics ?? []).toEqual([]);
    expect(emitted).toContain('selectSimplePathNodes(document, ["root","item"]).map((templateNode) =>');
    expect(emitted).toContain('escapeText(stringValueOfNode(templateNode))');
    expect(emitted).not.toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
  });

  it('falls back to the interpreter-backed runtime surface for unsupported instructions', () => {
    const stylesheet = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/">
          <xsl:if test="position() = 1">
            <hello><xsl:value-of select="/root/name"/></hello>
          </xsl:if>
        </xsl:template>
      </xsl:stylesheet>
    `;

    const emitted = compileStylesheetToTs(stylesheet, { path: 'conditional.xsl' });

    expect(emitted).toContain('transformCompiledStylesheet(stylesheet, sourceXml, ctx)');
    expect(emitted).toContain('"kind": "if"');
  });

  it('matches the checked-in generated fixture for the hello stylesheet', () => {
    const emitted = compileStylesheetToTs(FIXTURE_STYLESHEET, { path: 'hello.xsl' });
    const fixture = readFileSync(new URL('../generated-fixtures/hello.xsl.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

    expect(emitted.trimEnd()).toBe(fixture.trimEnd());
  });

  it('matches the checked-in generated fixture for the conditional stylesheet', () => {
    const emitted = compileStylesheetToTs(CONDITIONAL_FIXTURE_STYLESHEET, { path: 'conditional.xsl' });
    const fixture = readFileSync(new URL('../generated-fixtures/conditional.xsl.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

    expect(emitted.trimEnd()).toBe(fixture.trimEnd());
  });

  it('matches the checked-in generated fixture for the matched-root stylesheet', () => {
    const emitted = compileStylesheetToTs(MATCHED_ROOT_FIXTURE_STYLESHEET, { path: 'matched-root.xsl' });
    const fixture = readFileSync(new URL('../generated-fixtures/matched-root.xsl.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

    expect(emitted.trimEnd()).toBe(fixture.trimEnd());
  });

  it('matches the checked-in generated fixture for the apply-templates stylesheet', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_FIXTURE_STYLESHEET, { path: 'apply-templates.xsl' });
    const fixture = readFileSync(new URL('../generated-fixtures/apply-templates.xsl.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

    expect(emitted.trimEnd()).toBe(fixture.trimEnd());
  });

  it('matches the checked-in generated fixture for the apply-templates-dot stylesheet', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_DOT_FIXTURE_STYLESHEET, { path: 'apply-templates-dot.xsl' });
    const fixture = readFileSync(new URL('../generated-fixtures/apply-templates-dot.xsl.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

    expect(emitted.trimEnd()).toBe(fixture.trimEnd());
  });

  it('matches the checked-in generated fixture for the apply-templates-default stylesheet', () => {
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_DEFAULT_FIXTURE_STYLESHEET, { path: 'apply-templates-default.xsl' });
    const fixture = readFileSync(new URL('../generated-fixtures/apply-templates-default.xsl.ts', import.meta.url), 'utf8').replaceAll('\r\n', '\n');

    expect(emitted.trimEnd()).toBe(fixture.trimEnd());
  });

  it('executes compiled IR through the runtime helper with interpreter-equivalent output', () => {
    const stylesheet = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/"><hello><xsl:value-of select="/root/name"/></hello></xsl:template>
      </xsl:stylesheet>
    `;
    const sourceXml = '<root><name>world</name></root>';

    const ir = compileStylesheet(stylesheet);
    const generatedResult = transformCompiledStylesheet(ir, sourceXml);
    const interpreterResult = new XsltProcessor(stylesheet).transform(sourceXml);

    expect(generatedResult).toEqual(interpreterResult);
  });

  it('executes a generated module end-to-end through the runtime surface', async () => {
    const stylesheet = `
      <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
        <xsl:template match="/"><hello><xsl:value-of select="/root/name"/></hello></xsl:template>
      </xsl:stylesheet>
    `;
    const sourceXml = '<root><name>world</name></root>';
    const runtimeModuleSpecifier = '@runtime-test';
    const emitted = compileStylesheetToTs(stylesheet, {
      path: 'hello.xsl',
      runtimeModuleSpecifier,
    });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    const module = { exports: {} as Record<string, unknown> };
    const runtimeModule = {
      createCompiledDocument,
      escapeText,
      selectDescendantElementsByName,
      selectSimplePathExists,
      selectSimplePathNode,
      selectSimplePathNodes,
      selectSimplePathText,
      stringValueOfNode,
      transformCompiledStylesheet,
    };

    const require = (specifier: string) => {
      if (specifier === runtimeModuleSpecifier) {
        return runtimeModule;
      }

      throw new Error(`Unexpected generated-module import: ${specifier}`);
    };

    const executeModule = new Function('require', 'module', 'exports', transpiled.outputText) as (
      localRequire: (specifier: string) => unknown,
      localModule: { exports: Record<string, unknown> },
      localExports: Record<string, unknown>,
    ) => void;

    expect(transpiled.diagnostics ?? []).toEqual([]);
    executeModule(require, module, module.exports);

    const generatedModule = module.exports as {
      readonly source: { readonly path: string };
      readonly transform: (source: string) => ReturnType<XsltProcessor['transform']>;
    };
    const interpreterResult = new XsltProcessor(stylesheet).transform(sourceXml);

    expect(generatedModule.source).toMatchObject({ path: 'hello.xsl' });
    expect(generatedModule.transform(sourceXml)).toEqual(interpreterResult);
  });

  it('executes a matched-element native module through the runtime surface', () => {
    const sourceXml = '<root><name>world</name><flag/></root>';
    const runtimeModuleSpecifier = '@runtime-test';
    const emitted = compileStylesheetToTs(MATCHED_ROOT_FIXTURE_STYLESHEET, {
      path: 'matched-root.xsl',
      runtimeModuleSpecifier,
    });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    const module = { exports: {} as Record<string, unknown> };
    const runtimeModule = {
      createCompiledDocument,
      escapeText,
      selectDescendantElementsByName,
      selectSimplePathExists,
      selectSimplePathNode,
      selectSimplePathNodes,
      selectSimplePathText,
      stringValueOfNode,
      transformCompiledStylesheet,
    };

    const require = (specifier: string) => {
      if (specifier === runtimeModuleSpecifier) {
        return runtimeModule;
      }

      throw new Error(`Unexpected generated-module import: ${specifier}`);
    };

    const executeModule = new Function('require', 'module', 'exports', transpiled.outputText) as (
      localRequire: (specifier: string) => unknown,
      localModule: { exports: Record<string, unknown> },
      localExports: Record<string, unknown>,
    ) => void;

    expect(transpiled.diagnostics ?? []).toEqual([]);
    executeModule(require, module, module.exports);

    const generatedModule = module.exports as {
      readonly transform: (source: string) => ReturnType<XsltProcessor['transform']>;
    };
    const interpreterResult = new XsltProcessor(MATCHED_ROOT_FIXTURE_STYLESHEET).transform(sourceXml);

    expect(generatedModule.transform(sourceXml)).toEqual(interpreterResult);
  });

  it('executes a simple native apply-templates module through the runtime surface', () => {
    const sourceXml = '<root><item><name>apple</name></item><item><name>pear</name></item></root>';
    const runtimeModuleSpecifier = '@runtime-test';
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_FIXTURE_STYLESHEET, {
      path: 'apply-templates.xsl',
      runtimeModuleSpecifier,
    });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    const module = { exports: {} as Record<string, unknown> };
    const runtimeModule = {
      createCompiledDocument,
      escapeText,
      selectDescendantElementsByName,
      selectSimplePathExists,
      selectSimplePathNode,
      selectSimplePathNodes,
      selectSimplePathText,
      stringValueOfNode,
      transformCompiledStylesheet,
    };

    const require = (specifier: string) => {
      if (specifier === runtimeModuleSpecifier) {
        return runtimeModule;
      }

      throw new Error(`Unexpected generated-module import: ${specifier}`);
    };

    const executeModule = new Function('require', 'module', 'exports', transpiled.outputText) as (
      localRequire: (specifier: string) => unknown,
      localModule: { exports: Record<string, unknown> },
      localExports: Record<string, unknown>,
    ) => void;

    expect(transpiled.diagnostics ?? []).toEqual([]);
    executeModule(require, module, module.exports);

    const generatedModule = module.exports as {
      readonly transform: (source: string) => ReturnType<XsltProcessor['transform']>;
    };
    const interpreterResult = new XsltProcessor(APPLY_TEMPLATES_FIXTURE_STYLESHEET).transform(sourceXml);

    expect(generatedModule.transform(sourceXml)).toEqual(interpreterResult);
  });

  it('executes a native apply-templates module with a relative select through the runtime surface', () => {
    const sourceXml = '<root><item><name>apple</name></item><item><name>pear</name></item></root>';
    const runtimeModuleSpecifier = '@runtime-test';
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_RELATIVE_SELECT_FIXTURE_STYLESHEET, {
      path: 'apply-templates-relative.xsl',
      runtimeModuleSpecifier,
    });
    const transformed = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;

    const runtimeModule = {
      createCompiledDocument,
      escapeText,
      selectSimplePathNodes,
      selectSimplePathText,
      selectSimplePathExists,
      selectSimplePathNode,
      selectDescendantElementsByName,
      stringValueOfNode,
      transformCompiledStylesheet,
    };
    const module = { exports: {} as unknown };
    const localRequire = (specifier: string) => {
      if (specifier === runtimeModuleSpecifier) {
        return runtimeModule;
      }

      throw new Error(`Unexpected module request: ${specifier}`);
    };
    const evaluator = new Function('require', 'module', 'exports', transformed);
    evaluator(localRequire, module, module.exports);

    const generatedModule = module.exports as {
      readonly transform: (source: string) => ReturnType<XsltProcessor['transform']>;
    };
    const interpreterResult = new XsltProcessor(APPLY_TEMPLATES_RELATIVE_SELECT_FIXTURE_STYLESHEET).transform(sourceXml);

    expect(generatedModule.transform(sourceXml)).toEqual(interpreterResult);
  });

  it('executes a native apply-templates child template using context-item string value', () => {
    const sourceXml = '<root><item>apple</item><item>pear</item></root>';
    const runtimeModuleSpecifier = '@runtime-test';
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_DOT_FIXTURE_STYLESHEET, {
      path: 'apply-templates-dot.xsl',
      runtimeModuleSpecifier,
    });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    const module = { exports: {} as Record<string, unknown> };
    const runtimeModule = {
      createCompiledDocument,
      escapeText,
      selectDescendantElementsByName,
      selectSimplePathExists,
      selectSimplePathNode,
      selectSimplePathNodes,
      selectSimplePathText,
      stringValueOfNode,
      transformCompiledStylesheet,
    };

    const require = (specifier: string) => {
      if (specifier === runtimeModuleSpecifier) {
        return runtimeModule;
      }

      throw new Error(`Unexpected generated-module import: ${specifier}`);
    };

    const executeModule = new Function('require', 'module', 'exports', transpiled.outputText) as (
      localRequire: (specifier: string) => unknown,
      localModule: { exports: Record<string, unknown> },
      localExports: Record<string, unknown>,
    ) => void;

    expect(transpiled.diagnostics ?? []).toEqual([]);
    executeModule(require, module, module.exports);

    const generatedModule = module.exports as {
      readonly transform: (source: string) => ReturnType<XsltProcessor['transform']>;
    };
    const interpreterResult = new XsltProcessor(APPLY_TEMPLATES_DOT_FIXTURE_STYLESHEET).transform(sourceXml);

    expect(generatedModule.transform(sourceXml)).toEqual(interpreterResult);
  });

  it('executes a native apply-templates module without select through the runtime surface', () => {
    const sourceXml = '<invoice><item>apple</item><section><item>pear</item></section></invoice>';
    const runtimeModuleSpecifier = '@runtime-test';
    const emitted = compileStylesheetToTs(APPLY_TEMPLATES_DEFAULT_FIXTURE_STYLESHEET, {
      path: 'apply-templates-default.xsl',
      runtimeModuleSpecifier,
    });
    const transpiled = ts.transpileModule(emitted, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
      reportDiagnostics: true,
    });
    const module = { exports: {} as Record<string, unknown> };
    const runtimeModule = {
      createCompiledDocument,
      escapeText,
      selectDescendantElementsByName,
      selectSimplePathExists,
      selectSimplePathNode,
      selectSimplePathNodes,
      selectSimplePathText,
      stringValueOfNode,
      transformCompiledStylesheet,
    };

    const require = (specifier: string) => {
      if (specifier === runtimeModuleSpecifier) {
        return runtimeModule;
      }

      throw new Error(`Unexpected generated-module import: ${specifier}`);
    };

    const executeModule = new Function('require', 'module', 'exports', transpiled.outputText) as (
      localRequire: (specifier: string) => unknown,
      localModule: { exports: Record<string, unknown> },
      localExports: Record<string, unknown>,
    ) => void;

    expect(transpiled.diagnostics ?? []).toEqual([]);
    executeModule(require, module, module.exports);

    const generatedModule = module.exports as {
      readonly transform: (source: string) => ReturnType<XsltProcessor['transform']>;
    };
    const interpreterResult = new XsltProcessor(APPLY_TEMPLATES_DEFAULT_FIXTURE_STYLESHEET).transform(sourceXml);

    expect(generatedModule.transform(sourceXml)).toEqual(interpreterResult);
  });
});