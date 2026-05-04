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
                "endColumn": 158,
                "endOffset": 157
              },
              "selectText": "/root/section/item",
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
                      "name": "section",
                      "span": {
                        "start": 6,
                        "end": 13,
                        "line": 1,
                        "column": 7,
                        "endLine": 1,
                        "endColumn": 14
                      }
                    },
                    "predicates": [],
                    "span": {
                      "start": 6,
                      "end": 13,
                      "line": 1,
                      "column": 7,
                      "endLine": 1,
                      "endColumn": 14
                    }
                  },
                  {
                    "kind": "step",
                    "axis": "child",
                    "nodeTest": {
                      "kind": "nameTest",
                      "name": "item",
                      "span": {
                        "start": 14,
                        "end": 18,
                        "line": 1,
                        "column": 15,
                        "endLine": 1,
                        "endColumn": 19
                      }
                    },
                    "predicates": [],
                    "span": {
                      "start": 14,
                      "end": 18,
                      "line": 1,
                      "column": 15,
                      "endLine": 1,
                      "endColumn": 19
                    }
                  }
                ],
                "span": {
                  "start": 0,
                  "end": 18,
                  "line": 1,
                  "column": 1,
                  "endLine": 1,
                  "endColumn": 19
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
              "name": "section",
              "span": {
                "start": 0,
                "end": 7,
                "line": 1,
                "column": 1,
                "endLine": 1,
                "endColumn": 8
              }
            },
            "predicates": [],
            "span": {
              "start": 0,
              "end": 7,
              "line": 1,
              "column": 1,
              "endLine": 1,
              "endColumn": 8
            }
          },
          {
            "kind": "step",
            "axis": "child",
            "nodeTest": {
              "kind": "nameTest",
              "name": "item",
              "span": {
                "start": 8,
                "end": 12,
                "line": 1,
                "column": 9,
                "endLine": 1,
                "endColumn": 13
              }
            },
            "predicates": [],
            "span": {
              "start": 8,
              "end": 12,
              "line": 1,
              "column": 9,
              "endLine": 1,
              "endColumn": 13
            }
          }
        ],
        "span": {
          "start": 0,
          "end": 12,
          "line": 1,
          "column": 1,
          "endLine": 1,
          "endColumn": 13
        }
      },
      "matchText": "section/item",
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
                "endColumn": 158,
                "endOffset": 157
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
                        "column": 292,
                        "offset": 291,
                        "endLine": 1,
                        "endColumn": 293,
                        "endOffset": 292
                      }
                    }
                  ],
                  "location": {
                    "source": "<stylesheet>",
                    "line": 1,
                    "column": 140,
                    "offset": 139,
                    "endLine": 1,
                    "endColumn": 158,
                    "endOffset": 157
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 254,
                "offset": 253,
                "endLine": 1,
                "endColumn": 255,
                "endOffset": 254
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 219,
            "offset": 218,
            "endLine": 1,
            "endColumn": 220,
            "endOffset": 219
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
                "endColumn": 158,
                "endOffset": 157
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 390,
            "offset": 389,
            "endLine": 1,
            "endColumn": 391,
            "endOffset": 390
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "apply-templates-nested-match-for-each-apply-templates-default.xsl", digest: "46d5ca45" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

