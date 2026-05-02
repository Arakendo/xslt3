import { createCompiledDocument, escapeText, selectDescendantElementsByName, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-default.xsl", digest: "ebe9616d" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  void ctx;
  const document = createCompiledDocument(sourceXml);
  return {
    output:
      "<items>" +
    selectDescendantElementsByName(document, "item").map((templateNode) => "<item>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</item>").join("") +
    "</items>",
  };
}

export default { source, transform };