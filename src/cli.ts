import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { diagnosticReportFromError, formatDiagnostic } from './diagnostics/index.js';
import { compileStylesheetArtifacts, XsltProcessor } from './index.js';

export interface CliIo {
  readonly stdout: (text: string) => void;
  readonly stderr: (text: string) => void;
}

export function runCli(args: readonly string[], io: CliIo = defaultIo): number {
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h' || args[0] === 'help') {
    io.stdout(renderUsage());
    return 0;
  }

  const [command] = args;

  switch (command) {
    case 'compile':
      return runCompileCommand(args.slice(1), io);
    case 'run':
      return runTransformCommand(args.slice(1), io);
    default:
      io.stderr(`${renderUsage()}\n`);
      return 1;
  }
}

function runCompileCommand(args: readonly string[], io: CliIo): number {
  const [inputPattern] = args;

  if (inputPattern === undefined || args.length !== 1) {
    io.stderr('Usage: weaver-xslt compile <glob>\n');
    return 1;
  }

  const matchedPaths = globSync(inputPattern, {
    absolute: true,
    nodir: true,
    windowsPathsNoEscape: true,
  }).sort();

  if (matchedPaths.length === 0) {
    io.stderr(`No stylesheets matched ${inputPattern}\n`);
    return 1;
  }

  for (const resolvedInputPath of matchedPaths) {
    const outputPath = `${resolvedInputPath}.ts`;
    const declarationPath = `${resolvedInputPath}.d.ts`;
    const digestPath = `${resolvedInputPath}.digest`;

    try {
      const stylesheet = readFileSync(resolvedInputPath, 'utf8');
      const output = compileStylesheetArtifacts(stylesheet, { path: basename(resolvedInputPath), filePath: resolvedInputPath });

      writeFileSync(outputPath, output.module, 'utf8');
      writeFileSync(declarationPath, output.declaration, 'utf8');
      writeFileSync(digestPath, `${output.digest}\n`, 'utf8');
      io.stdout(`Wrote ${outputPath}\n`);
    } catch (error) {
      const stylesheet = tryReadSource(resolvedInputPath);
      const report = diagnosticReportFromError(error);
      const message = stylesheet === undefined ? report.message : formatDiagnostic(report, stylesheet);

      io.stderr(`${message}\n`);
      return 1;
    }
  }

  return 0;
}

function runTransformCommand(args: readonly string[], io: CliIo): number {
  const parsed = parseRunArguments(args);
  if (parsed === undefined) {
    io.stderr('Usage: weaver-xslt run <stylesheet> --input <xml>\n');
    return 1;
  }

  const resolvedStylesheetPath = resolve(parsed.stylesheetPath);
  const resolvedInputPath = resolve(parsed.inputPath);

  try {
    const stylesheet = readFileSync(resolvedStylesheetPath, 'utf8');
    const inputXml = readFileSync(resolvedInputPath, 'utf8');
    const result = new XsltProcessor(stylesheet).transform(inputXml);

    io.stdout(`${result.output}\n`);
    return 0;
  } catch (error) {
    const stylesheet = tryReadSource(resolvedStylesheetPath);
    const report = diagnosticReportFromError(error);
    const message = stylesheet === undefined ? report.message : formatDiagnostic(report, stylesheet);

    io.stderr(`${message}\n`);
    return 1;
  }
}

function parseRunArguments(args: readonly string[]): { readonly stylesheetPath: string; readonly inputPath: string } | undefined {
  const [stylesheetPath, ...rest] = args;
  if (stylesheetPath === undefined) {
    return undefined;
  }

  let inputPath: string | undefined;
  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];
    if (token === '--input') {
      inputPath = rest[index + 1];
      index += 1;
      continue;
    }

    return undefined;
  }

  if (inputPath === undefined) {
    return undefined;
  }

  return {
    stylesheetPath,
    inputPath,
  };
}

function renderUsage(): string {
  return [
    'Usage:',
    '  weaver-xslt compile <glob>',
    '  weaver-xslt run <stylesheet> --input <xml>',
    '  weaver-xslt --help',
  ].join('\n');
}

const defaultIo: CliIo = {
  stdout: (text) => process.stdout.write(text),
  stderr: (text) => process.stderr.write(text),
};

function tryReadSource(path: string): string | undefined {
  try {
    return readFileSync(path, 'utf8');
  } catch {
    return undefined;
  }
}

if (process.argv[1] !== undefined && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  process.exitCode = runCli(process.argv.slice(2));
}

function globSync(inputPattern: string, _options: { readonly absolute: true; readonly nodir: true; readonly windowsPathsNoEscape: true }): string[] {
  const resolvedPattern = resolve(inputPattern);
  if (!hasGlobMagic(resolvedPattern)) {
    return existsSync(resolvedPattern) ? [resolvedPattern] : [];
  }

  const baseDirectory = findGlobBaseDirectory(resolvedPattern);
  if (!existsSync(baseDirectory)) {
    return [];
  }

  const matcher = createGlobMatcher(resolvedPattern);
  const matches: string[] = [];

  collectFiles(baseDirectory, matches);
  return matches.filter((filePath) => matcher(testPath(filePath)));
}

function collectFiles(directoryPath: string, files: string[]): void {
  for (const entry of readdirSync(directoryPath, { withFileTypes: true })) {
    const childPath = resolve(directoryPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(childPath, files);
      continue;
    }

    if (entry.isFile()) {
      files.push(childPath);
    }
  }
}

function createGlobMatcher(pattern: string): (candidatePath: string) => boolean {
  const normalizedPattern = testPath(pattern);
  let regexSource = '';

  for (let index = 0; index < normalizedPattern.length; index += 1) {
    const character = normalizedPattern[index];
    if (character === undefined) {
      continue;
    }

    if (character === '*') {
      if (normalizedPattern[index + 1] === '*') {
        regexSource += '.*';
        index += 1;
      } else {
        regexSource += '[^/]*';
      }
      continue;
    }

    if (character === '?') {
      regexSource += '[^/]';
      continue;
    }

    regexSource += escapeRegexCharacter(character);
  }

  const matcher = new RegExp(`^${regexSource}$`, 'i');
  return (candidatePath: string) => matcher.test(candidatePath);
}

function findGlobBaseDirectory(pattern: string): string {
  const normalizedPattern = testPath(pattern);
  const segments = normalizedPattern.split('/');
  const baseSegments: string[] = [];

  for (const segment of segments) {
    if (segment.includes('*') || segment.includes('?')) {
      break;
    }

    baseSegments.push(segment);
  }

  if (baseSegments.length === 0) {
    return dirname(pattern);
  }

  return resolve(baseSegments.join('/'));
}

function hasGlobMagic(value: string): boolean {
  return value.includes('*') || value.includes('?');
}

function testPath(value: string): string {
  return value.replaceAll('\\', '/');
}

function escapeRegexCharacter(character: string): string {
  return /[|\\{}()[\]^$+?.]/.test(character) ? `\\${character}` : character;
}