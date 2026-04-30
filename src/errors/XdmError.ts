import type { ErrorCode } from './codes.js';

export type ErrorDetailValue = string | number | boolean;

export type ErrorDetails = Readonly<Record<string, ErrorDetailValue>>;

export interface RelatedLocation {
  readonly label: string;
  readonly location: SourceLocation;
}

export interface ErrorFrame {
  readonly kind: 'template' | 'instruction' | 'xpath' | 'function' | 'mode';
  readonly label: string;
  readonly location?: SourceLocation;
}

export interface ErrorSuggestion {
  readonly kind: 'fix' | 'hint' | 'alternative';
  readonly label: string;
  readonly replacement?: string;
  readonly confidence?: number;
}

export interface ErrorContext {
  readonly related?: readonly RelatedLocation[];
  readonly frames?: readonly ErrorFrame[];
  readonly suggestions?: readonly ErrorSuggestion[];
  readonly causes?: readonly unknown[];
}

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
  /** 1-based end line number. */
  endLine?: number;
  /** 1-based end column number. */
  endColumn?: number;
  /** Character offset for the end of the span. */
  endOffset?: number;
}

/**
 * Base class for all engine errors. Every thrown error carries a W3C code
 * so downstream tools can distinguish them.
 */
export class XdmError extends Error {
  readonly code: ErrorCode;
  readonly detailMessage: string;
  readonly location?: SourceLocation;
  readonly details?: ErrorDetails;
  readonly related: readonly RelatedLocation[];
  readonly frames: readonly ErrorFrame[];
  readonly suggestions: readonly ErrorSuggestion[];
  readonly causes: readonly unknown[];

  constructor(code: ErrorCode, message: string, location?: SourceLocation, details?: ErrorDetails, context: ErrorContext = {}) {
    super(`[${code}] ${message}`);
    this.name = 'XdmError';
    this.code = code;
    this.detailMessage = message;
    if (location !== undefined) {
      this.location = location;
    }
    if (details !== undefined) {
      this.details = details;
    }
    this.related = context.related ?? [];
    this.frames = context.frames ?? [];
    this.suggestions = context.suggestions ?? [];
    this.causes = context.causes ?? [];
  }
}
