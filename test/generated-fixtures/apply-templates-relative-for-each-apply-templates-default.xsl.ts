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
                "endColumn": 149,
                "endOffset": 148
              },
              "selectText": "root/item",
              "select": {
                "kind": "path",
                "absolute": false,
                "steps": [
                  {
                    "kind": "step",
                    "axis": "child",
                    "nodeTest": {
                      "kind": "nameTest",
                      "name": "root",
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
                  },
                  {
                    "kind": "step",
                    "axis": "child",
                    "nodeTest": {
                      "kind": "nameTest",
                      "name": "item",
                      "span": {
                        "start": 5,
                        "end": 9,
                        "line": 1,
                        "column": 6,
                        "endLine": 1,
                        "endColumn": 10
                      }
                    },
                    "predicates": [],
                    "span": {
                      "start": 5,
                      "end": 9,
                      "line": 1,
                      "column": 6,
                      "endLine": 1,
                      "endColumn": 10
                    }
                  }
                ],
                "span": {
                  "start": 0,
                  "end": 9,
                  "line": 1,
                  "column": 1,
                  "endLine": 1,
                  "endColumn": 10
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
                "endColumn": 149,
                "endOffset": 148
              }
            },
            {
              "kind": "literalElement",
              "name": "details",
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
                          "name": "group",
                          "span": {
                            "start": 0,
                            "end": 5,
                            "line": 1,
                            "column": 1,
                            "endLine": 1,
                            "endColumn": 6
                          }
                        },
                        "predicates": [],
                        "span": {
                          "start": 0,
                          "end": 5,
                          "line": 1,
                          "column": 1,
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
                  "selectText": "group",
                  "body": [
                    {
                      "kind": "applyTemplates",
                      "withParams": [],
                      "location": {
                        "source": "<stylesheet>",
                        "line": 1,
                        "column": 275,
                        "offset": 274,
                        "endLine": 1,
                        "endColumn": 276,
                        "endOffset": 275
                      }
                    }
                  ],
                  "location": {
                    "source": "<stylesheet>",
                    "line": 1,
                    "column": 140,
                    "offset": 139,
                    "endLine": 1,
                    "endColumn": 149,
                    "endOffset": 148
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 237,
                "offset": 236,
                "endLine": 1,
                "endColumn": 238,
                "endOffset": 237
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 202,
            "offset": 201,
            "endLine": 1,
            "endColumn": 203,
            "endOffset": 202
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
                "endColumn": 149,
                "endOffset": 148
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 373,
            "offset": 372,
            "endLine": 1,
            "endColumn": 374,
            "endOffset": 373
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "apply-templates-relative-for-each-apply-templates-default.xsl", digest: "5ec8b162" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

