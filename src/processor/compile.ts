import { basename } from 'node:path';

import { compileStylesheet } from '../xslt/compile/compiler.js';
import { emitStylesheetDeclarationModule, emitStylesheetModule } from '../xslt/codegen/emit.js';
import { loadExtensionFunctionCatalog } from './extensionFunctions.js';

export interface CompileStylesheetToTsOptions {
  readonly path?: string;
  readonly filePath?: string;
  readonly runtimeModuleSpecifier?: string;
}

export interface CompileStylesheetArtifacts {
  readonly module: string;
  readonly declaration: string;
  readonly digest: string;
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
  const digest = createStylesheetDigest(stylesheetSource);
  const ir = compileStylesheet(stylesheetSource, {
    ...(options.path === undefined && options.filePath === undefined
      ? {}
      : { sourceName: options.path ?? basename(options.filePath!) }),
    ...(options.filePath === undefined ? {} : { extensionFunctions: loadExtensionFunctionCatalog(options.filePath) }),
  });
  const emitOptions = {
    digest,
    ...(options.path === undefined ? {} : { path: options.path }),
    ...(options.runtimeModuleSpecifier === undefined
      ? {}
      : { runtimeModuleSpecifier: options.runtimeModuleSpecifier }),
  };

  return {
    module: emitStylesheetModule(ir, emitOptions),
    declaration: emitStylesheetDeclarationModule(ir, emitOptions),
    digest,
  };
}

function createStylesheetDigest(source: string): string {
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}