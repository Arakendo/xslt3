import { XdmError, type SourceLocation } from './XdmError.js';
import type { ErrorCode } from './codes.js';

/** Errors raised by the XSLT compiler or transform evaluator. */
export class XsltError extends XdmError {
  constructor(code: ErrorCode, message: string, location?: SourceLocation) {
    super(code, message, location);
    this.name = 'XsltError';
  }
}
