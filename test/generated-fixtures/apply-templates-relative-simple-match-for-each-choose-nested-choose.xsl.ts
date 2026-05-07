import { throwMissingNativeInitialTemplate, throwUnsupportedNativeInitialMode, createCompiledDocument, escapeText, selectSimplePathExists, selectSimplePathNodes, selectSimplePathNodesByStepPlan, selectSimplePathText } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl", digest: "ebc20ba5" } as const;

/** match="/" (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
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
  /** literal items (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<items>" +
    (
  /** xsl:apply-templates (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  selectSimplePathNodesByStepPlan(document, [{"name":"root"},{"name":"section"},{"name":"item"}]).map((templateNode, templateIndex, templateNodes) => (
  /** match="item" (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** literal item (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<item>" +
    (
  /** xsl:value-of (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  escapeText(selectSimplePathText(templateNode, ["name"]))
) +
    (
  /** literal details (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<details>" +
    (
  /** xsl:for-each (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  selectSimplePathNodes(templateNode, ["detail"]).map((currentNode) => (
  /** xsl:choose (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (selectSimplePathExists(currentNode, ["flag"]) ? (
  /** xsl:when (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** xsl:choose (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (selectSimplePathExists(currentNode, ["marker"]) ? (
  /** xsl:when (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** literal flagged (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<flagged>" +
    "</flagged>"
)
) : (
  /** xsl:otherwise (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** literal brief (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<brief>" +
    "</brief>"
)
))
)
) : (
  /** xsl:otherwise (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** xsl:choose (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (selectSimplePathExists(currentNode, ["vip"]) ? (
  /** xsl:when (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** literal vip (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<vip>" +
    "</vip>"
)
) : (
  /** xsl:otherwise (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  (
  /** literal plain (apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl:1) */
  "<plain>" +
    "</plain>"
)
))
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
//# sourceMappingURL=apply-templates-relative-simple-match-for-each-choose-nested-choose.xsl.map
