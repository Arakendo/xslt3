import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathNodesByStepPlan, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-child-apply-templates.xsl", digest: "11cb4962" } as const;

/** match="/" (apply-templates-child-apply-templates.xsl:1) */
export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  if (ctx.initialMode !== undefined) {
    throwUnsupportedNativeInitialMode(ctx.initialMode);
  }
  if (ctx.initialTemplate !== undefined) {
    throwMissingNativeInitialTemplate(ctx.initialTemplate, []);
  }
  void ctx;
  const document = createCompiledDocument(sourceXml);
  return {
    output:
      (
  /** literal items (apply-templates-child-apply-templates.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-child-apply-templates.xsl:1) */
  selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"item"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="item" (apply-templates-child-apply-templates.xsl:1) */
  (
  /** literal item (apply-templates-child-apply-templates.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-child-apply-templates.xsl:1) */
  escapeText(selectSimplePathText(templateNode, ["name"]))
) +
    (
  /** literal details (apply-templates-child-apply-templates.xsl:1) */
  "<details>" +
    (
  /** xsl:apply-templates (apply-templates-child-apply-templates.xsl:1) */
  selectSimplePathNodesByStepPlan(templateNode, [{"name":"detail"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="detail" (apply-templates-child-apply-templates.xsl:1) */
  (
  /** literal detail (apply-templates-child-apply-templates.xsl:1) */
  "<detail>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</detail>"
)
)).join("")
) +
    "</details>"
) +
    "</item>"
)
)).join("")
) +
    "</items>"
),
  };
}

export default { source, transform };
//# sourceMappingURL=apply-templates-child-apply-templates.xsl.map
