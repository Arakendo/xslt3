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
                "column": 111,
                "offset": 110,
                "endLine": 1,
                "endColumn": 112,
                "endOffset": 111
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
      },
      "matchText": "/root/section/item",
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
                "column": 225,
                "offset": 224,
                "endLine": 1,
                "endColumn": 229,
                "endOffset": 228
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
                        "column": 225,
                        "offset": 224,
                        "endLine": 1,
                        "endColumn": 229,
                        "endOffset": 228
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
                    "column": 225,
                    "offset": 224,
                    "endLine": 1,
                    "endColumn": 229,
                    "endOffset": 228
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 232,
                "offset": 231,
                "endLine": 1,
                "endColumn": 233,
                "endOffset": 232
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 197,
            "offset": 196,
            "endLine": 1,
            "endColumn": 198,
            "endOffset": 197
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
                "column": 225,
                "offset": 224,
                "endLine": 1,
                "endColumn": 229,
                "endOffset": 228
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 384,
            "offset": 383,
            "endLine": 1,
            "endColumn": 385,
            "endOffset": 384
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "apply-templates-absolute-nested-match-default-for-each-apply-templates.xsl", digest: "647d9fcb" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

