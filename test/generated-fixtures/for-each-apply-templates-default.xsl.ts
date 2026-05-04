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
              "kind": "forEach",
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
              },
              "selectText": "/root/item",
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
                        "column": 133,
                        "offset": 132,
                        "endLine": 1,
                        "endColumn": 143,
                        "endOffset": 142
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
                            "column": 189,
                            "offset": 188,
                            "endLine": 1,
                            "endColumn": 190,
                            "endOffset": 189
                          }
                        }
                      ],
                      "location": {
                        "source": "<stylesheet>",
                        "line": 1,
                        "column": 180,
                        "offset": 179,
                        "endLine": 1,
                        "endColumn": 181,
                        "endOffset": 180
                      }
                    }
                  ],
                  "location": {
                    "source": "<stylesheet>",
                    "line": 1,
                    "column": 145,
                    "offset": 144,
                    "endLine": 1,
                    "endColumn": 146,
                    "endOffset": 145
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 133,
                "offset": 132,
                "endLine": 1,
                "endColumn": 143,
                "endOffset": 142
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
                "column": 133,
                "offset": 132,
                "endLine": 1,
                "endColumn": 143,
                "endOffset": 142
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 295,
            "offset": 294,
            "endLine": 1,
            "endColumn": 296,
            "endOffset": 295
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "for-each-apply-templates-default.xsl", digest: "d58458e5" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

