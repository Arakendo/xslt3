import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

import { loadExtensionFunctionCatalog } from './extensionFunctions.js';
import {
  compileStylesheetRuntimeArtifacts as compileStylesheetRuntimeArtifactsCore,
  createStylesheetDigest,
  type CompileStylesheetArtifacts,
  type CompileStylesheetRuntimeArtifacts,
} from './runtimeArtifacts.js';

export { createStylesheetDigest };
export type { CompileStylesheetArtifacts, CompileStylesheetRuntimeArtifacts };

export interface CompileStylesheetToTsOptions {
  readonly path?: string;
  readonly filePath?: string;
  readonly runtimeModuleSpecifier?: string;
  readonly sampleDocument?: string;
}

export interface CompileStylesheetArtifactsFromFileOptions {
  readonly runtimeModuleSpecifier?: string;
  readonly sampleDocumentPath?: string;
}

export function compileStylesheetToTs(
  stylesheetSource: string,
  options: CompileStylesheetToTsOptions = {},
): string {
  return compileStylesheetArtifacts(stylesheetSource, options).module;
}

export function compileStylesheetToDts(
  stylesheetSource: string,
  options: CompileStylesheetToTsOptions = {},
): string {
  return compileStylesheetArtifacts(stylesheetSource, options).declaration;
}

export function compileStylesheetArtifacts(
  stylesheetSource: string,
  options: CompileStylesheetToTsOptions = {},
): CompileStylesheetArtifacts {
  const artifacts = compileStylesheetRuntimeArtifacts(stylesheetSource, options);
  return {
    module: artifacts.module,
    declaration: artifacts.declaration,
    digest: artifacts.digest,
    sourceMap: artifacts.sourceMap,
    diagnostics: artifacts.diagnostics,
  };
}

export function compileStylesheetRuntimeArtifacts(
  stylesheetSource: string,
  options: CompileStylesheetToTsOptions = {},
): CompileStylesheetRuntimeArtifacts {
  return compileStylesheetRuntimeArtifactsCore(stylesheetSource, {
    ...(options.path === undefined ? {} : { path: options.path }),
    ...(options.path === undefined && options.filePath === undefined
      ? {}
      : { sourceName: options.path ?? basename(options.filePath!) }),
    ...(options.runtimeModuleSpecifier === undefined
      ? {}
      : { runtimeModuleSpecifier: options.runtimeModuleSpecifier }),
    ...(options.sampleDocument === undefined ? {} : { sampleDocument: options.sampleDocument }),
    ...(options.filePath === undefined ? {} : { extensionFunctions: loadExtensionFunctionCatalog(options.filePath) }),
  });
}

export function compileStylesheetArtifactsFromFile(
  stylesheetPath: string,
  options: CompileStylesheetArtifactsFromFileOptions = {},
): CompileStylesheetArtifacts {
  const resolvedStylesheetPath = resolve(stylesheetPath);
  const stylesheetSource = readFileSync(resolvedStylesheetPath, 'utf8');
  const sampleDocument = options.sampleDocumentPath === undefined
    ? undefined
    : readFileSync(resolve(options.sampleDocumentPath), 'utf8');

  return compileStylesheetArtifacts(stylesheetSource, {
    path: basename(resolvedStylesheetPath),
    filePath: resolvedStylesheetPath,
    ...(options.runtimeModuleSpecifier === undefined
      ? {}
      : { runtimeModuleSpecifier: options.runtimeModuleSpecifier }),
    ...(sampleDocument === undefined ? {} : { sampleDocument }),
  });
}
