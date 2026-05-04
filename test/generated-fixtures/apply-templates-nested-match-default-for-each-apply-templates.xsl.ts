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
                "column": 219,
                "offset": 218,
                "endLine": 1,
                "endColumn": 223,
                "endOffset": 222
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
                        "column": 219,
                        "offset": 218,
                        "endLine": 1,
                        "endColumn": 223,
                        "endOffset": 222
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
                    "column": 219,
                    "offset": 218,
                    "endLine": 1,
                    "endColumn": 223,
                    "endOffset": 222
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 226,
                "offset": 225,
                "endLine": 1,
                "endColumn": 227,
                "endOffset": 226
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 191,
            "offset": 190,
            "endLine": 1,
            "endColumn": 192,
            "endOffset": 191
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
                "column": 219,
                "offset": 218,
                "endLine": 1,
                "endColumn": 223,
                "endOffset": 222
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 378,
            "offset": 377,
            "endLine": 1,
            "endColumn": 379,
            "endOffset": 378
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "apply-templates-nested-match-default-for-each-apply-templates.xsl", digest: "5876bbd5" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

