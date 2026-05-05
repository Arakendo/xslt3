import type { TransformOptions, TransformResult } from './types.js';
import { XTSE0010 } from '../errors/codes.js';
import { XsltError } from '../errors/index.js';
import { compileStylesheet } from '../xslt/compile/compiler.js';
import { runTransform } from '../xslt/eval/transform.js';

export interface XsltProcessorOptions {
  readonly sourceName?: string;
}

/**
 * Top-level XSLT 3.0 processor.
 *
 * This is a scaffold. The compilation pipeline, XPath 3.1 evaluator, and
 * instruction library will be wired in here as they are implemented.
 */
export class XsltProcessor {
  private readonly stylesheetSource: string;
  private readonly stylesheetSourceName: string | undefined;

  constructor(stylesheetSource: string, options: XsltProcessorOptions = {}) {
    this.stylesheetSource = stylesheetSource;
    this.stylesheetSourceName = options.sourceName;
  }

  /**
   * Transform an XML source document using the compiled stylesheet.
   *
   * @param _sourceXml - Serialized XML source document.
   * @param _options - Optional transform parameters.
   */
  transform(_sourceXml: string, _options: TransformOptions = {}): TransformResult {
    if (this.stylesheetSource.length === 0) {
      throw new XsltError(
        XTSE0010,
        'Stylesheet source is empty.',
        undefined,
        undefined,
        {
          suggestions: [{
            kind: 'fix',
            label: 'provide an xsl:stylesheet or xsl:transform document before running the transform',
            confidence: 1,
          }],
        },
      );
    }

    const ir = compileStylesheet(
      this.stylesheetSource,
      this.stylesheetSourceName === undefined ? undefined : { sourceName: this.stylesheetSourceName },
    );
    return runTransform(ir, _sourceXml, _options);
  }
}
