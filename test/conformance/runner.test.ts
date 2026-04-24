import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it } from 'vitest';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SUITE = join(__dirname, '..', '..', 'vendor', 'xslt30-test');
const CATALOG = join(SUITE, 'catalog.xml');

describe('W3C XSLT 3.0 conformance', () => {
  if (!existsSync(CATALOG)) {
    it.skip('suite not present — run: git submodule update --init', () => {
      // Submodule not initialized; see test/conformance/README.md.
    });
    return;
  }

  it.todo('load catalog and execute test cases');
});
