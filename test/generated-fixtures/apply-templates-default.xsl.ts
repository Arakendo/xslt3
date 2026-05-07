import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-default.xsl", digest: "ebe9616d" } as const;

/** match="/" (apply-templates-default.xsl:1) */
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
  /** literal items (apply-templates-default.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-default.xsl:1) */
  applyBuiltInTemplatesByPath(document, ["item"], (templateNode, templateIndex, templateNodes) => (
  /** match="item" (apply-templates-default.xsl:1) */
  (
  /** literal item (apply-templates-default.xsl:1) */
  "<item>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</item>"
)
))
) +
    "</items>"
),
  };
}

export default { source, transform };
//# sourceMappingURL=apply-templates-default.xsl.map
