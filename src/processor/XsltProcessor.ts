import type { TransformOptions, TransformResult } from './types.js';

/**
 * Top-level XSLT 3.0 processor.
 *
 * This is a scaffold. The compilation pipeline, XPath 3.1 evaluator, and
 * instruction library will be wired in here as they are implemented.
 */
export class XsltProcessor {
  private readonly stylesheetSource: string;

  constructor(stylesheetSource: string) {
    this.stylesheetSource = stylesheetSource;
  }

  /**
   * Transform an XML source document using the compiled stylesheet.
   *
   * @param _sourceXml - Serialized XML source document.
   * @param _options - Optional transform parameters.
   */
  transform(_sourceXml: string, _options: TransformOptions = {}): TransformResult {
    if (this.stylesheetSource.length === 0) {
      throw new Error('Stylesheet source is empty.');
    }
    // TODO: parse stylesheet -> compile -> evaluate against source
    throw new Error('XsltProcessor.transform is not yet implemented.');
  }
}
