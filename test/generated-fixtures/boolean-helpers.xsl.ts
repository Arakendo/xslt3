import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, getRecordedTracePause, resetRecordedTracePause, traceFocusEnter, traceTemplateEnter, createCompiledDocument, selectSimplePathExists } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "boolean-helpers.xsl", digest: "1b5a2d3c" } as const;

/** match="/" (boolean-helpers.xsl:3) */
export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  resetRecordedTracePause(ctx.trace);
  if (ctx.initialMode !== undefined) {
    throwUnsupportedNativeInitialMode(ctx.initialMode);
  }
  if (ctx.initialTemplate !== undefined) {
    throwMissingNativeInitialTemplate(ctx.initialTemplate, []);
  }
  void ctx;
  const document = createCompiledDocument(sourceXml);
  const currentNode = document;
  traceFocusEnter(currentNode, ctx);
  traceTemplateEnter(currentNode, ctx, {"match":"/","location":{"source":"boolean-helpers.xsl","line":3,"column":30,"offset":116,"endLine":3,"endColumn":31,"endOffset":117}});
  return {
    output:
      (
  /** literal out (boolean-helpers.xsl:4) */
  "<out>" +
    (
  /** xsl:if (boolean-helpers.xsl:5) */
  ((!selectSimplePathExists(currentNode, ["root","flag"])) ? (
  /** literal missing (boolean-helpers.xsl:5) */
  "<missing>" +
    "</missing>"
) : "")
) +
    (
  /** xsl:if (boolean-helpers.xsl:6) */
  (true ? (
  /** literal always (boolean-helpers.xsl:6) */
  "<always>" +
    "</always>"
) : "")
) +
    (
  /** xsl:if (boolean-helpers.xsl:7) */
  (false ? (
  /** literal never (boolean-helpers.xsl:7) */
  "<never>" +
    "</never>"
) : "")
) +
    "</out>"
),
    ...(getRecordedTracePause(ctx.trace) === undefined ? {} : { pause: getRecordedTracePause(ctx.trace) }),
  };
}

export default { source, transform };
//# sourceMappingURL=boolean-helpers.xsl.map
