import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathNodes, selectSimplePathNodesByStepPlan, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-relative-nested-match-for-each.xsl", digest: "160983a2" } as const;

/** match="/" (apply-templates-relative-nested-match-for-each.xsl:1) */
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
  /** literal items (apply-templates-relative-nested-match-for-each.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-relative-nested-match-for-each.xsl:1) */
  selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"section"},{"name":"item"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="section/item" (apply-templates-relative-nested-match-for-each.xsl:1) */
  (
  /** literal item (apply-templates-relative-nested-match-for-each.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-relative-nested-match-for-each.xsl:1) */
  escapeText(selectSimplePathText(templateNode, ["name"]))
) +
    (
  /** literal details (apply-templates-relative-nested-match-for-each.xsl:1) */
  "<details>" +
    (
  /** xsl:for-each (apply-templates-relative-nested-match-for-each.xsl:1) */
  selectSimplePathNodes(templateNode, ["detail"]).map((currentNode) => (
  /** literal detail (apply-templates-relative-nested-match-for-each.xsl:1) */
  "<detail>" +
    escapeText(stringValueOfNode(currentNode)) +
    "</detail>"
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
//# sourceMappingURL=apply-templates-relative-nested-match-for-each.xsl.map
