import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, getRecordedTracePause, resetRecordedTracePause, traceFocusEnter, traceTemplateEnter, applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, traceSelectedNodes, traceStringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-default.xsl", digest: "ebe9616d" } as const;

/** match="/" (apply-templates-default.xsl:1) */
export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  resetRecordedTracePause(ctx.trace);
  if (ctx.initialMode !== undefined) {
    throwUnsupportedNativeInitialMode(ctx.initialMode);
  }
  if (ctx.initialTemplate !== undefined) {
    throwMissingNativeInitialTemplate(ctx.initialTemplate, []);
  }
  void ctx;
  const document = createCompiledDocument(sourceXml);
  traceFocusEnter(document, ctx);
  traceTemplateEnter(document, ctx, {"match":"/","location":{"source":"apply-templates-default.xsl","line":1,"column":101,"offset":100,"endLine":1,"endColumn":102,"endOffset":101}});
  return {
    output:
      (
  /** literal items (apply-templates-default.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-default.xsl:1) */
  applyBuiltInTemplatesByPath(document, ["item"], (templateNode, templateIndex, templateNodes) => (
  /** match="item" (apply-templates-default.xsl:1) */
  (() => {
  traceFocusEnter(templateNode, ctx);
  traceTemplateEnter(templateNode, ctx, {"match":"item","location":{"source":"apply-templates-default.xsl","line":1,"column":101,"offset":100,"endLine":1,"endColumn":102,"endOffset":101}});
  return (
  /** literal item (apply-templates-default.xsl:1) */
  "<item>" +
    escapeText(traceStringValueOfNode(templateNode, ctx, {"kind":"xsl:value-of","location":{"source":"apply-templates-default.xsl","line":1,"column":211,"offset":210,"endLine":1,"endColumn":212,"endOffset":211}})) +
    "</item>"
);
})()
), false, ctx, {"kind":"xsl:apply-templates","location":{"source":"apply-templates-default.xsl","line":1,"column":111,"offset":110,"endLine":1,"endColumn":112,"endOffset":111}})
) +
    "</items>"
),
    ...(getRecordedTracePause(ctx.trace) === undefined ? {} : { pause: getRecordedTracePause(ctx.trace) }),
  };
}

export default { source, transform };
//# sourceMappingURL=apply-templates-default.xsl.map
