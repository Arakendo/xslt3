import { describe, expect, it, vi } from 'vitest';

import * as stylesheetCompiler from '../src/xslt/compile/compiler.js';
import { CompiledStylesheet, compile, compileAndTransform, transform } from '../src/workbench.js';

describe('workbench boundary', () => {
  it('compiles in-memory source documents into inspectable artifacts', () => {
    const result = compile({
      stylesheet: {
        uri: 'memory:/hello.xsl',
        text: [
          '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
          '  <xsl:template match="/">',
          '    <hello><xsl:value-of select="/root/name"/></hello>',
          '  </xsl:template>',
          '</xsl:stylesheet>',
        ].join('\n'),
      },
    });

    expect(result).toMatchObject({
      ok: true,
      diagnostics: [],
    });
    if (!result.ok) {
      throw new Error('expected compile to succeed');
    }
    expect(result.stylesheet).toBeInstanceOf(CompiledStylesheet);
    expect(result.generatedTs).toContain('export function transform(');
    expect(result.sourceMap).toContain('"sources": [');
  });

  it('does not recompile on first transform after compile', () => {
    const compileSpy = vi.spyOn(stylesheetCompiler, 'compileStylesheet');

    const compileResult = compile({
      stylesheet: {
        uri: 'memory:/single-compile.xsl',
        text: [
          '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
          '  <xsl:template match="/">',
          '    <hello><xsl:value-of select="/root/name"/></hello>',
          '  </xsl:template>',
          '</xsl:stylesheet>',
        ].join('\n'),
      },
    });
    expect(compileResult.ok).toBe(true);
    if (!compileResult.ok) {
      throw new Error('expected compile to succeed');
    }
    expect(compileSpy).toHaveBeenCalledTimes(1);

    const firstResult = transform({
      stylesheet: compileResult.stylesheet,
      sourceXml: {
        uri: 'memory:/first.xml',
        text: '<root><name>alpha</name></root>',
      },
    });

    expect(firstResult.ok).toBe(true);
    expect(compileSpy).toHaveBeenCalledTimes(1);
  });

  it('transforms repeatedly through a compiled stylesheet handle', () => {
    const compileResult = compile({
      stylesheet: {
        uri: 'memory:/reusable.xsl',
        text: [
          '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
          '  <xsl:template match="/">',
          '    <hello><xsl:value-of select="/root/name"/></hello>',
          '  </xsl:template>',
          '</xsl:stylesheet>',
        ].join('\n'),
      },
    });
    expect(compileResult.ok).toBe(true);
    if (!compileResult.ok) {
      throw new Error('expected compile to succeed');
    }

    const firstResult = transform({
      stylesheet: compileResult.stylesheet,
      sourceXml: {
        uri: 'memory:/first.xml',
        text: '<root><name>alpha</name></root>',
      },
    });
    const secondResult = transform({
      stylesheet: compileResult.stylesheet,
      sourceXml: {
        uri: 'memory:/second.xml',
        text: '<root><name>beta</name></root>',
      },
    });

    expect(firstResult).toMatchObject({
      ok: true,
      diagnostics: [],
      output: '<hello>alpha</hello>',
    });
    expect(secondResult).toMatchObject({
      ok: true,
      diagnostics: [],
      output: '<hello>beta</hello>',
    });
  });

  it('surfaces auto execution fallback metadata as a first-class warning notice for in-memory callers', () => {
    const result = compileAndTransform({
      stylesheet: {
        uri: 'memory:/fallback-warning.xsl',
        text: [
          '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
          '  <xsl:template match="/root">',
          '    <out><xsl:apply-templates select="item[position() &lt; (last() div 2) * (last() div 2) * (last() div 2)]"/></out>',
          '  </xsl:template>',
          '  <xsl:template match="item">',
          '    <xsl:value-of select="."/>',
          '  </xsl:template>',
          '</xsl:stylesheet>',
        ].join('\n'),
      },
      sourceXml: {
        uri: 'memory:/input.xml',
        text: '<root><item>a</item><item>b</item><item>c</item><item>d</item></root>',
      },
      options: {
        execution: 'auto',
      },
    });

    expect(result).toMatchObject({
      ok: true,
      diagnostics: [],
      output: '<out>abcd</out>',
      execution: {
        requested: 'auto',
        resolved: 'interpreter',
        fallbackReason: {
          code: 'unsupported_stylesheet',
          message: 'The current stylesheet is outside the native-supported slice for M6.25.',
        },
      },
      notices: [{
        severity: 'warning',
        code: 'native_fallback',
        message: 'The current stylesheet is outside the native-supported slice for M6.25.',
        details: [
          { key: 'requestedExecution', value: 'auto' },
          { key: 'resolvedExecution', value: 'interpreter' },
          { key: 'fallbackCode', value: 'unsupported_stylesheet' },
        ],
        suggestions: [
          {
            kind: 'fix',
            label: 'retry with execution="native" to get a hard unsupported-native error while simplifying the stylesheet',
            confidence: 1,
          },
          {
            kind: 'hint',
            label: 'simplify the select/match shape toward the documented native slice if you want to stay on the native path',
            confidence: 0.9,
          },
        ],
      }],
    });
    expect(result.generatedTs).toContain('export function transform(');
  });
});