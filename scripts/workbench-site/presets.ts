export interface WorkbenchPreset {
  readonly id: 'hello-world' | 'parameters-with-defaults' | 'apply-templates-flow';
  readonly label: string;
  readonly description: string;
  readonly sourceXml: {
    readonly uri: string;
    readonly text: string;
  };
  readonly stylesheet: {
    readonly uri: string;
    readonly text: string;
  };
}

export const DEFAULT_PRESET_ID: WorkbenchPreset['id'] = 'hello-world';

export const PRESETS: readonly WorkbenchPreset[] = [
  {
    id: 'hello-world',
    label: 'Hello world',
    description: 'Minimal value extraction and output rendering.',
    sourceXml: {
      uri: 'memory:/workbench/hello-world.xml',
      text: `<root>
  <name>world</name>
</root>`,
    },
    stylesheet: {
      uri: 'memory:/workbench/hello-world.xsl',
      text: `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <hello>
      <xsl:value-of select="/root/name"/>
    </hello>
  </xsl:template>
</xsl:stylesheet>`,
    },
  },
  {
    id: 'parameters-with-defaults',
    label: 'Parameters with defaults',
    description: 'Shows a stylesheet parameter with a useful default result.',
    sourceXml: {
      uri: 'memory:/workbench/parameters-with-defaults.xml',
      text: '<root/>',
    },
    stylesheet: {
      uri: 'memory:/workbench/parameters-with-defaults.xsl',
      text: `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:param name="greeting" select="'hello'"/>
  <xsl:template match="/root">
    <out>
      <xsl:value-of select="$greeting"/>
    </out>
  </xsl:template>
</xsl:stylesheet>`,
    },
  },
  {
    id: 'apply-templates-flow',
    label: 'Apply-templates flow',
    description: 'Shows multi-template rule dispatch over repeated items.',
    sourceXml: {
      uri: 'memory:/workbench/apply-templates-flow.xml',
      text: `<catalog>
  <item>alpha</item>
  <item>beta</item>
</catalog>`,
    },
    stylesheet: {
      uri: 'memory:/workbench/apply-templates-flow.xsl',
      text: `<xsl:stylesheet version="3.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/catalog">
    <items>
      <xsl:apply-templates select="item"/>
    </items>
  </xsl:template>

  <xsl:template match="item">
    <entry>
      <xsl:value-of select="."/>
    </entry>
  </xsl:template>
</xsl:stylesheet>`,
    },
  },
];