import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

import { afterEach, describe, expect, it } from 'vitest';

import { compileStylesheetArtifacts } from '../../src/compile.js';

const WORKSPACE_ROOT = resolve(import.meta.dirname, '../..');
const FIXTURE_DIR = join(WORKSPACE_ROOT, 'test', 'integration', 'react-app');
const TYPESCRIPT_CLI_PATH = join(WORKSPACE_ROOT, 'node_modules', 'typescript', 'bin', 'tsc');

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

describe('integration fixture react-app', () => {
  let stagedFixtureDir: string | undefined;

  afterEach(() => {
    if (stagedFixtureDir !== undefined) {
      rmSync(stagedFixtureDir, { recursive: true, force: true, maxRetries: 10, retryDelay: 100 });
      stagedFixtureDir = undefined;
    }
  });

  it('type-checks a consumer project against generated stylesheet artifacts', () => {
    const artifacts = compileStylesheetArtifacts(TYPED_PARAMS_STYLESHEET, { path: 'typed-params.xsl' });
    stagedFixtureDir = mkdtempSync(join(tmpdir(), 'weaver-react-app-'));
    cpSync(FIXTURE_DIR, stagedFixtureDir, { recursive: true });

    const generatedModulePath = join(stagedFixtureDir, 'generated', 'typed-params.xsl.ts');
    const generatedDeclarationPath = join(stagedFixtureDir, 'generated', 'typed-params.xsl.d.ts');
    const stagedTsconfigPath = join(stagedFixtureDir, 'tsconfig.json');

    mkdirSync(dirname(generatedModulePath), { recursive: true });
    writeFileSync(generatedModulePath, artifacts.module, 'utf8');
    writeFileSync(generatedDeclarationPath, artifacts.declaration, 'utf8');
    writeFileSync(stagedTsconfigPath, JSON.stringify({
      compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'Bundler',
        strict: true,
        noImplicitAny: true,
        strictNullChecks: true,
        strictFunctionTypes: true,
        strictBindCallApply: true,
        strictPropertyInitialization: true,
        noImplicitThis: true,
        useUnknownInCatchVariables: true,
        alwaysStrict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        exactOptionalPropertyTypes: true,
        noImplicitReturns: true,
        noFallthroughCasesInSwitch: true,
        noUncheckedIndexedAccess: true,
        noImplicitOverride: true,
        esModuleInterop: true,
        forceConsistentCasingInFileNames: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        isolatedModules: true,
        verbatimModuleSyntax: false,
        noEmit: true,
        baseUrl: '.',
        paths: {
          '@arakendo/weaver-xslt/runtime': ['./runtime-shim.ts'],
        },
      },
      include: ['./app.ts', './runtime-shim.ts', './generated/*.ts', './generated/*.d.ts'],
      exclude: [],
    }, null, 2), 'utf8');

    let commandError: Error | undefined;

    try {
      execFileSync(process.execPath, [
        TYPESCRIPT_CLI_PATH,
        '-p',
        stagedTsconfigPath,
      ], {
        cwd: WORKSPACE_ROOT,
        stdio: 'pipe',
      });
    } catch (error) {
      const execError = error as Error & { stdout?: Buffer | string; stderr?: Buffer | string };
      const stdout = String(execError.stdout ?? '');
      const stderr = String(execError.stderr ?? '');
      commandError = new Error([
        execError.message,
        stdout.length > 0 ? `stdout:\n${stdout}` : undefined,
        stderr.length > 0 ? `stderr:\n${stderr}` : undefined,
      ].filter((part): part is string => part !== undefined).join('\n\n'));
    }

    expect(commandError).toBeUndefined();
  });
});