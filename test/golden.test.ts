import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { XsltProcessor } from '../src/index.js';
import type { TransformOptions } from '../src/index.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const GOLDEN_DIR = join(__dirname, 'golden');

interface GoldenCase {
  readonly name: string;
  readonly dir: string;
}

function discoverCases(): readonly GoldenCase[] {
  if (!existsSync(GOLDEN_DIR)) return [];
  return readdirSync(GOLDEN_DIR)
    .filter((name) => {
      const full = join(GOLDEN_DIR, name);
      return statSync(full).isDirectory() && existsSync(join(full, 'stylesheet.xsl'));
    })
    .map((name) => ({ name, dir: join(GOLDEN_DIR, name) }));
}

function readOptions(dir: string): TransformOptions {
  const path = join(dir, 'options.json');
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, 'utf8')) as TransformOptions;
}

function normalizeXml(s: string): string {
  return s.replace(/\r\n/g, '\n').trim();
}

const cases = discoverCases();

describe('golden tests', () => {
  if (cases.length === 0) {
    it.skip('no golden cases yet', () => {
      // Add a folder under test/golden/ with stylesheet.xsl, input.xml, expected.xml.
    });
    return;
  }

  for (const c of cases) {
    it(c.name, () => {
      const stylesheet = readFileSync(join(c.dir, 'stylesheet.xsl'), 'utf8');
      const input = readFileSync(join(c.dir, 'input.xml'), 'utf8');
      const expected = readFileSync(join(c.dir, 'expected.xml'), 'utf8');
      const options = readOptions(c.dir);

      const proc = new XsltProcessor(stylesheet);
      const { output } = proc.transform(input, options);

      expect(normalizeXml(output)).toBe(normalizeXml(expected));
    });
  }
});
