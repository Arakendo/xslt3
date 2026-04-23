import { describe, it, expect } from 'vitest';
import { VERSION, XsltProcessor } from '../src/index.js';

describe('@arakendo/xslt scaffold', () => {
  it('exposes a version string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('constructs an XsltProcessor', () => {
    const proc = new XsltProcessor('<xsl:stylesheet/>');
    expect(proc).toBeInstanceOf(XsltProcessor);
  });

  it('throws until transform is implemented', () => {
    const proc = new XsltProcessor('<xsl:stylesheet/>');
    expect(() => proc.transform('<root/>')).toThrow(/not yet implemented/);
  });
});
