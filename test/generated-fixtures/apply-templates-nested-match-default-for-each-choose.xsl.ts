import { applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, selectSimplePathExists, selectSimplePathNodes, selectSimplePathText } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-nested-match-default-for-each-choose.xsl", digest: "78a8f2f8" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  void ctx;
  const document = createCompiledDocument(sourceXml);
  return {
    output:
      "<items>" +
    applyBuiltInTemplatesByPath(document, ["section","item"], (templateNode) => "<item>" +
    escapeText(selectSimplePathText(templateNode, ["name"])) +
    "<details>" +
    selectSimplePathNodes(templateNode, ["detail"]).map((currentNode) => (selectSimplePathExists(currentNode, ["flag"]) ? "<flagged>" +
    "</flagged>" : "<plain>" +
    "</plain>")).join("") +
    "</details>" +
    "</item>") +
    "</items>",
  };
}

export default { source, transform };