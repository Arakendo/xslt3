import { describe, expect, it } from 'vitest';

import { diagnosticReportFromError, formatDiagnostic, assertValidDiagnostic } from '../../src/diagnostics/index.js';
import { XsltProcessor } from '../../src/index.js';
import type { StylesheetIR } from '../../src/xslt/compile/ir.js';
import { runTransform } from '../../src/xslt/eval/transform.js';

function captureError(action: () => void): unknown {
  try {
    action();
    throw new Error('Expected the action to throw.');
  } catch (error) {
    return error;
  }
}

describe('XSLT diagnostics', () => {
  it('converts unsupported xsl:import declarations into XTSE0165 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:import href="base.xsl"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0165',
      phase: 'compile',
      category: 'analysis',
      message: 'Stylesheet import declarations are not yet implemented in the current MVP+3 slice.',
      details: [{
        key: 'href',
        value: 'base.xsl',
      }],
      primary: {
        lineStart: 2,
        columnStart: 21,
        lineEnd: 2,
        columnEnd: 29,
      },
      suggestions: [{
        kind: 'fix',
        label: 'inline or remove xsl:import in the current MVP+3 slice',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0165]: Stylesheet import declarations are not yet implemented in the current MVP+3 slice.',
      '--> <stylesheet>:2:21',
      '2 |   <xsl:import href="base.xsl"/>',
      '  |                     ^^^^^^^^',
      '  = href: base.xsl',
      '  help: inline or remove xsl:import in the current MVP+3 slice',
    ].join('\n'));
  });

  it('converts unsupported xsl:include declarations into XTSE0165 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:include href="common.xsl"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0165',
      phase: 'compile',
      category: 'analysis',
      message: 'Stylesheet include declarations are not yet implemented in the current MVP+3 slice.',
      details: [{
        key: 'href',
        value: 'common.xsl',
      }],
      primary: {
        lineStart: 2,
        columnStart: 22,
        lineEnd: 2,
        columnEnd: 32,
      },
      suggestions: [{
        kind: 'fix',
        label: 'inline or remove xsl:include in the current MVP+3 slice',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0165]: Stylesheet include declarations are not yet implemented in the current MVP+3 slice.',
      '--> <stylesheet>:2:22',
      '2 |   <xsl:include href="common.xsl"/>',
      '  |                      ^^^^^^^^^^',
      '  = href: common.xsl',
      '  help: inline or remove xsl:include in the current MVP+3 slice',
    ].join('\n'));
  });

  it('suggests the closest xsl:strip-space attribute name for typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:strip-space elments="*"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:strip-space has an unsupported attribute elments.',
      details: [
        { key: 'attributeName', value: 'elments' },
        { key: 'instructionName', value: 'xsl:strip-space' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'did you mean elements="..."?',
        replacement: 'elements',
        confidence: 0.875,
      }],
    });
  });

  it('suggests the closest xsl:output attribute name for typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output methd="xml"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:output has an unsupported attribute methd.',
      details: [
        { key: 'attributeName', value: 'methd' },
        { key: 'instructionName', value: 'xsl:output' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'did you mean method="..."?',
        replacement: 'method',
        confidence: 5 / 6,
      }],
    });
  });

  it('converts known-later xsl:output attributes into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output indent="yes"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:output attribute indent is not yet implemented in the current MVP+3 slice.',
      details: [
        { key: 'attributeName', value: 'indent' },
        { key: 'instructionName', value: 'xsl:output' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove indent from xsl:output or omit xsl:output in the current MVP+3 slice',
        confidence: 1,
      }],
    });
  });

  it('converts known-later xsl:output html method into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="html"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:output method "html" is not yet implemented in the current MVP+3 slice.',
      details: [
        { key: 'method', value: 'html' },
        { key: 'instructionName', value: 'xsl:output' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'use method="xml" or omit xsl:output in the current MVP+3 slice',
        confidence: 1,
      }],
    });
  });

  it('converts known-later xsl:output text method into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="text"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.message).toBe('xsl:output method "text" is not yet implemented in the current MVP+3 slice.');
    expect(report.code).toBe('XTSE0090');
  });

  it('converts known-later xsl:output json method into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="json"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.message).toBe('xsl:output method "json" is not yet implemented in the current MVP+3 slice.');
    expect(report.code).toBe('XTSE0090');
  });

  it('converts invalid xsl:output methods into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="wat"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:output has an unsupported method "wat".',
      details: [
        { key: 'method', value: 'wat' },
        { key: 'instructionName', value: 'xsl:output' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'use method="xml" or omit xsl:output in the current MVP+3 slice',
        confidence: 1,
      }],
    });
  });

  it('suggests the closest xsl:output method value for typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="htlm"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:output has an unsupported method "htlm".',
      details: [
        { key: 'method', value: 'htlm' },
        { key: 'instructionName', value: 'xsl:output' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'did you mean method="html"?',
        replacement: 'html',
        confidence: 0.5,
      }],
    });
  });

  it('converts missing initialTemplate options into runtime diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'main' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0010',
      phase: 'compile',
      category: 'analysis',
      message: 'Initial template main is not declared in the current stylesheet.',
      details: [{
        key: 'initialTemplate',
        value: 'main',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'declare xsl:template name="main" or omit initialTemplate',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Initial template main is not declared in the current stylesheet.',
      '  = initialTemplate: main',
      '  help: declare xsl:template name="main" or omit initialTemplate',
    ].join('\n'));
  });

  it('suggests the closest named template for initialTemplate typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'mian' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean initialTemplate "main"?',
        replacement: 'main',
        confidence: 0.5,
      },
    ]);
  });

  it('converts unsupported initialMode options into runtime diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialMode: 'special' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTDE0040',
      phase: 'runtime',
      category: 'execution',
      message: 'Initial modes are not yet implemented in the current MVP+3 slice.',
      details: [{
        key: 'mode',
        value: 'special',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'omit initialMode and use the default mode in the current MVP+3 slice',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTDE0040]: Initial modes are not yet implemented in the current MVP+3 slice.',
      '  = mode: special',
      '  help: omit initialMode and use the default mode in the current MVP+3 slice',
    ].join('\n'));
  });

  it('converts required xsl:param declarations with select attributes into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting" select="\'hello\'" required="yes"/>',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'main' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0010',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:param with required="yes" cannot also specify a select attribute.',
      details: [{
        key: 'paramName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'remove required="yes" or remove select="..." from xsl:param',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:param with required="yes" cannot also specify a select attribute.',
      '--> <stylesheet>:3:59',
      '3 |     <xsl:param name="greeting" select="\'hello\'" required="yes"/>',
      '  |                                                           ^^^',
      '  = paramName: greeting',
      '  help: remove required="yes" or remove select="..." from xsl:param',
    ].join('\n'));
  });

  it('converts duplicate local xsl:param declarations into XTSE0580 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:param name="greeting" select="\'hello\'"/>',
      '    <xsl:param name="greeting" select="\'hi\'"/>',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0580',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:template cannot declare duplicate xsl:param name greeting.',
      details: [{
        key: 'paramName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'rename or remove one of the duplicate xsl:param declarations for greeting',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0580]: xsl:template cannot declare duplicate xsl:param name greeting.',
      '--> <stylesheet>:4:22',
      '4 |     <xsl:param name="greeting" select="\'hi\'"/>',
      '  |                      ^^^^^^^^',
      '  = paramName: greeting',
      '  help: rename or remove one of the duplicate xsl:param declarations for greeting',
    ].join('\n'));
  });

  it('converts duplicate sibling xsl:with-param declarations into XTSE0670 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="target">',
      '    <xsl:param name="greeting"/>',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="target">',
      '      <xsl:with-param name="greeting" select="\'hello\'"/>',
      '      <xsl:with-param name="greeting" select="\'hi\'"/>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0670',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:call-template cannot declare duplicate xsl:with-param name greeting.',
      details: [{
        key: 'paramName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'rename or remove one of the duplicate xsl:with-param declarations for greeting',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0670]: xsl:call-template cannot declare duplicate xsl:with-param name greeting.',
      '--> <stylesheet>:9:29',
      '9 |       <xsl:with-param name="greeting" select="\'hi\'"/>',
      '  |                             ^^^^^^^^',
      '  = paramName: greeting',
      '  help: rename or remove one of the duplicate xsl:with-param declarations for greeting',
    ].join('\n'));
  });

  it('converts duplicate named xsl:template declarations into XTSE0660 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0660',
      phase: 'compile',
      category: 'analysis',
      message: 'Stylesheet cannot declare duplicate named xsl:template main.',
      details: [{
        key: 'templateName',
        value: 'main',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'rename or remove one of the duplicate named templates for main',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0660]: Stylesheet cannot declare duplicate named xsl:template main.',
      '--> <stylesheet>:5:23',
      '5 |   <xsl:template name="main">',
      '  |                       ^^^^',
      '  = templateName: main',
      '  help: rename or remove one of the duplicate named templates for main',
    ].join('\n'));
  });

  it('converts duplicate global binding declarations into XTSE0630 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:param name="glob" select="1"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:variable name="glob" select="2"/>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0630',
      phase: 'compile',
      category: 'analysis',
      message: 'Stylesheet cannot declare duplicate global binding glob.',
      details: [{
        key: 'bindingName',
        value: 'glob',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'rename or remove one of the duplicate global bindings for glob',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0630]: Stylesheet cannot declare duplicate global binding glob.',
      '--> <stylesheet>:6:23',
      '6 |   <xsl:variable name="glob" select="2"/>',
      '  |                       ^^^^',
      '  = bindingName: glob',
      '  help: rename or remove one of the duplicate global bindings for glob',
    ].join('\n'));
  });

  it('converts xsl:call-template references to undeclared templates into XTSE0650 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="missing"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0650',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:call-template cannot target undeclared template missing.',
      details: [{
        key: 'templateName',
        value: 'missing',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'declare xsl:template name="missing" or update xsl:call-template',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0650]: xsl:call-template cannot target undeclared template missing.',
      '--> <stylesheet>:3:30',
      '3 |     <xsl:call-template name="missing"/>',
      '  |                              ^^^^^^^',
      '  = templateName: missing',
      '  help: declare xsl:template name="missing" or update xsl:call-template',
    ].join('\n'));
  });

  it('suggests the closest named template for xsl:call-template typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="mian"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean xsl:call-template name="main"?',
        replacement: 'main',
        confidence: 0.5,
      },
    ]);
  });

  it('suggests the closest named template for runtime xsl:call-template fallback typos', () => {
    const ir = {
      version: '3.0',
      namespaces: {},
      defaultElementNamespace: '',
      globalBindings: [],
      templates: [
        {
          name: 'main',
          modes: [],
          params: [],
          body: [{
            kind: 'callTemplate',
            name: 'hepler',
            withParams: [],
          }],
        },
        {
          name: 'helper',
          modes: [],
          params: [],
          body: [{
            kind: 'literalElement',
            name: 'out',
            attributes: [],
            body: [],
          }],
        },
      ],
    } satisfies StylesheetIR;
    const error = captureError(() => {
      runTransform(ir, '<root/>', { initialTemplate: 'main' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0650',
      phase: 'compile',
      category: 'analysis',
      message: 'Named template hepler is not declared in the current stylesheet.',
      details: [{
        key: 'templateName',
        value: 'hepler',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'did you mean xsl:call-template name="helper"?',
        replacement: 'helper',
      }],
    });
    expect(report.suggestions[0]?.confidence).toBeCloseTo(2 / 3);
  });

  it('converts undeclared xsl:call-template parameters into XTSE0680 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="target">',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="target">',
      '      <xsl:with-param name="extra" select="1"/>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0680',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:call-template cannot pass undeclared parameter extra to template target.',
      details: [
        {
          key: 'parameterName',
          value: 'extra',
        },
        {
          key: 'templateName',
          value: 'target',
        },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'declare xsl:param name="extra" on template target or remove the xsl:with-param',
        confidence: 1,
      }],
    });
  });

  it('suggests the closest declared parameter for xsl:call-template typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="target">',
      '    <xsl:param name="value"/>',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="target">',
      '      <xsl:with-param name="vaule" select="1"/>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean xsl:with-param name="value"?',
        replacement: 'value',
        confidence: 0.6,
      },
    ]);
  });

  it('converts missing required xsl:call-template parameters into XTSE0690 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="target">',
      '    <xsl:param name="required" required="yes"/>',
      '    <out/>',
      '  </xsl:template>',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="target"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0690',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:call-template must supply required parameter required to template target.',
      details: [
        {
          key: 'parameterName',
          value: 'required',
        },
        {
          key: 'templateName',
          value: 'target',
        },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'add xsl:with-param name="required" to xsl:call-template or make the parameter optional',
        confidence: 1,
      }],
    });
  });

  it('converts unsupported null-namespace attributes on xsl:variable into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:variable name="employee" department="\'IT\'"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:variable has an unsupported attribute department.',
      details: [
        {
          key: 'attributeName',
          value: 'department',
        },
        {
          key: 'instructionName',
          value: 'xsl:variable',
        },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove department from xsl:variable',
        confidence: 1,
      }],
    });
  });

  it('converts required xsl:param declarations with content into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting" required="yes">hello</xsl:param>',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'main' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0010',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:param with required="yes" cannot also specify a sequence constructor.',
      details: [{
        key: 'paramName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'remove required="yes" or remove xsl:param content',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:param with required="yes" cannot also specify a sequence constructor.',
      '--> <stylesheet>:3:42',
      '3 |     <xsl:param name="greeting" required="yes">hello</xsl:param>',
      '  |                                          ^^^',
      '  = paramName: greeting',
      '  help: remove required="yes" or remove xsl:param content',
    ].join('\n'));
  });

  it('converts xsl:param declarations with select attributes and content into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting" select="\'hello\'">ignored</xsl:param>',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'main' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0620',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:param cannot specify both a select attribute and a sequence constructor.',
      details: [{
        key: 'paramName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'remove select="..." or remove xsl:param content',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0620]: xsl:param cannot specify both a select attribute and a sequence constructor.',
      '--> <stylesheet>:3:40',
      '3 |     <xsl:param name="greeting" select="\'hello\'">ignored</xsl:param>',
      '  |                                        ^^^^^^^',
      '  = paramName: greeting',
      '  help: remove select="..." or remove xsl:param content',
    ].join('\n'));
  });

  it('converts top-level xsl:variable declarations with select attributes and content into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:variable name="greeting" select="\'hello\'">ignored</xsl:variable>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0620',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:variable cannot specify both a select attribute and a sequence constructor.',
      details: [{
        key: 'variableName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'remove select="..." or remove xsl:variable content',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0620]: xsl:variable cannot specify both a select attribute and a sequence constructor.',
      '--> <stylesheet>:2:41',
      '2 |   <xsl:variable name="greeting" select="\'hello\'">ignored</xsl:variable>',
      '  |                                         ^^^^^^^',
      '  = variableName: greeting',
      '  help: remove select="..." or remove xsl:variable content',
    ].join('\n'));
  });

  it('converts xsl:with-param instructions with select attributes and content into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="main">',
      '      <xsl:with-param name="greeting" select="\'hello\'">ignored</xsl:with-param>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0620',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:with-param cannot specify both a select attribute and a sequence constructor.',
      details: [{
        key: 'paramName',
        value: 'greeting',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'remove select="..." or remove xsl:with-param content',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0620]: xsl:with-param cannot specify both a select attribute and a sequence constructor.',
      '--> <stylesheet>:4:47',
      '4 |       <xsl:with-param name="greeting" select="\'hello\'">ignored</xsl:with-param>',
      '  |                                               ^^^^^^^',
      '  = paramName: greeting',
      '  help: remove select="..." or remove xsl:with-param content',
    ].join('\n'));
  });

  it('converts missing required stylesheet parameters into runtime diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:param name="greeting" required="yes"/>',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="$greeting"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTDE0050',
      phase: 'runtime',
      category: 'execution',
      message: 'Required stylesheet parameter $greeting was not supplied.',
      details: [{
        key: 'parameterName',
        value: 'greeting',
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTDE0050]: Required stylesheet parameter $greeting was not supplied.',
      '--> <stylesheet>:2:20',
      '2 |   <xsl:param name="greeting" required="yes"/>',
      '  |                    ^^^^^^^^',
      '  in instruction xsl:param name="greeting" (<stylesheet>:2:20)',
      'related:',
      '  top-level param (<stylesheet>:2:20)',
      '  = parameterName: greeting',
    ].join('\n'));
  });

  it('suggests the closest stylesheet parameter when transform options use a typo', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:param name="greeting" required="yes"/>',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="$greeting"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', {
        parameters: {
          greting: 'hello',
        },
      });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean to pass parameters["greeting"]?',
        replacement: 'greeting',
        confidence: 0.875,
      },
    ]);
  });

  it('converts missing required template parameters into runtime diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting" required="yes"/>',
      '    <out><xsl:value-of select="$greeting"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'main' });
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTDE0700',
      phase: 'runtime',
      category: 'execution',
      message: 'Required template parameter $greeting was not supplied.',
      details: [{
        key: 'parameterName',
        value: 'greeting',
      }],
      frames: [{
        kind: 'template',
        label: 'name="main"',
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTDE0700]: Required template parameter $greeting was not supplied.',
      '--> <stylesheet>:3:22',
      '3 |     <xsl:param name="greeting" required="yes"/>',
      '  |                      ^^^^^^^^',
      '  in template name="main" (<stylesheet>:2:23)',
      'related:',
      '  initial template (<stylesheet>:2:23)',
      '  = parameterName: greeting',
    ].join('\n'));
  });

  it('suggests the closest required template parameter when runtime with-param names have a typo', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out>',
      '      <xsl:apply-templates select="/root/item">',
      '        <xsl:with-param name="greting" select="\'hello\'"/>',
      '      </xsl:apply-templates>',
      '    </out>',
      '  </xsl:template>',
      '  <xsl:template match="item">',
      '    <xsl:param name="greeting" required="yes"/>',
      '    <xsl:value-of select="$greeting"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item/></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean xsl:with-param name="greeting"?',
        replacement: 'greeting',
        confidence: 0.875,
      },
    ]);
  });

  it('allows named-only templates when selected via initialTemplate', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <out><xsl:value-of select="name(/root)"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    expect(new XsltProcessor(stylesheet).transform('<root/>', { initialTemplate: 'main' })).toEqual({
      output: '<out>root</out>',
    });
  });

  it('converts unsupported top-level literal result elements into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <out/>',
      '  <xsl:template match="/">',
      '    <ok/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0010',
      phase: 'compile',
      category: 'analysis',
      message: 'Unsupported top-level stylesheet element out in current MVP+3 slice.',
      details: [{
        key: 'elementName',
        value: 'out',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'move result elements inside xsl:template bodies in the current MVP+3 slice',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Unsupported top-level stylesheet element out in current MVP+3 slice.',
      '--> <stylesheet>:2:4',
      '2 |   <out/>',
      '  |    ^^^',
      '  = elementName: out',
      '  help: move result elements inside xsl:template bodies in the current MVP+3 slice',
    ].join('\n'));
  });

  it('converts unsupported top-level XSLT declarations into static diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:decimal-format name="comma" decimal-separator=","/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0010',
      phase: 'compile',
      category: 'analysis',
      message: 'Unsupported top-level XSLT declaration xsl:decimal-format in current MVP+3 slice.',
      details: [{
        key: 'declarationName',
        value: 'xsl:decimal-format',
      }],
      suggestions: [{
        kind: 'fix',
        label: 'remove unsupported top-level declaration xsl:decimal-format in the current MVP+3 slice',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Unsupported top-level XSLT declaration xsl:decimal-format in current MVP+3 slice.',
      '--> <stylesheet>:2:4',
      '2 |   <xsl:decimal-format name="comma" decimal-separator=","/>',
      '  |    ^^^^^^^^^^^^^^^^^^',
      '  = declarationName: xsl:decimal-format',
      '  help: remove unsupported top-level declaration xsl:decimal-format in the current MVP+3 slice',
    ].join('\n'));
  });

  it('uses the version attribute span when the stylesheet version is empty', () => {
    const stylesheet = '<xsl:stylesheet version="" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0500',
      primary: {
        lineStart: 1,
        columnStart: 26,
        lineEnd: 1,
        columnEnd: 26,
      },
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0500]: Stylesheet module must declare a version attribute.',
      '--> <stylesheet>:1:26',
      '1 | <xsl:stylesheet version="" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>',
      '  |                          ^',
      '  help: add version="3.0" to the stylesheet document element',
    ].join('\n'));
  });

  it('converts a missing stylesheet version into XTSE0500', () => {
    const stylesheet = '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0500',
      phase: 'compile',
      category: 'analysis',
      message: 'Stylesheet module must declare a version attribute.',
      suggestions: [{
        kind: 'fix',
        label: 'add version="3.0" to the stylesheet document element',
        replacement: 'version="3.0"',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0500]: Stylesheet module must declare a version attribute.',
      '--> <stylesheet>:1:1',
      '1 | <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>',
      '  | ^',
      '  help: add version="3.0" to the stylesheet document element',
    ].join('\n'));
  });

  it('suggests the closest stylesheet root attribute name for typos', () => {
    const stylesheet = '<xsl:stylesheet verison="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:stylesheet has an unsupported attribute verison.',
      details: [
        { key: 'attributeName', value: 'verison' },
        { key: 'instructionName', value: 'xsl:stylesheet' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'did you mean version="..."?',
        replacement: 'version',
      }],
    });
    expect(report.suggestions[0]?.confidence).toBeCloseTo(5 / 7);
  });

  it('converts known-later stylesheet root attributes into XTSE0090 diagnostics', () => {
    const stylesheet = '<xsl:stylesheet version="3.0" default-mode="special" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:stylesheet attribute default-mode is not yet implemented in the current MVP+3 slice.',
      details: [
        { key: 'attributeName', value: 'default-mode' },
        { key: 'instructionName', value: 'xsl:stylesheet' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove default-mode from xsl:stylesheet in the current MVP+3 slice',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on the stylesheet root', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test" ext:trace="on">',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;

    expect(output).toContain('<out');
    expect(output).toContain('xmlns:ext="urn:test"');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on the stylesheet root into XTSE0090 diagnostics', () => {
    const stylesheet = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xsl:version="3.0"></xsl:stylesheet>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:stylesheet cannot use an attribute in the XSLT namespace: xsl:version.',
      details: [
        { key: 'attributeName', value: 'xsl:version' },
        { key: 'instructionName', value: 'xsl:stylesheet' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:version from xsl:stylesheet',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:template declarations', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/" ext:trace="on">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:template into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/" xsl:mode="special">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:template cannot use an attribute in the XSLT namespace: xsl:mode.',
      details: [
        { key: 'attributeName', value: 'xsl:mode' },
        { key: 'instructionName', value: 'xsl:template' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:mode from xsl:template',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:param declarations', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:param name="greeting" select="\'hello\'" ext:trace="on"/>',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="$greeting"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('hello');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:param into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:param name="greeting" xsl:required="yes"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:param cannot use an attribute in the XSLT namespace: xsl:required.',
      details: [
        { key: 'attributeName', value: 'xsl:required' },
        { key: 'instructionName', value: 'xsl:param' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:required from xsl:param',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:with-param declarations', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <out>',
      '      <xsl:apply-templates select="/root/item">',
      '        <xsl:with-param name="greeting" select="\'hello\'" ext:trace="on"/>',
      '      </xsl:apply-templates>',
      '    </out>',
      '  </xsl:template>',
      '  <xsl:template match="item">',
      '    <xsl:param name="greeting"/>',
      '    <xsl:value-of select="$greeting"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root><item/></root>').output;
    expect(output).toContain('hello');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:with-param into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="main">',
      '      <xsl:with-param name="greeting" xsl:tunnel="yes" select="\'hello\'"/>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting"/>',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:with-param cannot use an attribute in the XSLT namespace: xsl:tunnel.',
      details: [
        { key: 'attributeName', value: 'xsl:tunnel' },
        { key: 'instructionName', value: 'xsl:with-param' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:tunnel from xsl:with-param',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:output declarations', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:output method="xml" ext:trace="on"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:output into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:output method="xml" xsl:indent="yes"/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:output cannot use an attribute in the XSLT namespace: xsl:indent.',
      details: [
        { key: 'attributeName', value: 'xsl:indent' },
        { key: 'instructionName', value: 'xsl:output' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:indent from xsl:output',
        confidence: 1,
      }],
    });
  });

  it('converts an empty stylesheet source into a static diagnostic', () => {
    const stylesheet = '';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0010',
      phase: 'compile',
      category: 'analysis',
      message: 'Stylesheet source is empty.',
      suggestions: [{
        kind: 'fix',
        label: 'provide an xsl:stylesheet or xsl:transform document before running the transform',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Stylesheet source is empty.',
      '  help: provide an xsl:stylesheet or xsl:transform document before running the transform',
    ].join('\n'));
  });

  it('adds a suggestion when the stylesheet root is not xsl:stylesheet', () => {
    const stylesheet = '<out/>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'wrap the stylesheet in an xsl:stylesheet or xsl:transform document element',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Stylesheet document element must be xsl:stylesheet or xsl:transform.',
      '--> <stylesheet>:1:1',
      '1 | <out/>',
      '  | ^',
      '  help: wrap the stylesheet in an xsl:stylesheet or xsl:transform document element',
    ].join('\n'));
  });

  it('adds a suggestion when a stylesheet has no templates', () => {
    const stylesheet = '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>';
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'add at least one xsl:template to the stylesheet',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Stylesheet must declare at least one xsl:template.',
      '--> <stylesheet>:1:1',
      '1 | <xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"></xsl:stylesheet>',
      '  | ^',
      '  help: add at least one xsl:template to the stylesheet',
    ].join('\n'));
  });

  it('adds a suggestion for unsupported template match patterns', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="item[@id]">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item id="1"/></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'use one of the currently supported simple match patterns: /, /name, name, *, node(), or text()',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Unsupported template match pattern "item[@id]" in current MVP+3 slice.',
      '--> <stylesheet>:2:24',
      '2 |   <xsl:template match="item[@id]">',
      '  |                        ^^^^^^^^^',
      '  help: use one of the currently supported simple match patterns: /, /name, name, *, node(), or text()',
    ].join('\n'));
  });

  it('adds a suggestion when xsl:template is missing match and name', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template>',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'add match="..." or name="..." to xsl:template',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:template must declare either match or name.',
      '--> <stylesheet>:2:3',
      '2 |   <xsl:template>',
      '  |   ^',
      '  help: add match="..." or name="..." to xsl:template',
    ].join('\n'));
  });

  it('suggests the closest xsl:template attribute name for typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template macth="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:template has an unsupported attribute macth.',
      details: [
        { key: 'attributeName', value: 'macth' },
        { key: 'instructionName', value: 'xsl:template' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'did you mean match="..."?',
        replacement: 'match',
        confidence: 0.6,
      }],
    });
  });

  it('adds a suggestion when xsl:template uses mode', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/" mode="special">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'remove mode="..." and use the default mode in the current MVP+3 slice',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:template mode is not yet implemented in the current MVP+3 slice.',
      '--> <stylesheet>:2:33',
      '2 |   <xsl:template match="/" mode="special">',
      '  |                                 ^^^^^^^',
      '  help: remove mode="..." and use the default mode in the current MVP+3 slice',
    ].join('\n'));
  });

  it('suggests the closest xsl:if attribute name for typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:if tset="true()"><out/></xsl:if>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean test="..."?',
        replacement: 'test',
        confidence: 0.5,
      },
    ]);
  });

  it('suggests the closest xsl:value-of attribute name for typos', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of selct="\'hello\'"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean select="..."?',
        replacement: 'select',
        confidence: 5 / 6,
      },
    ]);
  });

  it('ignores foreign-namespace attributes on xsl:if instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:if test="true()" ext:trace="on"><out/></xsl:if>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:if into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:if xsl:test="true()" test="true()"><out/></xsl:if>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:if cannot use an attribute in the XSLT namespace: xsl:test.',
      details: [
        { key: 'attributeName', value: 'xsl:test' },
        { key: 'instructionName', value: 'xsl:if' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:test from xsl:if',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:value-of instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="\'hello\'" ext:trace="on"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('hello');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:value-of into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of xsl:select="\'hello\'" select="\'hello\'"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:value-of cannot use an attribute in the XSLT namespace: xsl:select.',
      details: [
        { key: 'attributeName', value: 'xsl:select' },
        { key: 'instructionName', value: 'xsl:value-of' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:select from xsl:value-of',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:apply-templates instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <out><xsl:apply-templates select="/root/item" ext:trace="on"/></out>',
      '  </xsl:template>',
      '  <xsl:template match="item">',
      '    <xsl:value-of select="."/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>').output;
    expect(output).toContain('apple');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:apply-templates into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:apply-templates xsl:select="/root/item" select="/root/item"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:apply-templates cannot use an attribute in the XSLT namespace: xsl:select.',
      details: [
        { key: 'attributeName', value: 'xsl:select' },
        { key: 'instructionName', value: 'xsl:apply-templates' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:select from xsl:apply-templates',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:call-template instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="main" ext:trace="on"/>',
      '  </xsl:template>',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:call-template into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template xsl:name="main" name="main"/>',
      '  </xsl:template>',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:call-template cannot use an attribute in the XSLT namespace: xsl:name.',
      details: [
        { key: 'attributeName', value: 'xsl:name' },
        { key: 'instructionName', value: 'xsl:call-template' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:name from xsl:call-template',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:choose instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:choose ext:trace="on">',
      '      <xsl:when test="true()"><out/></xsl:when>',
      '    </xsl:choose>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:choose into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:choose xsl:trace="on">',
      '      <xsl:when test="true()"><out/></xsl:when>',
      '    </xsl:choose>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:choose cannot use an attribute in the XSLT namespace: xsl:trace.',
      details: [
        { key: 'attributeName', value: 'xsl:trace' },
        { key: 'instructionName', value: 'xsl:choose' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:trace from xsl:choose',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:when instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:choose>',
      '      <xsl:when test="true()" ext:trace="on"><out/></xsl:when>',
      '    </xsl:choose>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:when into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:choose>',
      '      <xsl:when xsl:test="true()" test="true()"><out/></xsl:when>',
      '    </xsl:choose>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:when cannot use an attribute in the XSLT namespace: xsl:test.',
      details: [
        { key: 'attributeName', value: 'xsl:test' },
        { key: 'instructionName', value: 'xsl:when' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:test from xsl:when',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:otherwise instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:choose>',
      '      <xsl:when test="false()"><skip/></xsl:when>',
      '      <xsl:otherwise ext:trace="on"><out/></xsl:otherwise>',
      '    </xsl:choose>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<out');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:otherwise into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:choose>',
      '      <xsl:when test="false()"><skip/></xsl:when>',
      '      <xsl:otherwise xsl:trace="on"><out/></xsl:otherwise>',
      '    </xsl:choose>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:otherwise cannot use an attribute in the XSLT namespace: xsl:trace.',
      details: [
        { key: 'attributeName', value: 'xsl:trace' },
        { key: 'instructionName', value: 'xsl:otherwise' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:trace from xsl:otherwise',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:for-each instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <out><xsl:for-each select="/root/item" ext:trace="on"><xsl:value-of select="."/></xsl:for-each></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root><item>apple</item><item>pear</item></root>').output;
    expect(output).toContain('apple');
    expect(output).toContain('pear');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:for-each into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:for-each xsl:select="/root/item" select="/root/item"><xsl:value-of select="."/></xsl:for-each></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:for-each cannot use an attribute in the XSLT namespace: xsl:select.',
      details: [
        { key: 'attributeName', value: 'xsl:select' },
        { key: 'instructionName', value: 'xsl:for-each' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:select from xsl:for-each',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:comment instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:comment ext:trace="on">hello</xsl:comment>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('<!--hello-->');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:comment into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:comment xsl:trace="on">hello</xsl:comment>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:comment cannot use an attribute in the XSLT namespace: xsl:trace.',
      details: [
        { key: 'attributeName', value: 'xsl:trace' },
        { key: 'instructionName', value: 'xsl:comment' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:trace from xsl:comment',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on xsl:text instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <out><xsl:text ext:trace="on">hello</xsl:text></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('hello');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on xsl:text into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:text xsl:trace="on">hello</xsl:text></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:text cannot use an attribute in the XSLT namespace: xsl:trace.',
      details: [
        { key: 'attributeName', value: 'xsl:trace' },
        { key: 'instructionName', value: 'xsl:text' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:trace from xsl:text',
        confidence: 1,
      }],
    });
  });

  it('ignores foreign-namespace attributes on local xsl:variable instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:ext="urn:test">',
      '  <xsl:template match="/">',
      '    <xsl:variable name="greeting" select="\'hello\'" ext:trace="on"/>',
      '    <out><xsl:value-of select="$greeting"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');

    const output = new XsltProcessor(stylesheet).transform('<root/>').output;
    expect(output).toContain('hello');
    expect(output).not.toContain('ext:trace=');
  });

  it('converts XSLT-namespace attributes on local xsl:variable into XTSE0090 diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:variable xsl:name="greeting" name="greeting" select="\'hello\'"/>',
      '    <out><xsl:value-of select="$greeting"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0090',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:variable cannot use an attribute in the XSLT namespace: xsl:name.',
      details: [
        { key: 'attributeName', value: 'xsl:name' },
        { key: 'instructionName', value: 'xsl:variable' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove xsl:name from xsl:variable',
        confidence: 1,
      }],
    });
  });

  it('adds a suggestion when xsl:apply-templates uses mode', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:apply-templates select="/root/item" mode="special"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'remove mode="..." and use the default mode in the current MVP+3 slice',
        replacement: 'mode',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:apply-templates mode is not yet implemented in the current MVP+3 slice.',
      '--> <stylesheet>:3:57',
      '3 |     <out><xsl:apply-templates select="/root/item" mode="special"/></out>',
      '  |                                                         ^^^^^^^',
      '  help: remove mode="..." and use the default mode in the current MVP+3 slice',
    ].join('\n'));
  });

  it('adds a suggestion when xsl:apply-templates has non-xsl:with-param children', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:apply-templates select="/root/item">',
      '      <xsl:text>ignored</xsl:text>',
      '    </xsl:apply-templates>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'replace the child with xsl:with-param or remove it from xsl:apply-templates',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:apply-templates only supports xsl:with-param children; found xsl:text.',
      '--> <stylesheet>:4:8',
      '4 |       <xsl:text>ignored</xsl:text>',
      '  |        ^^^^^^^^',
      '  help: replace the child with xsl:with-param or remove it from xsl:apply-templates',
    ].join('\n'));
  });

  it('adds a suggestion when xsl:call-template has non-xsl:with-param children', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="main">',
      '      <xsl:text>ignored</xsl:text>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '  <xsl:template name="main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'replace the child with xsl:with-param or remove it from xsl:call-template',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:call-template only supports xsl:with-param children; found xsl:text.',
      '--> <stylesheet>:4:8',
      '4 |       <xsl:text>ignored</xsl:text>',
      '  |        ^^^^^^^^',
      '  help: replace the child with xsl:with-param or remove it from xsl:call-template',
    ].join('\n'));
  });

  it('adds a suggestion when xsl:value-of is missing select', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'add a select="..." attribute to xsl:value-of',
        replacement: 'select="..."',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:value-of requires a select attribute.',
      '--> <stylesheet>:3:10',
      '3 |     <out><xsl:value-of/></out>',
      '  |          ^',
      '  help: add a select="..." attribute to xsl:value-of',
    ].join('\n'));
  });

  it('adds a suggestion when xsl:if is missing test', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:if><out/></xsl:if>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'add a test="..." attribute to xsl:if',
        replacement: 'test="..."',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:if requires a test attribute.',
      '--> <stylesheet>:3:5',
      '3 |     <xsl:if><out/></xsl:if>',
      '  |     ^',
      '  help: add a test="..." attribute to xsl:if',
    ].join('\n'));
  });

  it('adds a suggestion when xsl:call-template is missing name', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'add a name="..." attribute to xsl:call-template',
        replacement: 'name="..."',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:call-template requires a name attribute.',
      '--> <stylesheet>:3:5',
      '3 |     <xsl:call-template/>',
      '  |     ^',
      '  help: add a name="..." attribute to xsl:call-template',
    ].join('\n'));
  });

  it('adds a suggestion when local xsl:variable is missing name', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:variable select="\'hello\'"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'add a name="..." attribute to xsl:variable',
        replacement: 'name="..."',
        confidence: 1,
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: xsl:variable requires a name attribute.',
      '--> <stylesheet>:3:5',
      '3 |     <xsl:variable select="\'hello\'"/>',
      '  |     ^',
      '  help: add a name="..." attribute to xsl:variable',
    ].join('\n'));
  });

  it('adds a suggestion when local xsl:variable mixes select and content', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:variable name="greeting" select="\'hello\'">ignored</xsl:variable>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XTSE0620',
      phase: 'compile',
      category: 'analysis',
      message: 'xsl:variable cannot specify both a select attribute and a sequence constructor.',
      details: [
        { key: 'variableName', value: 'greeting' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'remove select="..." or remove xsl:variable content',
        confidence: 1,
      }],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0620]: xsl:variable cannot specify both a select attribute and a sequence constructor.',
      '--> <stylesheet>:3:43',
      '3 |     <xsl:variable name="greeting" select="\'hello\'">ignored</xsl:variable>',
      '  |                                           ^^^^^^^',
      '  = variableName: greeting',
      '  help: remove select="..." or remove xsl:variable content',
    ].join('\n'));
  });

  it('surfaces malformed XPath syntax in xsl:if test attributes', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:if test="1 + "><out/></xsl:if>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      category: 'syntax',
      primary: expect.objectContaining({
        uri: '<xpath>',
      }),
    });
  });

  it('reports unknown namespace prefixes in xsl:call-template names precisely', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="missing:main"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0081',
      phase: 'compile',
      category: 'syntax',
      message: 'Unknown namespace prefix "missing" in xsl:call-template name.',
      details: [
        { key: 'namespacePrefix', value: 'missing' },
        { key: 'qName', value: 'missing:main' },
      ],
    });

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XPST0081]: Unknown namespace prefix "missing" in xsl:call-template name.',
      '--> <stylesheet>:3:30',
      '3 |     <xsl:call-template name="missing:main"/>',
      '  |                              ^^^^^^^^^^^^',
      '  = namespacePrefix: missing',
      '  = qName: missing:main',
    ].join('\n'));
  });

  it('surfaces malformed XPath syntax in xsl:value-of select attributes', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="1 + "/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      category: 'syntax',
      primary: expect.objectContaining({
        uri: '<xpath>',
      }),
    });
  });

  it('wraps malformed xsl:value-of select syntax with stylesheet instruction context', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="1 + "/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.causes).toHaveLength(1);
    expect(report.causes[0]).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      primary: expect.objectContaining({ uri: '<xpath>' }),
    });
    expect(report.related).toEqual([
      {
        label: 'containing instruction',
        span: {
          uri: '<stylesheet>',
          offsetStart: 138,
          offsetEnd: 142,
          lineStart: 3,
          columnStart: 32,
          lineEnd: 3,
          columnEnd: 36,
        },
      },
    ]);
    expect(report.frames).toEqual([
      {
        kind: 'instruction',
        label: 'xsl:value-of select="1 + "',
        span: {
          uri: '<stylesheet>',
          offsetStart: 138,
          offsetEnd: 142,
          lineStart: 3,
          columnStart: 32,
          lineEnd: 3,
          columnEnd: 36,
        },
      },
    ]);

    expect(formatDiagnostic(report, '1 + ')).toBe([
      'error[XPST0003]: Unexpected token "".',
      '--> <xpath>:1:5',
      '1 | 1 + ',
      '  |     ^',
      '  in instruction xsl:value-of select="1 + " (<stylesheet>:3:32)',
      'related:',
      '  containing instruction (<stylesheet>:3:32)',
    ].join('\n'));
  });

  it('surfaces malformed XPath syntax in xsl:apply-templates select attributes', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:apply-templates select="1 + "/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      category: 'syntax',
      primary: expect.objectContaining({
        uri: '<xpath>',
      }),
    });
  });

  it('reports unknown namespace prefixes in local xsl:variable names precisely', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:variable name="missing:value" select="\'hello\'"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0081',
      phase: 'compile',
      category: 'syntax',
      message: 'Unknown namespace prefix "missing" in xsl:variable name.',
      details: [
        { key: 'namespacePrefix', value: 'missing' },
        { key: 'qName', value: 'missing:value' },
      ],
    });
  });

  it('reports unknown namespace prefixes in xsl:with-param names precisely', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <xsl:call-template name="main">',
      '      <xsl:with-param name="missing:value" select="\'hello\'"/>',
      '    </xsl:call-template>',
      '  </xsl:template>',
      '  <xsl:template name="main"/>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0081',
      phase: 'compile',
      category: 'syntax',
      message: 'Unknown namespace prefix "missing" in xsl:with-param name.',
      details: [
        { key: 'namespacePrefix', value: 'missing' },
        { key: 'qName', value: 'missing:value' },
      ],
    });
  });

  it('surfaces malformed XPath syntax in xsl:template match attributes', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="1 + "><out/></xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      category: 'syntax',
      primary: expect.objectContaining({
        uri: '<xpath>',
      }),
    });
  });

  it('wraps malformed xsl:template match syntax with stylesheet template context', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="1 + "><out/></xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.causes).toHaveLength(1);
    expect(report.causes[0]).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      primary: expect.objectContaining({ uri: '<xpath>' }),
    });
    expect(report.related).toEqual([
      {
        label: 'containing template',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 107,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 28,
        },
      },
    ]);
    expect(report.frames).toEqual([
      {
        kind: 'template',
        label: 'match="1 + "',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 107,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 28,
        },
      },
    ]);

    expect(formatDiagnostic(report, '1 + ')).toBe([
      'error[XPST0003]: Unexpected token "".',
      '--> <xpath>:1:5',
      '1 | 1 + ',
      '  |     ^',
      '  in template match="1 + " (<stylesheet>:2:24)',
      'related:',
      '  containing template (<stylesheet>:2:24)',
    ].join('\n'));
  });

  it('surfaces malformed XPath syntax in xsl:param select attributes', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting" select="1 + "/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      category: 'syntax',
      primary: expect.objectContaining({
        uri: '<xpath>',
      }),
    });
  });

  it('wraps malformed xsl:param select syntax with stylesheet instruction context', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="greeting" select="1 + "/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.causes).toHaveLength(1);
    expect(report.causes[0]).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      primary: expect.objectContaining({ uri: '<xpath>' }),
    });
    expect(report.related).toEqual([
      {
        label: 'containing instruction',
        span: {
          uri: '<stylesheet>',
          offsetStart: 148,
          offsetEnd: 152,
          lineStart: 3,
          columnStart: 40,
          lineEnd: 3,
          columnEnd: 44,
        },
      },
    ]);
    expect(report.frames).toEqual([
      {
        kind: 'instruction',
        label: 'xsl:param select="1 + "',
        span: {
          uri: '<stylesheet>',
          offsetStart: 148,
          offsetEnd: 152,
          lineStart: 3,
          columnStart: 40,
          lineEnd: 3,
          columnEnd: 44,
        },
      },
    ]);

    expect(formatDiagnostic(report, '1 + ')).toBe([
      'error[XPST0003]: Unexpected token "".',
      '--> <xpath>:1:5',
      '1 | 1 + ',
      '  |     ^',
      '  in instruction xsl:param select="1 + " (<stylesheet>:3:40)',
      'related:',
      '  containing instruction (<stylesheet>:3:40)',
    ].join('\n'));
  });

  it('surfaces malformed XPath syntax in top-level xsl:variable select attributes', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:variable name="greeting" select="1 + "/>',
      '  <xsl:template match="/">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0003',
      phase: 'compile',
      category: 'syntax',
      primary: expect.objectContaining({
        uri: '<xpath>',
      }),
    });
  });

  it('reports unknown namespace prefixes in xsl:param names precisely', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="main">',
      '    <xsl:param name="missing:value"/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0081',
      phase: 'compile',
      category: 'syntax',
      message: 'Unknown namespace prefix "missing" in xsl:param name.',
      details: [
        { key: 'namespacePrefix', value: 'missing' },
        { key: 'qName', value: 'missing:value' },
      ],
    });
  });

  it('reports unknown namespace prefixes in xsl:template names precisely', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template name="missing:main">',
      '    <out/>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPST0081',
      phase: 'compile',
      category: 'syntax',
      message: 'Unknown namespace prefix "missing" in xsl:template name.',
      details: [
        { key: 'namespacePrefix', value: 'missing' },
        { key: 'qName', value: 'missing:main' },
      ],
    });
  });

  it('adds a suggestion for near-miss unsupported XSLT instructions', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:vale-of select="/root/item"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.suggestions).toEqual([
      {
        kind: 'fix',
        label: 'did you mean xsl:value-of?',
        replacement: 'xsl:value-of',
        confidence: expect.any(Number),
      },
    ]);
    expect(report.details).toEqual([
      {
        key: 'instructionName',
        value: 'xsl:vale-of',
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Unsupported XSLT instruction xsl:vale-of in current MVP+3 slice.',
      '--> <stylesheet>:3:11',
      '3 |     <out><xsl:vale-of select="/root/item"/></out>',
      '  |           ^^^^^^^^^^^',
      '  = instructionName: xsl:vale-of',
      '  help: did you mean xsl:value-of?',
    ].join('\n'));
  });

  it('converts unsupported XSLT instructions into static diagnostics with stylesheet spans', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:copy-of select="/root/item"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchInlineSnapshot(`
      {
        "category": "analysis",
        "causes": [],
        "code": "XTSE0010",
        "details": [
          {
            "key": "instructionName",
            "value": "xsl:copy-of",
          },
        ],
        "frames": [],
        "message": "Unsupported XSLT instruction xsl:copy-of in current MVP+3 slice.",
        "phase": "compile",
        "primary": {
          "columnEnd": 22,
          "columnStart": 11,
          "lineEnd": 3,
          "lineStart": 3,
          "offsetEnd": 128,
          "offsetStart": 117,
          "uri": "<stylesheet>",
        },
        "related": [],
        "severity": "error",
        "suggestions": [],
      }
    `);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XTSE0010]: Unsupported XSLT instruction xsl:copy-of in current MVP+3 slice.',
      '--> <stylesheet>:3:11',
      '3 |     <out><xsl:copy-of select="/root/item"/></out>',
      '  |           ^^^^^^^^^^^',
      '  = instructionName: xsl:copy-of',
    ].join('\n'));
  });

  it('wraps xsl:value-of runtime failures with template and instruction frames', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:value-of select="&quot;tea&quot; + 1"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.frames).toEqual([
      {
        kind: 'template',
        label: 'match="/"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 104,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 25,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:value-of select=""tea" + 1"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 138,
          offsetEnd: 157,
          lineStart: 3,
          columnStart: 32,
          lineEnd: 3,
          columnEnd: 51,
        },
      },
    ]);
    expect(report.related).toEqual([
      {
        label: 'enclosing template',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 104,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 25,
        },
      },
      {
        label: 'containing instruction',
        span: {
          uri: '<stylesheet>',
          offsetStart: 138,
          offsetEnd: 157,
          lineStart: 3,
          columnStart: 32,
          lineEnd: 3,
          columnEnd: 51,
        },
      },
    ]);
    expect(report).toMatchInlineSnapshot(`
      {
        "category": "type",
        "causes": [
          {
            "category": "type",
            "causes": [],
            "code": "XPTY0004",
            "details": [
              {
                "key": "expectedType",
                "value": "xs:double or xs:integer",
              },
              {
                "key": "actualType",
                "value": "xs:string",
              },
            ],
            "frames": [],
            "message": "Expected a single numeric value.",
            "phase": "runtime",
            "primary": {
              "columnEnd": 6,
              "columnStart": 1,
              "lineEnd": 1,
              "lineStart": 1,
              "offsetEnd": 5,
              "offsetStart": 0,
              "uri": "<xpath>",
            },
            "related": [],
            "severity": "error",
            "suggestions": [],
          },
        ],
        "code": "XPTY0004",
        "details": [
          {
            "key": "expectedType",
            "value": "xs:double or xs:integer",
          },
          {
            "key": "actualType",
            "value": "xs:string",
          },
        ],
        "frames": [
          {
            "kind": "template",
            "label": "match=\"/\"",
            "span": {
              "columnEnd": 25,
              "columnStart": 24,
              "lineEnd": 2,
              "lineStart": 2,
              "offsetEnd": 104,
              "offsetStart": 103,
              "uri": "<stylesheet>",
            },
          },
          {
            "kind": "instruction",
            "label": "xsl:value-of select=\"\"tea\" + 1\"",
            "span": {
              "columnEnd": 51,
              "columnStart": 32,
              "lineEnd": 3,
              "lineStart": 3,
              "offsetEnd": 157,
              "offsetStart": 138,
              "uri": "<stylesheet>",
            },
          },
        ],
        "message": "Expected a single numeric value.",
        "phase": "runtime",
        "primary": {
          "columnEnd": 6,
          "columnStart": 1,
          "lineEnd": 1,
          "lineStart": 1,
          "offsetEnd": 5,
          "offsetStart": 0,
          "uri": "<xpath>",
        },
        "related": [
          {
            "label": "enclosing template",
            "span": {
              "columnEnd": 25,
              "columnStart": 24,
              "lineEnd": 2,
              "lineStart": 2,
              "offsetEnd": 104,
              "offsetStart": 103,
              "uri": "<stylesheet>",
            },
          },
          {
            "label": "containing instruction",
            "span": {
              "columnEnd": 51,
              "columnStart": 32,
              "lineEnd": 3,
              "lineStart": 3,
              "offsetEnd": 157,
              "offsetStart": 138,
              "uri": "<stylesheet>",
            },
          },
        ],
        "severity": "error",
        "suggestions": [],
      }
    `);

    expect(formatDiagnostic(report, '"tea" + 1')).toBe([
      'error[XPTY0004]: Expected a single numeric value.',
      '--> <xpath>:1:1',
      '1 | "tea" + 1',
      '  | ^^^^^',
      '  in template match="/" (<stylesheet>:2:24)',
      '  in instruction xsl:value-of select=""tea" + 1" (<stylesheet>:3:32)',
      'related:',
      '  enclosing template (<stylesheet>:2:24)',
      '  containing instruction (<stylesheet>:3:32)',
      '  = expectedType: xs:double or xs:integer',
      '  = actualType: xs:string',
    ].join('\n'));
  });

  it('converts non-node xsl:apply-templates selections into runtime diagnostics', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:apply-templates select="1"/></out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root/>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report).toMatchObject({
      code: 'XPTY0004',
      phase: 'runtime',
      category: 'type',
      message: 'xsl:apply-templates requires a sequence of nodes.',
      primary: {
        lineStart: 3,
        columnStart: 39,
        lineEnd: 3,
        columnEnd: 40,
      },
      details: [
        { key: 'expectedType', value: 'node()*' },
        { key: 'actualType', value: 'xs:double' },
      ],
      suggestions: [{
        kind: 'fix',
        label: 'use a node-selecting expression for xsl:apply-templates',
        confidence: 1,
      }],
    });
    expect(report.frames).toEqual([
      {
        kind: 'template',
        label: 'match="/"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 104,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 25,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:apply-templates select="1"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 145,
          offsetEnd: 146,
          lineStart: 3,
          columnStart: 39,
          lineEnd: 3,
          columnEnd: 40,
        },
      },
    ]);
    expect(report.related).toEqual([
      {
        label: 'enclosing template',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 104,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 25,
        },
      },
      {
        label: 'caller instruction',
        span: {
          uri: '<stylesheet>',
          offsetStart: 145,
          offsetEnd: 146,
          lineStart: 3,
          columnStart: 39,
          lineEnd: 3,
          columnEnd: 40,
        },
      },
    ]);

    expect(formatDiagnostic(report, stylesheet)).toBe([
      'error[XPTY0004]: xsl:apply-templates requires a sequence of nodes.',
      '--> <stylesheet>:3:39',
      '3 |     <out><xsl:apply-templates select="1"/></out>',
      '  |                                       ^',
      '  in template match="/" (<stylesheet>:2:24)',
      '  in instruction xsl:apply-templates select="1" (<stylesheet>:3:39)',
      'related:',
      '  enclosing template (<stylesheet>:2:24)',
      '  caller instruction (<stylesheet>:3:39)',
      '  = expectedType: node()*',
      '  = actualType: xs:double',
      '  help: use a node-selecting expression for xsl:apply-templates',
    ].join('\n'));
  });

  it('preserves the caller chain through xsl:apply-templates', () => {
    const stylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <out><xsl:apply-templates select="/root/item"/></out>',
      '  </xsl:template>',
      '  <xsl:template match="item">',
      '    <item><xsl:value-of select="&quot;tea&quot; + 1"/></item>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const error = captureError(() => {
      new XsltProcessor(stylesheet).transform('<root><item>apple</item></root>');
    });
    const report = diagnosticReportFromError(error);

    assertValidDiagnostic(report);
    expect(report.frames).toEqual([
      {
        kind: 'template',
        label: 'match="/"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 104,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 25,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:apply-templates select="/root/item"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 145,
          offsetEnd: 155,
          lineStart: 3,
          columnStart: 39,
          lineEnd: 3,
          columnEnd: 49,
        },
      },
      {
        kind: 'template',
        label: 'match="item"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 206,
          offsetEnd: 210,
          lineStart: 5,
          columnStart: 24,
          lineEnd: 5,
          columnEnd: 28,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:value-of select=""tea" + 1"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 245,
          offsetEnd: 264,
          lineStart: 6,
          columnStart: 33,
          lineEnd: 6,
          columnEnd: 52,
        },
      },
    ]);
    expect(report.related).toEqual([
      {
        label: 'enclosing template',
        span: {
          uri: '<stylesheet>',
          offsetStart: 103,
          offsetEnd: 104,
          lineStart: 2,
          columnStart: 24,
          lineEnd: 2,
          columnEnd: 25,
        },
      },
      {
        label: 'caller instruction',
        span: {
          uri: '<stylesheet>',
          offsetStart: 145,
          offsetEnd: 155,
          lineStart: 3,
          columnStart: 39,
          lineEnd: 3,
          columnEnd: 49,
        },
      },
      {
        label: 'enclosing template',
        span: {
          uri: '<stylesheet>',
          offsetStart: 206,
          offsetEnd: 210,
          lineStart: 5,
          columnStart: 24,
          lineEnd: 5,
          columnEnd: 28,
        },
      },
      {
        label: 'containing instruction',
        span: {
          uri: '<stylesheet>',
          offsetStart: 245,
          offsetEnd: 264,
          lineStart: 6,
          columnStart: 33,
          lineEnd: 6,
          columnEnd: 52,
        },
      },
    ]);
    expect(report.causes).toHaveLength(1);
    expect(report.causes[0]).toMatchObject({
      code: 'XPTY0004',
      frames: [],
    });

    expect(formatDiagnostic(report, '"tea" + 1')).toBe([
      'error[XPTY0004]: Expected a single numeric value.',
      '--> <xpath>:1:1',
      '1 | "tea" + 1',
      '  | ^^^^^',
      '  in template match="/" (<stylesheet>:2:24)',
      '  in instruction xsl:apply-templates select="/root/item" (<stylesheet>:3:39)',
      '  in template match="item" (<stylesheet>:5:24)',
      '  in instruction xsl:value-of select=""tea" + 1" (<stylesheet>:6:33)',
      'related:',
      '  enclosing template (<stylesheet>:2:24)',
      '  caller instruction (<stylesheet>:3:39)',
      '  enclosing template (<stylesheet>:5:24)',
      '  containing instruction (<stylesheet>:6:33)',
      '  = expectedType: xs:double or xs:integer',
      '  = actualType: xs:string',
    ].join('\n'));
  });
});