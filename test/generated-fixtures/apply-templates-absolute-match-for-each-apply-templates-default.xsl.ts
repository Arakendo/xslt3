import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, selectSimplePathNodes, selectSimplePathNodesByStepPlan, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-absolute-match-for-each-apply-templates-default.xsl", digest: "d9a09793" } as const;

/** match="/" (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
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
  /** literal items (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"item"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="/root/item" (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  (
  /** literal item (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  escapeText(selectSimplePathText(templateNode, ["name"]))
) +
    (
  /** literal details (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  "<details>" +
    (
  /** xsl:for-each (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  selectSimplePathNodes(templateNode, ["group"]).map((currentNode) => (
  /** xsl:apply-templates (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  applyBuiltInTemplatesByPath(currentNode, ["detail"], (templateNode, templateIndex, templateNodes) => (
  /** match="detail" (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  (
  /** literal detail (apply-templates-absolute-match-for-each-apply-templates-default.xsl:1) */
  "<detail>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</detail>"
)
))
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
//# sourceMappingURL=apply-templates-absolute-match-for-each-apply-templates-default.xsl.map
