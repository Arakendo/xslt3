import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, selectSimplePathText } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-absolute-nested-match-default.xsl", digest: "5aa74aa6" } as const;

/** match="/" (apply-templates-absolute-nested-match-default.xsl:1) */
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
  /** literal items (apply-templates-absolute-nested-match-default.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-absolute-nested-match-default.xsl:1) */
  applyBuiltInTemplatesByPath(document, ["root","section","item"], (templateNode, templateIndex, templateNodes) => (
  /** match="/root/section/item" (apply-templates-absolute-nested-match-default.xsl:1) */
  (
  /** literal item (apply-templates-absolute-nested-match-default.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-absolute-nested-match-default.xsl:1) */
  escapeText(selectSimplePathText(templateNode, ["name"]))
) +
    "</item>"
)
), true)
) +
    "</items>"
),
  };
}

export default { source, transform };
//# sourceMappingURL=apply-templates-absolute-nested-match-default.xsl.map
