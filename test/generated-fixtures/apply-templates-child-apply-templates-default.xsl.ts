import { transformCompiledStylesheet } from "@arakendo/weaver-xslt/runtime";
import type { StylesheetIR, TransformContext, TransformResult } from "@arakendo/weaver-xslt/runtime";

const stylesheet = {
  "version": "1.0",
  "xsltVersion": "3.0",
  "location": {
    "source": "<stylesheet>",
    "line": 1,
    "column": 1,
    "offset": 0,
    "endLine": 1,
    "endColumn": 2,
    "endOffset": 1
  },
  "namespaces": {
    "xsl": "http://www.w3.org/1999/XSL/Transform"
  },
  "defaultElementNamespace": "",
  "globalBindings": [],
  "templates": [
    {
      "match": {
        "kind": "path",
        "absolute": true,
        "steps": [],
        "span": {
          "start": 0,
          "end": 1,
          "line": 1,
          "column": 1,
          "endLine": 1,
          "endColumn": 2
        }
      },
      "matchText": "/",
      "location": {
        "source": "<stylesheet>",
        "line": 1,
        "column": 101,
        "offset": 100,
        "endLine": 1,
        "endColumn": 102,
        "endOffset": 101
      },
      "modes": [],
      "params": [],
      "body": [
        {
          "kind": "literalElement",
          "name": "items",
          "attributes": [],
          "body": [
            {
              "kind": "applyTemplates",
              "withParams": [],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 140,
                "offset": 139,
                "endLine": 1,
                "endColumn": 150,
                "endOffset": 149
              },
              "selectText": "/root/item",
              "select": {
                "kind": "path",
                "absolute": true,
                "steps": [
                  {
                    "kind": "step",
                    "axis": "child",
                    "nodeTest": {
                      "kind": "nameTest",
                      "name": "root",
                      "span": {
                        "start": 1,
                        "end": 5,
                        "line": 1,
                        "column": 2,
                        "endLine": 1,
                        "endColumn": 6
                      }
                    },
                    "predicates": [],
                    "span": {
                      "start": 1,
                      "end": 5,
                      "line": 1,
                      "column": 2,
                      "endLine": 1,
                      "endColumn": 6
                    }
                  },
                  {
                    "kind": "step",
                    "axis": "child",
                    "nodeTest": {
                      "kind": "nameTest",
                      "name": "item",
                      "span": {
                        "start": 6,
                        "end": 10,
                        "line": 1,
                        "column": 7,
                        "endLine": 1,
                        "endColumn": 11
                      }
                    },
                    "predicates": [],
                    "span": {
                      "start": 6,
                      "end": 10,
                      "line": 1,
                      "column": 7,
                      "endLine": 1,
                      "endColumn": 11
                    }
                  }
                ],
                "span": {
                  "start": 0,
                  "end": 10,
                  "line": 1,
                  "column": 1,
                  "endLine": 1,
                  "endColumn": 11
                }
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 104,
            "offset": 103,
            "endLine": 1,
            "endColumn": 105,
            "endOffset": 104
          }
        }
      ]
    },
    {
      "match": {
        "kind": "path",
        "absolute": false,
        "steps": [
          {
            "kind": "step",
            "axis": "child",
            "nodeTest": {
              "kind": "nameTest",
              "name": "item",
              "span": {
                "start": 0,
                "end": 4,
                "line": 1,
                "column": 1,
                "endLine": 1,
                "endColumn": 5
              }
            },
            "predicates": [],
            "span": {
              "start": 0,
              "end": 4,
              "line": 1,
              "column": 1,
              "endLine": 1,
              "endColumn": 5
            }
          }
        ],
        "span": {
          "start": 0,
          "end": 4,
          "line": 1,
          "column": 1,
          "endLine": 1,
          "endColumn": 5
        }
      },
      "matchText": "item",
      "location": {
        "source": "<stylesheet>",
        "line": 1,
        "column": 101,
        "offset": 100,
        "endLine": 1,
        "endColumn": 102,
        "endOffset": 101
      },
      "modes": [],
      "params": [],
      "body": [
        {
          "kind": "literalElement",
          "name": "item",
          "attributes": [],
          "body": [
            {
              "kind": "valueOf",
              "select": {
                "kind": "path",
                "absolute": false,
                "steps": [
                  {
                    "kind": "step",
                    "axis": "child",
                    "nodeTest": {
                      "kind": "nameTest",
                      "name": "name",
                      "span": {
                        "start": 0,
                        "end": 4,
                        "line": 1,
                        "column": 1,
                        "endLine": 1,
                        "endColumn": 5
                      }
                    },
                    "predicates": [],
                    "span": {
                      "start": 0,
                      "end": 4,
                      "line": 1,
                      "column": 1,
                      "endLine": 1,
                      "endColumn": 5
                    }
                  }
                ],
                "span": {
                  "start": 0,
                  "end": 4,
                  "line": 1,
                  "column": 1,
                  "endLine": 1,
                  "endColumn": 5
                }
              },
              "selectText": "name",
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 140,
                "offset": 139,
                "endLine": 1,
                "endColumn": 150,
                "endOffset": 149
              }
            },
            {
              "kind": "literalElement",
              "name": "details",
              "attributes": [],
              "body": [
                {
                  "kind": "applyTemplates",
                  "withParams": [],
                  "location": {
                    "source": "<stylesheet>",
                    "line": 1,
                    "column": 247,
                    "offset": 246,
                    "endLine": 1,
                    "endColumn": 248,
                    "endOffset": 247
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 238,
                "offset": 237,
                "endLine": 1,
                "endColumn": 239,
                "endOffset": 238
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 203,
            "offset": 202,
            "endLine": 1,
            "endColumn": 204,
            "endOffset": 203
          }
        }
      ]
    },
    {
      "match": {
        "kind": "path",
        "absolute": false,
        "steps": [
          {
            "kind": "step",
            "axis": "child",
            "nodeTest": {
              "kind": "nameTest",
              "name": "detail",
              "span": {
                "start": 0,
                "end": 6,
                "line": 1,
                "column": 1,
                "endLine": 1,
                "endColumn": 7
              }
            },
            "predicates": [],
            "span": {
              "start": 0,
              "end": 6,
              "line": 1,
              "column": 1,
              "endLine": 1,
              "endColumn": 7
            }
          }
        ],
        "span": {
          "start": 0,
          "end": 6,
          "line": 1,
          "column": 1,
          "endLine": 1,
          "endColumn": 7
        }
      },
      "matchText": "detail",
      "location": {
        "source": "<stylesheet>",
        "line": 1,
        "column": 101,
        "offset": 100,
        "endLine": 1,
        "endColumn": 102,
        "endOffset": 101
      },
      "modes": [],
      "params": [],
      "body": [
        {
          "kind": "literalElement",
          "name": "detail",
          "attributes": [],
          "body": [
            {
              "kind": "valueOf",
              "select": {
                "kind": "contextItem",
                "span": {
                  "start": 0,
                  "end": 1,
                  "line": 1,
                  "column": 1,
                  "endLine": 1,
                  "endColumn": 2
                }
              },
              "selectText": ".",
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 140,
                "offset": 139,
                "endLine": 1,
                "endColumn": 150,
                "endOffset": 149
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 330,
            "offset": 329,
            "endLine": 1,
            "endColumn": 331,
            "endOffset": 330
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "apply-templates-child-apply-templates-default.xsl", digest: "8d246d32" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

