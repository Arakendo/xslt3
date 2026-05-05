import ts from 'typescript';
import { describe, expect, it } from 'vitest';

import { compileStylesheetToDts } from '../../src/compile.js';

const TYPED_PARAMS_STYLESHEET = [
  '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:xs="http://www.w3.org/2001/XMLSchema">',
  '  <xsl:param name="title" as="xs:string" required="yes"/>',
  '  <xsl:param name="count" as="xs:integer"/>',
  '  <xsl:param name="enabled" as="xs:boolean"/>',
  '  <xsl:param name="tags" as="xs:string*"/>',
  '  <xsl:template match="/">',
  '    <out><xsl:value-of select="$title"/></out>',
  '  </xsl:template>',
  '</xsl:stylesheet>',
].join('\n');

describe('XSLT codegen declaration emission', () => {
  it('emits a typed transform context for top-level stylesheet params', () => {
    const emitted = compileStylesheetToDts(TYPED_PARAMS_STYLESHEET, { path: 'typed-params.xsl' });

    expect(emitted).toContain('export interface StylesheetParameters extends Readonly<Record<string, unknown>> {');
    expect(emitted).toContain('readonly "title": string;');
    expect(emitted).toContain('readonly "count"?: number;');
    expect(emitted).toContain('readonly "enabled"?: boolean;');
    expect(emitted).toContain('readonly "tags"?: readonly string[];');
    expect(emitted).toContain('ctx?: StylesheetTransformContext');

    const diagnostics = compileConsumerAgainstDeclaration(emitted, [
      'import generated from "./typed-params";',
      '',
      'generated.transform("<root/>", {',
      '  parameters: {',
      '    title: "Invoice",',
      '    count: 3,',
      '    enabled: true,',
      '    tags: ["a", "b"],',
      '  },',
      '});',
      '',
      'generated.transform("<root/>", {',
      '  parameters: {',
      '    title: 42,',
      '  },',
      '});',
    ].join('\n'));

    const relevantDiagnostics = diagnostics.filter((diagnostic) => diagnostic.file?.fileName === '/consumer.ts');
    expect(relevantDiagnostics).toHaveLength(1);
    expect(ts.flattenDiagnosticMessageText(relevantDiagnostics[0]!.messageText, '\n')).toContain('number');
    expect(ts.flattenDiagnosticMessageText(relevantDiagnostics[0]!.messageText, '\n')).toContain('string');
  });
});

function compileConsumerAgainstDeclaration(
  generatedDeclaration: string,
  consumerSource: string,
): readonly ts.Diagnostic[] {
  const rootFiles = ['/consumer.ts', '/typed-params.d.ts', '/runtime-shim.d.ts'];
  const files = new Map<string, string>([
    ['/consumer.ts', consumerSource],
    ['/typed-params.d.ts', generatedDeclaration],
    ['/runtime-shim.d.ts', [
      'declare module "@arakendo/weaver-xslt/runtime" {',
      '  export interface TransformContext {',
      '    readonly initialTemplate?: string;',
      '    readonly initialMode?: string;',
      '    readonly parameters?: Readonly<Record<string, unknown>>;',
      '    readonly baseUri?: string;',
      '  }',
      '  export interface TransformResult {',
      '    readonly output: string;',
      '    readonly secondaryOutputs?: Readonly<Record<string, string>>;',
      '  }',
      '}',
    ].join('\n')],
  ]);
  const options: ts.CompilerOptions = {
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    target: ts.ScriptTarget.ES2022,
    noEmit: true,
    skipLibCheck: true,
    strict: true,
  };
  const baseHost = ts.createCompilerHost(options, true);
  const host: ts.CompilerHost = {
    ...baseHost,
    fileExists: (fileName) => files.has(fileName) || baseHost.fileExists(fileName),
    readFile: (fileName) => files.get(fileName) ?? baseHost.readFile(fileName),
    getSourceFile: (fileName, languageVersion, onError, shouldCreateNewSourceFile) => {
      const sourceText = files.get(fileName);
      if (sourceText !== undefined) {
        return ts.createSourceFile(fileName, sourceText, languageVersion, true);
      }

      return baseHost.getSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
    },
  };
  const program = ts.createProgram(rootFiles, options, host);

  return ts.getPreEmitDiagnostics(program);
}