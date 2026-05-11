import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, getRecordedTracePause, resetRecordedTracePause, traceFocusEnter, traceTemplateEnter, createCompiledDocument, selectSimplePathText } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "conditional.xsl", digest: "8ff84c60" } as const;

/** match="/" (conditional.xsl:1) */
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
  traceFocusEnter(document, ctx);
  traceTemplateEnter(document, ctx, {"match":"/","location":{"source":"conditional.xsl","line":1,"column":101,"offset":100,"endLine":1,"endColumn":102,"endOffset":101}});
  return {
    output:
      (
  /** literal out (conditional.xsl:1) */
  "<out>" +
    (
  /** xsl:if (conditional.xsl:1) */
  ((selectSimplePathText(document, ["root","name"]) === "world") ? (
  /** literal yes (conditional.xsl:1) */
  "<yes>" +
    "</yes>"
) : "")
) +
    (
  /** xsl:choose (conditional.xsl:1) */
  ((selectSimplePathText(document, ["root","role"]) === "admin") ? (
  /** xsl:when (conditional.xsl:1) */
  (
  /** literal role (conditional.xsl:1) */
  "<role>" +
    "admin" +
    "</role>"
)
) : (
  /** xsl:otherwise (conditional.xsl:1) */
  (
  /** literal role (conditional.xsl:1) */
  "<role>" +
    "user" +
    "</role>"
)
))
) +
    "</out>"
),
    ...(getRecordedTracePause(ctx.trace) === undefined ? {} : { pause: getRecordedTracePause(ctx.trace) }),
  };
}

export default { source, transform };
//# sourceMappingURL=conditional.xsl.map
