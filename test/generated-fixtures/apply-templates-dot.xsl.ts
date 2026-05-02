import { createCompiledDocument, escapeText, selectSimplePathNodes, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-dot.xsl", digest: "d69dbbc5" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  void ctx;
  const document = createCompiledDocument(sourceXml);
  return {
    output:
      "<items>" +
    selectSimplePathNodes(document, ["root","item"]).map((templateNode) => "<item>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</item>").join("") +
    "</items>",
  };
}

export default { source, transform };