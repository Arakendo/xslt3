import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, selectSimplePathNode, selectSimplePathNodes, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "matched-root-for-each-apply-templates-default.xsl", digest: "aa228273" } as const;

/** match="/root" (matched-root-for-each-apply-templates-default.xsl:1) */
export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  if (ctx.initialMode !== undefined) {
    throwUnsupportedNativeInitialMode(ctx.initialMode);
  }
  if (ctx.initialTemplate !== undefined) {
    throwMissingNativeInitialTemplate(ctx.initialTemplate, []);
  }
  void ctx;
  const document = createCompiledDocument(sourceXml);
  const currentNode = selectSimplePathNode(document, ["root"]);
  if (currentNode === null) {
    return { output: "" };
  }
  return {
    output:
      (
  /** literal items (matched-root-for-each-apply-templates-default.xsl:1) */
  "<items>" +
    (
  /** xsl:for-each (matched-root-for-each-apply-templates-default.xsl:1) */
  selectSimplePathNodes(currentNode, ["item"]).map((currentNode) => (
  /** literal item (matched-root-for-each-apply-templates-default.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (matched-root-for-each-apply-templates-default.xsl:1) */
  escapeText(selectSimplePathText(currentNode, ["name"]))
) +
    (
  /** literal details (matched-root-for-each-apply-templates-default.xsl:1) */
  "<details>" +
    (
  /** xsl:apply-templates (matched-root-for-each-apply-templates-default.xsl:1) */
  applyBuiltInTemplatesByPath(currentNode, ["detail"], (templateNode, templateIndex, templateNodes) => (
  /** match="detail" (matched-root-for-each-apply-templates-default.xsl:1) */
  (
  /** literal detail (matched-root-for-each-apply-templates-default.xsl:1) */
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
//# sourceMappingURL=matched-root-for-each-apply-templates-default.xsl.map
