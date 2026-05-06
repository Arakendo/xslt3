/**
 * Options accepted by {@link XsltProcessor.transform}.
 */
export type TransformExecutionMode = 'interpreter' | 'native' | 'auto';

export type TransformExecutionFallbackReasonCode = 'unsupported_stylesheet' | 'native_runtime_unavailable';

export interface TransformExecutionFallbackReason {
  /** Stable machine-readable reason for leaving the native path. */
  code: TransformExecutionFallbackReasonCode;
  /** Human-readable explanation of why native execution was not used. */
  message: string;
}

export interface TransformExecutionInfo {
  /** Requested execution strategy. */
  requested: TransformExecutionMode;
  /** Strategy actually used for the transform. */
  resolved: 'interpreter' | 'native';
  /** Present when the requested strategy could not stay on native execution. */
  fallbackReason?: TransformExecutionFallbackReason;
}

export interface TransformOptions {
  /** Initial template name (xsl:call-template equivalent). */
  initialTemplate?: string;
  /** Initial mode for apply-templates. */
  initialMode?: string;
  /** Requested execution strategy for the transform. */
  execution?: TransformExecutionMode;
  /** Stylesheet parameters (top-level xsl:param values). */
  parameters?: Readonly<Record<string, unknown>>;
  /** Base URI used to resolve document() / doc() calls. */
  baseUri?: string;
}

/**
 * Result of a transformation.
 */
export interface TransformResult {
  /** Serialized primary result document. */
  output: string;
  /** Secondary result documents keyed by their href (xsl:result-document). */
  secondaryOutputs?: Readonly<Record<string, string>>;
  /** Execution strategy information when an explicit strategy was requested. */
  execution?: TransformExecutionInfo;
}
