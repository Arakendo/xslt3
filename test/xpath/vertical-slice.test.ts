import { describe, expect, it } from 'vitest';

import { parseXml } from '../../src/xml/parse.js';
import { createXdmNode, type XdmAtomicValue, type XdmNode } from '../../src/xdm/types.js';
import { evaluate } from '../../src/xpath/eval/evaluator.js';
import type { DynamicContext } from '../../src/xpath/eval/context.js';
import { parseXPath } from '../../src/xpath/parse/parser.js';

function createContext(xml: string): DynamicContext {
  return {
    staticContext: {
      namespaces: new Map(),
      defaultElementNamespace: '',
    },
    contextItem: createXdmNode(parseXml(xml)),
    contextPosition: 1,
    contextSize: 1,
    variables: new Map(),
  };
}

describe('XPath MVP+1 vertical slice', () => {
  it('parses and evaluates 1 + 2', () => {
    const ast = parseXPath('1 + 2');
    const result = [...evaluate(ast, createContext('<root/>'))] as XdmAtomicValue[];

    expect(ast).toMatchObject({ kind: 'binary', operator: '+' });
    expect(result).toEqual([{ xdmKind: 'atomic', type: 'xs:double', value: 3 }]);
  });

  it('parses and evaluates //foo from the document root', () => {
    const ast = parseXPath('//foo');
    const result = [...evaluate(ast, createContext('<root><foo/><branch><foo/></branch></root>'))] as XdmNode[];

    expect(ast).toMatchObject({ kind: 'path', absolute: true });
    expect(result.map((item) => item.node.nodeName)).toEqual(['foo', 'foo']);
  });

  it('parses and evaluates foo/bar[1] with numeric predicates', () => {
    const ast = parseXPath('foo/bar[1]');
    const result = [...evaluate(ast, createContext('<foo><bar>A</bar><bar>B</bar></foo>'))] as XdmNode[];

    expect(ast).toMatchObject({ kind: 'path', absolute: false });
    expect(result).toHaveLength(1);
    expect(result[0]?.node.nodeName).toBe('bar');
    expect(result[0]?.node.textContent).toBe('A');
  });
});