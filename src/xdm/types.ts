import type { Node } from '@xmldom/xmldom';

/** Discriminator for all XDM items. */
export type XdmItemKind = 'atomic' | 'node' | 'function' | 'map' | 'array';

/** Base marker for any XDM item. */
export interface XdmItem {
  readonly xdmKind: XdmItemKind;
}

export interface XdmAtomicValue extends XdmItem {
  readonly xdmKind: 'atomic';
  readonly type: 'xs:boolean' | 'xs:double' | 'xs:string';
  readonly value: boolean | number | string;
}

export interface XdmNode extends XdmItem {
  readonly xdmKind: 'node';
  readonly node: Node;
}

/** An XDM sequence is just an iterable of items. */
export type XdmSequence = Iterable<XdmItem>;

export function createXdmBoolean(value: boolean): XdmAtomicValue {
  return { xdmKind: 'atomic', type: 'xs:boolean', value };
}

export function createXdmNumber(value: number): XdmAtomicValue {
  return { xdmKind: 'atomic', type: 'xs:double', value };
}

export function createXdmString(value: string): XdmAtomicValue {
  return { xdmKind: 'atomic', type: 'xs:string', value };
}

export function createXdmNode(node: Node): XdmNode {
  return { xdmKind: 'node', node };
}
