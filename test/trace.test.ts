import { describe, expect, it } from 'vitest';

import type { XmlTraceEvent } from '../src/index.js';
import { XsltProcessor } from '../src/index.js';
import { compileAndLoadGeneratedModule } from './codegen/compile.support.js';

function createExpectedTraceEvents(): XmlTraceEvent[] {
  return [
    {
      kind: 'focus-enter',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'document',
        path: '/',
      },
    },
    {
      kind: 'template-enter',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'document',
        path: '/',
      },
      template: {
        match: '/',
        location: expect.any(Object),
      },
    },
    {
      kind: 'instruction-select',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[1]',
      },
      instruction: {
        kind: 'xsl:apply-templates',
        location: expect.any(Object),
      },
    },
    {
      kind: 'instruction-select',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[2]',
      },
      instruction: {
        kind: 'xsl:apply-templates',
        location: expect.any(Object),
      },
    },
    {
      kind: 'focus-enter',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[1]',
      },
    },
    {
      kind: 'template-enter',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[1]',
      },
      template: {
        match: 'item',
        location: expect.any(Object),
      },
    },
    {
      kind: 'instruction-select',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[1]',
      },
      instruction: {
        kind: 'xsl:value-of',
        location: expect.any(Object),
      },
    },
    {
      kind: 'value-read',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[1]',
      },
      instruction: {
        kind: 'xsl:value-of',
        location: expect.any(Object),
      },
    },
    {
      kind: 'focus-enter',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[2]',
      },
    },
    {
      kind: 'template-enter',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[2]',
      },
      template: {
        match: 'item',
        location: expect.any(Object),
      },
    },
    {
      kind: 'instruction-select',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[2]',
      },
      instruction: {
        kind: 'xsl:value-of',
        location: expect.any(Object),
      },
    },
    {
      kind: 'value-read',
      node: {
        documentUri: 'memory:/input.xml',
        kind: 'element',
        path: '/root[1]/item[2]',
      },
      instruction: {
        kind: 'xsl:value-of',
        location: expect.any(Object),
      },
    },
  ];
}

describe('xml node tracing', () => {
  const stylesheet = [
    '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
    '  <xsl:template match="/">',
    '    <items><xsl:apply-templates select="/root/item"/></items>',
    '  </xsl:template>',
    '  <xsl:template match="item">',
    '    <entry><xsl:value-of select="."/></entry>',
    '  </xsl:template>',
    '</xsl:stylesheet>',
  ].join('\n');
  const sourceXml = '<root><item>alpha</item><item>beta</item></root>';

  it('emits focus-enter, template-enter, instruction-select, and value-read events on the interpreter path', () => {
    const events: XmlTraceEvent[] = [];
    const result = new XsltProcessor(stylesheet).transform(
      sourceXml,
      {
        execution: 'interpreter',
        trace: {
          documentUri: 'memory:/input.xml',
          onEvent: (event) => events.push(event),
        },
      },
    );

    expect(result.output).toBe('<items><entry>alpha</entry><entry>beta</entry></items>');
    expect(events).toEqual(createExpectedTraceEvents());
  });

  it('emits focus-enter, template-enter, instruction-select, and value-read events on the native path', () => {
    const events: XmlTraceEvent[] = [];
    const result = new XsltProcessor(stylesheet).transform(
      sourceXml,
      {
        execution: 'native',
        trace: {
          documentUri: 'memory:/input.xml',
          onEvent: (event) => events.push(event),
        },
      },
    );

    expect(result.execution?.resolved).toBe('native');
    expect(result.output).toBe('<items><entry>alpha</entry><entry>beta</entry></items>');
    expect(events).toEqual(createExpectedTraceEvents());
  });

  it('emits focus-enter, template-enter, instruction-select, and value-read events through the generated module path', () => {
    const { diagnostics, exports } = compileAndLoadGeneratedModule(stylesheet, 'trace-native-runtime.xsl');

    expect(diagnostics).toEqual([]);

    const generatedModule = exports as {
      readonly transform: (source: string, ctx?: Parameters<XsltProcessor['transform']>[1]) => ReturnType<XsltProcessor['transform']>;
    };
    const events: XmlTraceEvent[] = [];
    const result = generatedModule.transform(sourceXml, {
      trace: {
        documentUri: 'memory:/input.xml',
        onEvent: (event) => events.push(event),
      },
    });

    expect(result.output).toBe('<items><entry>alpha</entry><entry>beta</entry></items>');
    expect(events).toEqual(createExpectedTraceEvents());
  });

  it('emits path-based xsl:value-of trace events on the native and generated-module paths', () => {
    const pathStylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
      '  <xsl:template match="/">',
      '    <items><xsl:apply-templates select="/root/item"/></items>',
      '  </xsl:template>',
      '  <xsl:template match="item">',
      '    <entry><xsl:value-of select="name"/></entry>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const pathSourceXml = '<root><item><name>alpha</name></item><item><name>beta</name></item></root>';
    const expectedEvents: XmlTraceEvent[] = [
      {
        kind: 'focus-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'document',
          path: '/',
        },
      },
      {
        kind: 'template-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'document',
          path: '/',
        },
        template: {
          match: '/',
          location: expect.any(Object),
        },
      },
      {
        kind: 'instruction-select',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[1]',
        },
        instruction: {
          kind: 'xsl:apply-templates',
          location: expect.any(Object),
        },
      },
      {
        kind: 'instruction-select',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[2]',
        },
        instruction: {
          kind: 'xsl:apply-templates',
          location: expect.any(Object),
        },
      },
      {
        kind: 'focus-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[1]',
        },
      },
      {
        kind: 'template-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[1]',
        },
        template: {
          match: 'item',
          location: expect.any(Object),
        },
      },
      {
        kind: 'instruction-select',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[1]/name[1]',
        },
        instruction: {
          kind: 'xsl:value-of',
          location: expect.any(Object),
        },
      },
      {
        kind: 'value-read',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[1]/name[1]',
        },
        instruction: {
          kind: 'xsl:value-of',
          location: expect.any(Object),
        },
      },
      {
        kind: 'focus-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[2]',
        },
      },
      {
        kind: 'template-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[2]',
        },
        template: {
          match: 'item',
          location: expect.any(Object),
        },
      },
      {
        kind: 'instruction-select',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[2]/name[1]',
        },
        instruction: {
          kind: 'xsl:value-of',
          location: expect.any(Object),
        },
      },
      {
        kind: 'value-read',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'element',
          path: '/root[1]/item[2]/name[1]',
        },
        instruction: {
          kind: 'xsl:value-of',
          location: expect.any(Object),
        },
      },
    ];

    const nativeEvents: XmlTraceEvent[] = [];
    const nativeResult = new XsltProcessor(pathStylesheet).transform(pathSourceXml, {
      execution: 'native',
      trace: {
        documentUri: 'memory:/input.xml',
        onEvent: (event) => nativeEvents.push(event),
      },
    });

    expect(nativeResult.execution?.resolved).toBe('native');
    expect(nativeResult.output).toBe('<items><entry>alpha</entry><entry>beta</entry></items>');
    expect(nativeEvents).toEqual(expectedEvents);

    const { diagnostics, exports } = compileAndLoadGeneratedModule(pathStylesheet, 'trace-path-value-of-native-runtime.xsl');

    expect(diagnostics).toEqual([]);

    const generatedModule = exports as {
      readonly transform: (source: string, ctx?: Parameters<XsltProcessor['transform']>[1]) => ReturnType<XsltProcessor['transform']>;
    };
    const generatedEvents: XmlTraceEvent[] = [];
    const generatedResult = generatedModule.transform(pathSourceXml, {
      trace: {
        documentUri: 'memory:/input.xml',
        onEvent: (event) => generatedEvents.push(event),
      },
    });

    expect(generatedResult.output).toBe('<items><entry>alpha</entry><entry>beta</entry></items>');
    expect(generatedEvents).toEqual(expectedEvents);
  });

  it('emits initial-template trace events without a synthetic focus-enter event', () => {
    const initialTemplateStylesheet = [
      '<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:t="urn:test">',
      '  <xsl:template name="t:main">',
      '    <out>ok</out>',
      '  </xsl:template>',
      '</xsl:stylesheet>',
    ].join('\n');
    const expectedEvents: XmlTraceEvent[] = [
      {
        kind: 'template-enter',
        node: {
          documentUri: 'memory:/input.xml',
          kind: 'document',
          path: '/',
        },
        template: {
          name: '{urn:test}main',
          location: expect.any(Object),
        },
      },
    ];

    const interpreterEvents: XmlTraceEvent[] = [];
    const interpreterResult = new XsltProcessor(initialTemplateStylesheet).transform('<root/>', {
      execution: 'interpreter',
      initialTemplate: 't:main',
      trace: {
        documentUri: 'memory:/input.xml',
        onEvent: (event) => interpreterEvents.push(event),
      },
    });

    expect(interpreterResult.output).toBe('<out xmlns:t="urn:test">ok</out>');
    expect(interpreterEvents).toEqual(expectedEvents);

    const nativeEvents: XmlTraceEvent[] = [];
    const nativeResult = new XsltProcessor(initialTemplateStylesheet).transform('<root/>', {
      execution: 'native',
      initialTemplate: 't:main',
      trace: {
        documentUri: 'memory:/input.xml',
        onEvent: (event) => nativeEvents.push(event),
      },
    });

    expect(nativeResult.execution?.resolved).toBe('native');
    expect(nativeResult.output).toBe('<out xmlns:t="urn:test">ok</out>');
    expect(nativeEvents).toEqual(expectedEvents);

    const { diagnostics, exports } = compileAndLoadGeneratedModule(initialTemplateStylesheet, 'trace-initial-template-native-runtime.xsl');

    expect(diagnostics).toEqual([]);

    const generatedModule = exports as {
      readonly transform: (source: string, ctx?: Parameters<XsltProcessor['transform']>[1]) => ReturnType<XsltProcessor['transform']>;
    };
    const generatedEvents: XmlTraceEvent[] = [];
    const generatedResult = generatedModule.transform('<root/>', {
      initialTemplate: 't:main',
      trace: {
        documentUri: 'memory:/input.xml',
        onEvent: (event) => generatedEvents.push(event),
      },
    });

    expect(generatedResult.output).toBe('<out xmlns:t="urn:test">ok</out>');
    expect(generatedEvents).toEqual(expectedEvents);
  });
});