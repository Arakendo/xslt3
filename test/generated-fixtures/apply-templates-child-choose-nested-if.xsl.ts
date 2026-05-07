import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathExists, selectSimplePathNodesByStepPlan, selectSimplePathText } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-child-choose-nested-if.xsl", digest: "53eafda3" } as const;

/** match="/" (apply-templates-child-choose-nested-if.xsl:1) */
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
  /** literal items (apply-templates-child-choose-nested-if.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-child-choose-nested-if.xsl:1) */
  selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"item"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="item" (apply-templates-child-choose-nested-if.xsl:1) */
  (
  /** literal item (apply-templates-child-choose-nested-if.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-child-choose-nested-if.xsl:1) */
  escapeText(selectSimplePathText(templateNode, ["name"]))
) +
    (
  /** xsl:choose (apply-templates-child-choose-nested-if.xsl:1) */
  (selectSimplePathExists(templateNode, ["flag"]) ? (
  /** xsl:when (apply-templates-child-choose-nested-if.xsl:1) */
  (
  /** xsl:if (apply-templates-child-choose-nested-if.xsl:1) */
  (selectSimplePathExists(templateNode, ["detail"]) ? (
  /** literal flagged (apply-templates-child-choose-nested-if.xsl:1) */
  "<flagged>" +
    "</flagged>"
) : "")
)
) : (
  /** xsl:otherwise (apply-templates-child-choose-nested-if.xsl:1) */
  (
  /** xsl:if (apply-templates-child-choose-nested-if.xsl:1) */
  (selectSimplePathExists(templateNode, ["vip"]) ? (
  /** literal vip (apply-templates-child-choose-nested-if.xsl:1) */
  "<vip>" +
    "</vip>"
) : "")
)
))
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
//# sourceMappingURL=apply-templates-child-choose-nested-if.xsl.map
