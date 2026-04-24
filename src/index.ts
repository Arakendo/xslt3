/**
 * @arakendo/xslt — a TypeScript XSLT 3.0 engine (codename: Weaver).
 *
 * Public entry point. Keep this surface tiny and stable.
 * Internal modules should not be imported by consumers.
 */

export { XsltProcessor } from './processor/XsltProcessor.js';
export type { TransformOptions, TransformResult } from './processor/types.js';
export { XdmError, XPathError, XsltError, type SourceLocation } from './errors/index.js';
export { VERSION } from './version.js';
