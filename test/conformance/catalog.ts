/**
 * Walks a W3C test catalog (XSLT 3.0 or QT3) and yields test cases.
 *
 * The catalog format is shared between the two suites:
 *
 *   catalog.xml
 *     └── <test-set file="..."/>...
 *           └── <test-set name="...">
 *                 └── <test-case name="...">
 *                       ├── <description/>
 *                       ├── <dependency type="..." value="..."/>
 *                       ├── <environment ref="..."/>
 *                       ├── <test>...</test>
 *                       └── <result>... assertions ...</result>
 *
 * We read lazily and stay minimal — the point for now is just to count
 * things and filter by feature so we can grow pass rates over time.
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { parseXml } from '../../src/xml/parse.js';

export interface TestCase {
  readonly setName: string;
  readonly caseName: string;
  readonly description: string;
  readonly dependencies: readonly TestDependency[];
  /** Absolute path to the test-set file for later deep reading. */
  readonly setPath: string;
}

export interface TestDependency {
  readonly type: string;
  readonly value: string;
  /** true = satisfied required, false = must NOT be present. */
  readonly satisfied: boolean;
}

export function loadCatalog(catalogPath: string): readonly TestCase[] {
  const absCatalog = resolve(catalogPath);
  const catalogDir = dirname(absCatalog);
  const catalogDoc = parseXml(readFileSync(absCatalog, 'utf8'));

  const cases: TestCase[] = [];
  const setRefs = Array.from(catalogDoc.getElementsByTagName('test-set'));

  for (const ref of setRefs) {
    const file = ref.getAttribute('file');
    if (!file) continue;
    const setPath = join(catalogDir, file);

    let setDoc;
    try {
      setDoc = parseXml(readFileSync(setPath, 'utf8'));
    } catch {
      continue; // missing or unreadable test-set files — skip silently
    }

    const setEl = setDoc.getElementsByTagName('test-set')[0];
    if (!setEl) continue;
    const setName = setEl.getAttribute('name') ?? file;

    for (const tc of Array.from(setDoc.getElementsByTagName('test-case'))) {
      const caseName = tc.getAttribute('name') ?? '<unnamed>';
      const description =
        tc.getElementsByTagName('description')[0]?.textContent?.trim() ?? '';

      const deps: TestDependency[] = [];
      for (const d of Array.from(tc.getElementsByTagName('dependency'))) {
        deps.push({
          type: d.getAttribute('type') ?? '',
          value: d.getAttribute('value') ?? '',
          satisfied: d.getAttribute('satisfied') !== 'false',
        });
      }

      cases.push({
        setName,
        caseName,
        description,
        dependencies: deps,
        setPath,
      });
    }
  }

  return cases;
}
