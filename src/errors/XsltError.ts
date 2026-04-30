import { XdmError, type ErrorContext, type ErrorDetails, type SourceLocation } from './XdmError.js';
import type { ErrorCode } from './codes.js';

/** Errors raised by the XSLT compiler or transform evaluator. */
export class XsltError extends XdmError {
  constructor(code: ErrorCode, message: string, location?: SourceLocation, details?: ErrorDetails, context?: ErrorContext) {
    super(code, message, location, details, context);
    this.name = 'XsltError';
  }
}
