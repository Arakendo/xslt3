import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { loadCatalog } from './catalog.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..');

const SUITES = [
  { name: 'XSLT 3.0', catalog: join(REPO_ROOT, 'vendor', 'xslt30-test', 'catalog.xml') },
  { name: 'QT3 (XPath/XQuery 3.1)', catalog: join(REPO_ROOT, 'vendor', 'qt3tests', 'catalog.xml') },
] as const;

for (const suite of SUITES) {
  describe(`W3C conformance — ${suite.name}`, () => {
    if (!existsSync(suite.catalog)) {
      it.skip('suite not present — run: git submodule update --init', () => {});
      return;
    }

    it('catalog loads and reports a nonzero test count', () => {
      const cases = loadCatalog(suite.catalog);
      // eslint-disable-next-line no-console
      console.log(`  ${suite.name}: ${cases.length} test cases discovered`);
      expect(cases.length).toBeGreaterThan(0);
    });

    it.todo('execute test cases (harness not implemented)');
  });
}
