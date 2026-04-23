/**
 * @arakendo/xslt — a TypeScript XSLT 3.0 engine (codename: Weaver).
 *
 * Public entry point. As submodules are implemented they should be re-exported here.
 */

export { XsltProcessor } from './processor/XsltProcessor.js';
export type { TransformOptions, TransformResult } from './processor/types.js';
export { VERSION } from './version.js';
