import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, selectSimplePathNode, selectSimplePathNodes, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "matched-nested-root-for-each-apply-templates-default.xsl", digest: "3e086e77" } as const;

/** match="/root/section" (matched-nested-root-for-each-apply-templates-default.xsl:1) */
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
  /** literal items (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  "<items>" +
    (
  /** xsl:for-each (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  selectSimplePathNodes(currentNode, ["item"]).map((currentNode) => (
  /** literal item (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  escapeText(selectSimplePathText(currentNode, ["name"]))
) +
    (
  /** literal details (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  "<details>" +
    (
  /** xsl:apply-templates (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  applyBuiltInTemplatesByPath(currentNode, ["detail"], (templateNode, templateIndex, templateNodes) => (
  /** match="detail" (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  (
  /** literal detail (matched-nested-root-for-each-apply-templates-default.xsl:1) */
  "<detail>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</detail>"
)
))
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
//# sourceMappingURL=matched-nested-root-for-each-apply-templates-default.xsl.map
