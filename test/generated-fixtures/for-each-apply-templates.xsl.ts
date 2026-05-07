import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathNodes, selectSimplePathNodesByStepPlan, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "for-each-apply-templates.xsl", digest: "48d2d6c1" } as const;

/** match="/" (for-each-apply-templates.xsl:1) */
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
  /** literal items (for-each-apply-templates.xsl:1) */
  "<items>" +
    (
  /** xsl:for-each (for-each-apply-templates.xsl:1) */
  selectSimplePathNodes(document, ["root","item"]).map((currentNode) => (
  /** literal item (for-each-apply-templates.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (for-each-apply-templates.xsl:1) */
  escapeText(selectSimplePathText(currentNode, ["name"]))
) +
    (
  /** literal details (for-each-apply-templates.xsl:1) */
  "<details>" +
    (
  /** xsl:apply-templates (for-each-apply-templates.xsl:1) */
  selectSimplePathNodesByStepPlan(currentNode, [{"name":"detail"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="detail" (for-each-apply-templates.xsl:1) */
  (
  /** literal detail (for-each-apply-templates.xsl:1) */
  "<detail>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</detail>"
)
)).join("")
) +
    "</details>"
) +
    "</item>"
)).join("")
) +
    "</items>"
),
  };
}

export default { source, transform };
//# sourceMappingURL=for-each-apply-templates.xsl.map
