import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { assertValidDiagnostic, diagnosticReportFromError, formatDiagnostic } from '../../src/diagnostics/index.js';
import { compileStylesheetToTs } from '../../src/index.js';
import { captureError } from '../helpers/captureError.js';

describe('extension function diagnostics', () => {
  it('reports stylesheet-located type mismatches against functions.ts signatures', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'weaver-extension-functions-'));

    try {
      const stylesheetPath = join(tempDir, 'invoice.xsl');
      const stylesheet = [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:demo="urn:demo">',
        '  <xsl:template match="/">',
        '    <out><xsl:value-of select="demo:formatAmount(\'oops\')"/></out>',
        '  </xsl:template>',
        '</xsl:stylesheet>',
      ].join('\n');
      const functionsModule = [
        "import { defineXsltFunctions } from '@arakendo/weaver-xslt';",
        '',
        'export default defineXsltFunctions(\'urn:demo\', {',
        '  formatAmount(value: number): string {',
        '    return String(value);',
        '  },',
        '});',
      ].join('\n');

      writeFileSync(stylesheetPath, stylesheet, 'utf8');
      writeFileSync(join(tempDir, 'functions.ts'), functionsModule, 'utf8');

      const error = captureError(() => {
        compileStylesheetToTs(stylesheet, {
          path: 'invoice.xsl',
          filePath: stylesheetPath,
        });
      });
      const report = diagnosticReportFromError(error);

      assertValidDiagnostic(report);
      expect(report.code).toBe('XPTY0004');
      expect(report.primary?.uri).toBe('invoice.xsl');
      expect(report.primary?.lineStart).toBe(3);
      expect(report.details).toContainEqual({ key: 'expectedType', value: 'number' });
      expect(report.details).toContainEqual({ key: 'actualType', value: 'string' });
      expect(report.details).toContainEqual({ key: 'signature', value: 'formatAmount(value: number): string' });

      expect(formatDiagnostic(report, stylesheet)).toContain('error[XPTY0004]: Extension function demo:formatAmount argument 1 expects number but got string.');
      expect(formatDiagnostic(report, stylesheet)).toContain('= signature: formatAmount(value: number): string');
    } finally {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });

  it('accepts extension function calls that match functions.ts signatures', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'weaver-extension-functions-'));

    try {
      const stylesheetPath = join(tempDir, 'invoice.xsl');
      const stylesheet = [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:demo="urn:demo">',
        '  <xsl:template match="/">',
        '    <out><xsl:value-of select="demo:formatAmount(42)"/></out>',
        '  </xsl:template>',
        '</xsl:stylesheet>',
      ].join('\n');
      const functionsModule = [
        "import { defineXsltFunctions } from '@arakendo/weaver-xslt';",
        '',
        'export default defineXsltFunctions(\'urn:demo\', {',
        '  formatAmount(value: number): string {',
        '    return String(value);',
        '  },',
        '});',
      ].join('\n');

      writeFileSync(stylesheetPath, stylesheet, 'utf8');
      writeFileSync(join(tempDir, 'functions.ts'), functionsModule, 'utf8');

      expect(() => {
        compileStylesheetToTs(stylesheet, {
          path: 'invoice.xsl',
          filePath: stylesheetPath,
        });
      }).not.toThrow();
    } finally {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });
});