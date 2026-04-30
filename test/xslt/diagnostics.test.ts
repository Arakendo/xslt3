import { describe, expect, it } from 'vitest';

import { diagnosticReportFromError, formatDiagnostic, assertValidDiagnostic } from '../../src/diagnostics/index.js';
import { XsltProcessor } from '../../src/index.js';

function captureError(action: () => void): unknown {
  try {
    action();
    throw new Error('Expected the action to throw.');
  } catch (error) {
    return error;
  }
}

describe('XSLT diagnostics', () => {
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
          offsetStart: 82,
          offsetEnd: 83,
          lineStart: 2,
          columnStart: 3,
          lineEnd: 2,
          columnEnd: 4,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:value-of select=""tea" + 1"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 116,
          offsetEnd: 117,
          lineStart: 3,
          columnStart: 10,
          lineEnd: 3,
          columnEnd: 11,
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
              "columnEnd": 4,
              "columnStart": 3,
              "lineEnd": 2,
              "lineStart": 2,
              "offsetEnd": 83,
              "offsetStart": 82,
              "uri": "<stylesheet>",
            },
          },
          {
            "kind": "instruction",
            "label": "xsl:value-of select=\"\"tea\" + 1\"",
            "span": {
              "columnEnd": 11,
              "columnStart": 10,
              "lineEnd": 3,
              "lineStart": 3,
              "offsetEnd": 117,
              "offsetStart": 116,
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
        "related": [],
        "severity": "error",
        "suggestions": [],
      }
    `);

    expect(formatDiagnostic(report, '"tea" + 1')).toBe([
      'error[XPTY0004]: Expected a single numeric value.',
      '--> <xpath>:1:1',
      '1 | "tea" + 1',
      '  | ^^^^^',
      '  in template match="/" (<stylesheet>:2:3)',
      '  in instruction xsl:value-of select=""tea" + 1" (<stylesheet>:3:10)',
      '  = expectedType: xs:double or xs:integer',
      '  = actualType: xs:string',
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
          offsetStart: 82,
          offsetEnd: 83,
          lineStart: 2,
          columnStart: 3,
          lineEnd: 2,
          columnEnd: 4,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:apply-templates select="/root/item"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 116,
          offsetEnd: 117,
          lineStart: 3,
          columnStart: 10,
          lineEnd: 3,
          columnEnd: 11,
        },
      },
      {
        kind: 'template',
        label: 'match="item"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 185,
          offsetEnd: 186,
          lineStart: 5,
          columnStart: 3,
          lineEnd: 5,
          columnEnd: 4,
        },
      },
      {
        kind: 'instruction',
        label: 'xsl:value-of select=""tea" + 1"',
        span: {
          uri: '<stylesheet>',
          offsetStart: 223,
          offsetEnd: 224,
          lineStart: 6,
          columnStart: 11,
          lineEnd: 6,
          columnEnd: 12,
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
      '  in template match="/" (<stylesheet>:2:3)',
      '  in instruction xsl:apply-templates select="/root/item" (<stylesheet>:3:10)',
      '  in template match="item" (<stylesheet>:5:3)',
      '  in instruction xsl:value-of select=""tea" + 1" (<stylesheet>:6:11)',
      '  = expectedType: xs:double or xs:integer',
      '  = actualType: xs:string',
    ].join('\n'));
  });
});