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
          }
        ],
        "span": {
          "start": 0,
          "end": 5,
          "line": 1,
          "column": 1,
          "endLine": 1,
          "endColumn": 6
        }
      },
      "matchText": "/root",
      "location": {
        "source": "<stylesheet>",
        "line": 1,
        "column": 101,
        "offset": 100,
        "endLine": 1,
        "endColumn": 106,
        "endOffset": 105
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
              "selectText": "item",
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
                        "column": 137,
                        "offset": 136,
                        "endLine": 1,
                        "endColumn": 141,
                        "endOffset": 140
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
                            "column": 137,
                            "offset": 136,
                            "endLine": 1,
                            "endColumn": 141,
                            "endOffset": 140
                          },
                          "selectText": "detail",
                          "select": {
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
                          }
                        }
                      ],
                      "location": {
                        "source": "<stylesheet>",
                        "line": 1,
                        "column": 178,
                        "offset": 177,
                        "endLine": 1,
                        "endColumn": 179,
                        "endOffset": 178
                      }
                    }
                  ],
                  "location": {
                    "source": "<stylesheet>",
                    "line": 1,
                    "column": 143,
                    "offset": 142,
                    "endLine": 1,
                    "endColumn": 144,
                    "endOffset": 143
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 137,
                "offset": 136,
                "endLine": 1,
                "endColumn": 141,
                "endOffset": 140
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 108,
            "offset": 107,
            "endLine": 1,
            "endColumn": 109,
            "endOffset": 108
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
        "endColumn": 106,
        "endOffset": 105
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
                "column": 137,
                "offset": 136,
                "endLine": 1,
                "endColumn": 141,
                "endOffset": 140
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 309,
            "offset": 308,
            "endLine": 1,
            "endColumn": 310,
            "endOffset": 309
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "matched-root-for-each-apply-templates.xsl", digest: "b2b31d1f" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

