/**
 * Lazy sequence helpers.
 *
 * XDM sequences are flat, ordered, heterogeneous. Operations should stay
 * lazy (generator-based) unless count / random access is explicitly needed.
 */

import type { XdmItem, XdmSequence } from './types.js';

export function emptySequence(): XdmSequence {
  return [];
}

export function singleton(item: XdmItem): XdmSequence {
  return [item];
}

/** Materialize a sequence into an array. Use sparingly. */
export function materialize(seq: XdmSequence): readonly XdmItem[] {
  return Array.from(seq);
}
