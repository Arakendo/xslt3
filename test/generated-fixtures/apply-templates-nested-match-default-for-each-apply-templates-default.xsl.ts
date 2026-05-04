import { applyBuiltInTemplatesByPath, createCompiledDocument, escapeText, selectSimplePathNodes, selectSimplePathText, stringValueOfNode } from "@arakendo/weaver-xslt/runtime";
import type { TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

export const source = { path: "apply-templates-nested-match-default-for-each-apply-templates-default.xsl", digest: "c10c366d" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  void ctx;
  const document = createCompiledDocument(sourceXml);
  return {
    output:
      "<items>" +
    applyBuiltInTemplatesByPath(document, ["section","item"], (templateNode) => "<item>" +
    escapeText(selectSimplePathText(templateNode, ["name"])) +
    "<details>" +
    selectSimplePathNodes(templateNode, ["group"]).map((currentNode) => applyBuiltInTemplatesByPath(currentNode, ["detail"], (templateNode) => "<detail>" +
    escapeText(stringValueOfNode(templateNode)) +
    "</detail>")).join("") +
    "</details>" +
    "</item>") +
    "</items>",
  };
}

export default { source, transform };
