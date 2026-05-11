import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, getRecordedTracePause, resetRecordedTracePause, traceFocusEnter, traceTemplateEnter, createCompiledDocument, escapeText, selectSimplePathNode, selectSimplePathNodes, selectSimplePathNodesByStepPlan, traceSelectedNodes, traceStringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-absolute-match-for-each.xsl", digest: "7263256d" } as const;

/** match="/" (apply-templates-absolute-match-for-each.xsl:1) */
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
  traceTemplateEnter(document, ctx, {"match":"/","location":{"source":"apply-templates-absolute-match-for-each.xsl","line":1,"column":101,"offset":100,"endLine":1,"endColumn":102,"endOffset":101}});
  return {
    output:
      (
  /** literal items (apply-templates-absolute-match-for-each.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-absolute-match-for-each.xsl:1) */
  traceSelectedNodes(selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"item"}]), ctx, {"kind":"xsl:apply-templates","location":{"source":"apply-templates-absolute-match-for-each.xsl","line":1,"column":140,"offset":139,"endLine":1,"endColumn":150,"endOffset":149}}).map((templateNode, templateIndex, templateNodes) => (
  /** match="/root/item" (apply-templates-absolute-match-for-each.xsl:1) */
  (() => {
  traceFocusEnter(templateNode, ctx);
  traceTemplateEnter(templateNode, ctx, {"match":"/root/item","location":{"source":"apply-templates-absolute-match-for-each.xsl","line":1,"column":101,"offset":100,"endLine":1,"endColumn":102,"endOffset":101}});
  return (
  /** literal item (apply-templates-absolute-match-for-each.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-absolute-match-for-each.xsl:1) */
  escapeText(traceStringValueOfNode(selectSimplePathNode(templateNode, ["name"]), ctx, {"kind":"xsl:value-of","location":{"source":"apply-templates-absolute-match-for-each.xsl","line":1,"column":140,"offset":139,"endLine":1,"endColumn":150,"endOffset":149}}))
) +
    (
  /** literal details (apply-templates-absolute-match-for-each.xsl:1) */
  "<details>" +
    (
  /** xsl:for-each (apply-templates-absolute-match-for-each.xsl:1) */
  traceSelectedNodes(selectSimplePathNodes(templateNode, ["detail"]), ctx, {"kind":"xsl:for-each","location":{"source":"apply-templates-absolute-match-for-each.xsl","line":1,"column":140,"offset":139,"endLine":1,"endColumn":150,"endOffset":149}}).map((currentNode) => (
  /** literal detail (apply-templates-absolute-match-for-each.xsl:1) */
  "<detail>" +
    escapeText(traceStringValueOfNode(currentNode, ctx, {"kind":"xsl:value-of","location":{"source":"apply-templates-absolute-match-for-each.xsl","line":1,"column":140,"offset":139,"endLine":1,"endColumn":150,"endOffset":149}})) +
    "</detail>"
)).join("")
) +
    "</details>"
) +
    "</item>"
);
})()
)).join("")
) +
    "</items>"
),
    ...(getRecordedTracePause(ctx.trace) === undefined ? {} : { pause: getRecordedTracePause(ctx.trace) }),
  };
}

export default { source, transform };
//# sourceMappingURL=apply-templates-absolute-match-for-each.xsl.map
