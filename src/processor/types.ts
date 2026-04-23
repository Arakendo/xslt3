/**
 * Options accepted by {@link XsltProcessor.transform}.
 */
export interface TransformOptions {
  /** Initial template name (xsl:call-template equivalent). */
  initialTemplate?: string;
  /** Initial mode for apply-templates. */
  initialMode?: string;
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
}
