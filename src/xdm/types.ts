/**
 * Minimal XDM (XPath Data Model) type stubs.
 *
 * Shapes are intentionally tiny for M0. They will be expanded as the XDM
 * layer is implemented in src/xdm/atomic/ and src/xdm/node/.
 */

/** Discriminator for all XDM items. */
export type XdmItemKind = 'atomic' | 'node' | 'function' | 'map' | 'array';

/** Base marker for any XDM item. */
export interface XdmItem {
  readonly xdmKind: XdmItemKind;
}

/** An XDM sequence is just an iterable of items. */
export type XdmSequence = Iterable<XdmItem>;
