import { compileStylesheet } from '../xslt/compile/compiler.js';
import { emitStylesheetModule } from '../xslt/codegen/emit.js';

export interface CompileStylesheetToTsOptions {
  readonly path?: string;
  readonly runtimeModuleSpecifier?: string;
}

export function compileStylesheetToTs(
  stylesheetSource: string,
  options: CompileStylesheetToTsOptions = {},
): string {
  const ir = compileStylesheet(stylesheetSource);

  return emitStylesheetModule(ir, {
    digest: createStylesheetDigest(stylesheetSource),
    ...(options.path === undefined ? {} : { path: options.path }),
    ...(options.runtimeModuleSpecifier === undefined
      ? {}
      : { runtimeModuleSpecifier: options.runtimeModuleSpecifier }),
  });
}

function createStylesheetDigest(source: string): string {
  let hash = 2166136261;

  for (let index = 0; index < source.length; index += 1) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}