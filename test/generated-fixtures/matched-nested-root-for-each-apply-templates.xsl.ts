import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathNode, selectSimplePathNodes, selectSimplePathNodesByStepPlan, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "matched-nested-root-for-each-apply-templates.xsl", digest: "5987f7cb" } as const;

/** match="/root/section" (matched-nested-root-for-each-apply-templates.xsl:1) */
export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  if (ctx.initialMode !== undefined) {
    throwUnsupportedNativeInitialMode(ctx.initialMode);
  }
  if (ctx.initialTemplate !== undefined) {
    throwMissingNativeInitialTemplate(ctx.initialTemplate, []);
  }
  void ctx;
  const document = createCompiledDocument(sourceXml);
  const currentNode = selectSimplePathNode(document, ["root","section"]);
  if (currentNode === null) {
    return { output: "" };
  }
  return {
    output:
      (
  /** literal items (matched-nested-root-for-each-apply-templates.xsl:1) */
  "<items>" +
    (
  /** xsl:for-each (matched-nested-root-for-each-apply-templates.xsl:1) */
  selectSimplePathNodes(currentNode, ["item"]).map((currentNode) => (
  /** literal item (matched-nested-root-for-each-apply-templates.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (matched-nested-root-for-each-apply-templates.xsl:1) */
  escapeText(selectSimplePathText(currentNode, ["name"]))
) +
    (
  /** literal details (matched-nested-root-for-each-apply-templates.xsl:1) */
  "<details>" +
    (
  /** xsl:apply-templates (matched-nested-root-for-each-apply-templates.xsl:1) */
  selectSimplePathNodesByStepPlan(currentNode, [{"name":"detail"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="detail" (matched-nested-root-for-each-apply-templates.xsl:1) */
  (
  /** literal detail (matched-nested-root-for-each-apply-templates.xsl:1) */
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
//# sourceMappingURL=matched-nested-root-for-each-apply-templates.xsl.map
