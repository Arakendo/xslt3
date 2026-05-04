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
          }
        ],
        "span": {
          "start": 0,
          "end": 13,
          "line": 1,
          "column": 1,
          "endLine": 1,
          "endColumn": 14
        }
      },
      "matchText": "/root/section",
      "location": {
        "source": "<stylesheet>",
        "line": 1,
        "column": 101,
        "offset": 100,
        "endLine": 1,
        "endColumn": 114,
        "endOffset": 113
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
                        "column": 145,
                        "offset": 144,
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
                          "kind": "applyTemplates",
                          "withParams": [],
                          "location": {
                            "source": "<stylesheet>",
                            "line": 1,
                            "column": 195,
                            "offset": 194,
                            "endLine": 1,
                            "endColumn": 196,
                            "endOffset": 195
                          }
                        }
                      ],
                      "location": {
                        "source": "<stylesheet>",
                        "line": 1,
                        "column": 186,
                        "offset": 185,
                        "endLine": 1,
                        "endColumn": 187,
                        "endOffset": 186
                      }
                    }
                  ],
                  "location": {
                    "source": "<stylesheet>",
                    "line": 1,
                    "column": 151,
                    "offset": 150,
                    "endLine": 1,
                    "endColumn": 152,
                    "endOffset": 151
                  }
                }
              ],
              "location": {
                "source": "<stylesheet>",
                "line": 1,
                "column": 145,
                "offset": 144,
                "endLine": 1,
                "endColumn": 149,
                "endOffset": 148
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 116,
            "offset": 115,
            "endLine": 1,
            "endColumn": 117,
            "endOffset": 116
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
        "endColumn": 114,
        "endOffset": 113
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
                "column": 145,
                "offset": 144,
                "endLine": 1,
                "endColumn": 149,
                "endOffset": 148
              }
            }
          ],
          "location": {
            "source": "<stylesheet>",
            "line": 1,
            "column": 301,
            "offset": 300,
            "endLine": 1,
            "endColumn": 302,
            "endOffset": 301
          }
        }
      ]
    }
  ]
} satisfies StylesheetIR;

export const source = { path: "matched-nested-root-for-each-apply-templates-default.xsl", digest: "3e086e77" } as const;

export function transform(sourceXml: string, ctx: TransformContext = {}): TransformResult {
  return transformCompiledStylesheet(stylesheet, sourceXml, ctx);
}

export default { source, transform };

