import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import { describe, expect, it } from 'vitest';

import { compileStylesheetArtifacts } from '../src/index.js';
import { runCli } from '../src/cli.js';

function createTestIo() {
  const stdout: string[] = [];
  const stderr: string[] = [];

  return {
    stdout,
    stderr,
    io: {
      stdout: (text: string) => {
        stdout.push(text);
      },
      stderr: (text: string) => {
        stderr.push(text);
      },
    },
  };
}

describe('CLI', () => {
  it('writes <glob>.ts, .d.ts, and .digest outputs for matched stylesheets', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'weaver-cli-'));

    try {
      const firstStylesheetPath = join(tempDir, 'hello.xsl');
      const secondStylesheetPath = join(tempDir, 'goodbye.xsl');
      const stylesheet = [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:template match="/">',
        '    <hello><xsl:value-of select="/root/name"/></hello>',
        '  </xsl:template>',
        '</xsl:stylesheet>',
      ].join('\n');
      const firstExpected = compileStylesheetArtifacts(stylesheet, { path: 'hello.xsl' });
      const secondExpected = compileStylesheetArtifacts(stylesheet.replaceAll('hello', 'goodbye'), { path: 'goodbye.xsl' });
      const { io, stderr, stdout } = createTestIo();

      writeFileSync(firstStylesheetPath, stylesheet, 'utf8');
      writeFileSync(secondStylesheetPath, stylesheet.replaceAll('hello', 'goodbye'), 'utf8');

      const exitCode = runCli(['compile', join(tempDir, '*.xsl')], io);
      const firstOutputPath = `${firstStylesheetPath}.ts`;
      const firstDeclarationPath = `${firstStylesheetPath}.d.ts`;
      const firstDigestPath = `${firstStylesheetPath}.digest`;
      const secondOutputPath = `${secondStylesheetPath}.ts`;
      const secondDeclarationPath = `${secondStylesheetPath}.d.ts`;
      const secondDigestPath = `${secondStylesheetPath}.digest`;

      expect(exitCode).toBe(0);
      expect(stderr).toEqual([]);
      expect(stdout).toEqual([`Wrote ${secondOutputPath}\n`, `Wrote ${firstOutputPath}\n`].sort());
      expect(existsSync(firstOutputPath)).toBe(true);
      expect(existsSync(firstDeclarationPath)).toBe(true);
      expect(existsSync(firstDigestPath)).toBe(true);
      expect(existsSync(secondOutputPath)).toBe(true);
      expect(existsSync(secondDeclarationPath)).toBe(true);
      expect(existsSync(secondDigestPath)).toBe(true);
      expect(readFileSync(firstOutputPath, 'utf8')).toBe(firstExpected.module);
      expect(readFileSync(firstDeclarationPath, 'utf8')).toBe(firstExpected.declaration);
      expect(readFileSync(firstDigestPath, 'utf8')).toBe(`${firstExpected.digest}\n`);
      expect(readFileSync(secondOutputPath, 'utf8')).toBe(secondExpected.module);
      expect(readFileSync(secondDeclarationPath, 'utf8')).toBe(secondExpected.declaration);
      expect(readFileSync(secondDigestPath, 'utf8')).toBe(`${secondExpected.digest}\n`);
    } finally {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });

  it('formats compile errors instead of throwing stacks', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'weaver-cli-'));

    try {
      const stylesheetPath = join(tempDir, 'broken.xsl');
      const stylesheet = [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:template match="/">',
        '    <out><xsl:copy-of select="/root/item"/></out>',
        '  </xsl:template>',
        '</xsl:stylesheet>',
      ].join('\n');
      const { io, stderr, stdout } = createTestIo();

      writeFileSync(stylesheetPath, stylesheet, 'utf8');

      const exitCode = runCli(['compile', stylesheetPath], io);

      expect(exitCode).toBe(1);
      expect(stdout).toEqual([]);
      expect(stderr).toHaveLength(1);
      expect(stderr[0]).toContain('error[XTSE0010]');
      expect(stderr[0]).toContain('xsl:copy-of');
    } finally {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });

  it('runs a stylesheet against an input XML file via the interpreter', () => {
    const tempDir = mkdtempSync(join(tmpdir(), 'weaver-cli-'));

    try {
      const stylesheetPath = join(tempDir, 'hello.xsl');
      const inputPath = join(tempDir, 'input.xml');
      const stylesheet = [
        '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
        '  <xsl:template match="/">',
        '    <hello><xsl:value-of select="/root/name"/></hello>',
        '  </xsl:template>',
        '</xsl:stylesheet>',
      ].join('\n');
      const { io, stderr, stdout } = createTestIo();

      writeFileSync(stylesheetPath, stylesheet, 'utf8');
      writeFileSync(inputPath, '<root><name>world</name></root>', 'utf8');

      const exitCode = runCli(['run', stylesheetPath, '--input', inputPath], io);

      expect(exitCode).toBe(0);
      expect(stderr).toEqual([]);
      expect(stdout).toEqual(['<hello>world</hello>\n']);
    } finally {
      rmSync(tempDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
    }
  });

  it('prints help text for --help without treating it as an error', () => {
    const { io, stderr, stdout } = createTestIo();

    const exitCode = runCli(['--help'], io);

    expect(exitCode).toBe(0);
    expect(stderr).toEqual([]);
    expect(stdout).toEqual([
      [
        'Usage:',
        '  weaver-xslt compile <glob>',
        '  weaver-xslt run <stylesheet> --input <xml>',
        '  weaver-xslt --help',
      ].join('\n'),
    ]);
  });
});