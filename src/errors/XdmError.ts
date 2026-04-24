import type { ErrorCode } from './codes.js';

/** Optional source location for an error (stylesheet or XPath expression). */
export interface SourceLocation {
  /** e.g. 'stylesheet.xsl' or '<xpath>'. */
  source?: string;
  /** 1-based line number. */
  line?: number;
  /** 1-based column number. */
  column?: number;
  /** Character offset into the source. */
  offset?: number;
}

/**
 * Base class for all engine errors. Every thrown error carries a W3C code
 * so downstream tools can distinguish them.
 */
export class XdmError extends Error {
  readonly code: ErrorCode;
  readonly location?: SourceLocation;

  constructor(code: ErrorCode, message: string, location?: SourceLocation) {
    super(`[${code}] ${message}`);
    this.name = 'XdmError';
    this.code = code;
    if (location !== undefined) {
      this.location = location;
    }
  }
}
