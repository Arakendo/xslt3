import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathNodesByStepPlan, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-dot.xsl", digest: "d69dbbc5" } as const;

/** match="/" (apply-templates-dot.xsl:1) */
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
  /** literal items (apply-templates-dot.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-dot.xsl:1) */
  selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"item"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="item" (apply-templates-dot.xsl:1) */
  (
  /** literal item (apply-templates-dot.xsl:1) */
  "<item>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</item>"
)
)).join("")
) +
    "</items>"
),
  };
}

export default { source, transform };
//# sourceMappingURL=apply-templates-dot.xsl.map
